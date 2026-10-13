import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin, logError } from '@/lib/supabase';
import { resend, FROM_EMAIL, REPLY_TO, htmlPersonalizado, textoPersonalizado, headersBaja } from '@/lib/resend';
import { contactosDeViaje, emailsDeBaja } from '@/lib/contactos';
import { enviarEnLotes } from '@/lib/envio';
import { validarEmail } from '@/lib/validaciones';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data, error } = await supabaseAdmin().from('campanias_bondi').select('*').order('enviado_at', { ascending: false }).limit(10);
  if (error) return NextResponse.json({ error: `${error.message} (¿corriste el SQL de sql/ en Supabase?)` }, { status: 500 });
  return NextResponse.json({ campanias: data || [] });
}

function armarMail(base: string, asunto: string, o: { nombre: string; mensaje: string; botonTexto?: string; botonLink?: string }, tokenBaja: string) {
  const opts = { ...o, linkBaja: `${base}/baja/${tokenBaja}` };
  return {
    from: FROM_EMAIL,
    subject: asunto,
    html: htmlPersonalizado(opts),
    text: textoPersonalizado(opts),
    headers: headersBaja(`${base}/api/baja/${tokenBaja}`),
    ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
  };
}

export async function POST(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const modo = b.modo;
  const asunto = String(b.asunto || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  const mensaje = String(b.mensaje || '').replace(/\r\n/g, '\n').trim().slice(0, 5000);
  const botonTexto = String(b.botonTexto || '').trim().slice(0, 60);
  const botonLink = String(b.botonLink || '').trim().slice(0, 500);
  const viajeLista = String(b.viaje || '').trim();

  if (asunto.length < 3) return NextResponse.json({ success: false, error: 'Escribí el asunto del mail.' });
  if (mensaje.length < 10) return NextResponse.json({ success: false, error: 'Escribí el mensaje del mail.' });

  if (botonTexto || botonLink) {
    let urlOk = false;
    try {
      urlOk = ['http:', 'https:'].includes(new URL(botonLink).protocol);
    } catch {}
    if (!botonTexto || !urlOk) return NextResponse.json({ success: false, error: 'Para el botón completá el texto y un link que empiece con https://' });
  }

  const base = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  if (!base) return NextResponse.json({ success: false, error: 'Falta la variable NEXT_PUBLIC_APP_URL: sin ella el link de baja del mail no funciona.' });

  const contenido = { mensaje, ...(botonTexto ? { botonTexto, botonLink } : {}) };

  if (modo === 'prueba') {
    const email = String(b.emailPrueba || '').trim().toLowerCase();
    if (!validarEmail(email)) return NextResponse.json({ success: false, error: 'Escribí un email válido para la prueba.' });
    const { error } = await resend.emails.send({ ...armarMail(base, asunto, { nombre: 'Juan', ...contenido }, 'prueba'), to: email });
    if (error) {
      await logError('Mail personalizado: prueba', error.message);
      return NextResponse.json({ success: false, error: `No se pudo enviar: ${error.message}` });
    }
    return NextResponse.json({ success: true, mensaje: `Mail de prueba enviado a ${email}. Revisá también la carpeta de spam.` });
  }

  if (modo !== 'enviar') return NextResponse.json({ success: false, error: 'Modo inválido.' });
  if (!viajeLista) return NextResponse.json({ success: false, error: 'Elegí a qué lista de contactos enviar.' });

  if (FROM_EMAIL.includes('resend.dev')) {
    return NextResponse.json({
      success: false,
      error: 'Todavía usás el remitente de prueba de Resend (onboarding@resend.dev). Verificá tu dominio en Resend y cargá RESEND_FROM_EMAIL antes de enviar a todos.',
    });
  }

  const sb = supabaseAdmin();
  try {
    const [lista, bajas] = await Promise.all([contactosDeViaje(sb, viajeLista), emailsDeBaja(sb)]);
    if (lista.length === 0) return NextResponse.json({ success: false, error: `No hay contactos guardados para "${viajeLista}".` });

    const destinatarios = lista.filter((c) => !bajas.has(c.email));
    const dadosDeBaja = lista.length - destinatarios.length;
    if (destinatarios.length === 0) return NextResponse.json({ success: false, error: 'Todos los contactos de esa lista se dieron de baja.' });

    const { enviados, fallidos } = await enviarEnLotes(
      destinatarios,
      (c) => ({ ...armarMail(base, asunto, { nombre: c.nombre, ...contenido }, c.token_baja), to: c.email }),
      'Mail personalizado'
    );

    await sb.from('campanias_bondi').insert({ viaje_lista: viajeLista, asunto, mensaje, enviados, fallidos });

    return NextResponse.json({
      success: enviados > 0,
      enviados,
      fallidos,
      mensaje:
        `Mail enviado a ${enviados} personas de "${viajeLista}".` +
        (fallidos ? ` ${fallidos} no se pudieron enviar (revisá Errores técnicos).` : '') +
        (dadosDeBaja ? ` ${dadosDeBaja} se habían dado de baja y se omitieron.` : ''),
    });
  } catch (e: any) {
    await logError('Mail personalizado: envío', e.message);
    return NextResponse.json({ success: false, error: e.message });
  }
}
