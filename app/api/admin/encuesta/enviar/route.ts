import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin, logError } from '@/lib/supabase';
import { resend, FROM_EMAIL, REPLY_TO, htmlEncuesta, textoEncuesta, asuntoEncuesta, headersBaja } from '@/lib/resend';
import { extraerContactos, guardarContactos, contactosDeViaje, emailsDeBaja, traerTodo } from '@/lib/contactos';
import { enviarEnLotes } from '@/lib/envio';
import { validarEmail } from '@/lib/validaciones';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function armarMail(base: string, viaje: string, nombre: string, tokenEncuesta: string, tokenBaja: string) {
  const opts = { nombre, viaje, linkEncuesta: `${base}/encuesta/${tokenEncuesta}`, linkBaja: `${base}/baja/${tokenBaja}` };
  return {
    from: FROM_EMAIL,
    subject: asuntoEncuesta(viaje),
    html: htmlEncuesta(opts),
    text: textoEncuesta(opts),
    headers: headersBaja(`${base}/api/baja/${tokenBaja}`),
    ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
  };
}

export async function POST(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { viaje: viajeRaw, modo, emailPrueba, origen } = await req.json().catch(() => ({}));
  const viaje = String(viajeRaw || '').trim().slice(0, 120);
  if (viaje.length < 3) return NextResponse.json({ success: false, error: 'Escribí el nombre del viaje (ej: Córdoba - 11/10/2026).' });

  const base = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  if (!base) return NextResponse.json({ success: false, error: 'Falta la variable NEXT_PUBLIC_APP_URL: sin ella los links del mail no funcionan.' });

  if (modo === 'prueba') {
    const email = String(emailPrueba || '').trim().toLowerCase();
    if (!validarEmail(email)) return NextResponse.json({ success: false, error: 'Escribí un email válido para la prueba.' });
    const { error } = await resend.emails.send({ ...armarMail(base, viaje, 'Juan', 'prueba', 'prueba'), to: email });
    if (error) {
      await logError('Encuesta: mail de prueba', error.message);
      return NextResponse.json({ success: false, error: `No se pudo enviar: ${error.message}` });
    }
    return NextResponse.json({ success: true, mensaje: `Mail de prueba enviado a ${email}. Revisá también la carpeta de spam.` });
  }

  if (modo !== 'todos') return NextResponse.json({ success: false, error: 'Modo inválido.' });

  if (FROM_EMAIL.includes('resend.dev')) {
    return NextResponse.json({
      success: false,
      error: 'Todavía usás el remitente de prueba de Resend (onboarding@resend.dev). Verificá tu dominio en Resend y cargá RESEND_FROM_EMAIL antes de enviar a todos.',
    });
  }

  const sb = supabaseAdmin();
  try {
    if (origen !== 'lista') {
      const { data: reservas, error } = await sb.from('reservas_bondi').select('*, reservas_bondi_pasajeros(*)');
      if (error) throw new Error(error.message);
      const contactos = extraerContactos(reservas || []);
      if (contactos.length === 0) return NextResponse.json({ success: false, error: 'No hay mails de pasajeros en Reservas Bondi.' });
      await guardarContactos(sb, contactos, viaje);
    }
    const lista = await contactosDeViaje(sb, viaje);
    if (lista.length === 0) return NextResponse.json({ success: false, error: `No hay contactos guardados para "${viaje}".` });

    const [bajas, yaEnviadas] = await Promise.all([
      emailsDeBaja(sb),
      traerTodo<{ email: string }>((d, h) => sb.from('encuestas_bondi').select('email').eq('viaje', viaje).range(d, h)),
    ]);
    const yaSet = new Set(yaEnviadas.map((e) => e.email));
    const dadosDeBaja = lista.filter((c) => bajas.has(c.email)).length;
    const yaRecibieron = lista.filter((c) => !bajas.has(c.email) && yaSet.has(c.email)).length;
    const pendientes = lista.filter((c) => !bajas.has(c.email) && !yaSet.has(c.email));

    if (pendientes.length === 0) {
      return NextResponse.json({ success: true, enviados: 0, mensaje: 'No quedaba nadie para enviar: todos ya la recibieron o se dieron de baja.' });
    }

    const { data: filas, error: errInsert } = await sb
      .from('encuestas_bondi')
      .insert(pendientes.map((c) => ({ viaje, email: c.email, nombre: c.nombre })))
      .select('email, nombre, token');
    if (errInsert || !filas) throw new Error(errInsert?.message || 'No se pudieron preparar las encuestas.');

    const tokenBaja = new Map(pendientes.map((c) => [c.email, c.token_baja]));

    const { enviados, fallidos } = await enviarEnLotes(
      filas,
      (f) => ({ ...armarMail(base, viaje, f.nombre, f.token, tokenBaja.get(f.email)!), to: f.email }),
      'Encuesta',
      async (lote) => {
        await sb.from('encuestas_bondi').delete().in('token', lote.map((f) => f.token));
      }
    );

    return NextResponse.json({
      success: enviados > 0,
      enviados,
      fallidos,
      mensaje:
        `Encuesta enviada a ${enviados} personas.` +
        (fallidos ? ` ${fallidos} no se pudieron enviar (podés volver a lanzar el envío: solo se reintenta a esas).` : '') +
        (yaRecibieron ? ` ${yaRecibieron} ya la habían recibido.` : '') +
        (dadosDeBaja ? ` ${dadosDeBaja} se habían dado de baja y se omitieron.` : ''),
    });
  } catch (e: any) {
    await logError('Encuesta: envío a todos', e.message);
    return NextResponse.json({ success: false, error: e.message });
  }
}
