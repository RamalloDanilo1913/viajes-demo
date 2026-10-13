import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, logError } from '@/lib/supabase';
import { linkWhatsapp, linkSoporte, validarEmail } from '@/lib/validaciones';
import { resend, FROM_EMAIL, htmlAceptacion } from '@/lib/resend';
import { esc } from '@/lib/contactos';
import { esUuid } from '@/lib/seguridad';

export const dynamic = 'force-dynamic';

function paginaSimple(titulo: string, mensaje: string, mostrarSoporte = false) {
  const boton = mostrarSoporte
    ? `<a href="${esc(linkSoporte('Hola, tuve un problema en la web de viajes: ' + titulo))}" style="display:inline-block;margin-top:16px;background:#15803d;color:#fff;text-decoration:none;padding:11px 18px;border-radius:6px;font-weight:700;font-size:13px;">Contactar a soporte</a>`
    : '';
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
  body{font-family:'Roboto',Arial,sans-serif;background:#f1f5f9;margin:0;padding:0;}
  .box{max-width:420px;margin:60px auto;background:#fff;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.08);padding:30px 25px;text-align:center;}
  h1{color:#001f3f;font-size:19px;font-style:italic;margin:0 0 12px;}
  p{color:#334155;font-size:14.5px;line-height:1.6;}
  </style></head><body><div class="box"><h1>${esc(titulo)}</h1><p>${esc(mensaje)}</p>${boton}</div></body></html>`;
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'",
    },
  });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const action = req.nextUrl.searchParams.get('action');
  if (!esUuid(token) || (action !== 'aceptar' && action !== 'rechazar')) {
    return paginaSimple('Falta información', 'El enlace no es válido.');
  }

  const sb = supabaseAdmin();
  const { data: reserva } = await sb.from('reservas_autos').select('*').eq('token', token).single();
  if (!reserva) return paginaSimple('No encontrado', 'No pudimos encontrar esta solicitud.');

  const nombrePasajero = `${reserva.nombre_pasajero} ${reserva.apellido_pasajero}`;

  if (reserva.estado !== 'Pendiente') {
    return paginaSimple('Ya procesada', `Esta solicitud ya había sido ${reserva.estado === 'Aceptada' ? 'aceptada' : 'rechazada'} anteriormente.`);
  }

  if (action === 'rechazar') {
    await sb.from('reservas_autos').update({ estado: 'Rechazada' }).eq('id', reserva.id);
    return paginaSimple('Listo', `Marcaste como no disponible el lugar para ${nombrePasajero}. No le enviamos ningún aviso (solo se notifica al pasajero cuando se acepta una solicitud).`);
  }

  const { data: yaAceptada } = await sb
    .from('reservas_autos')
    .select('id')
    .eq('dni_pasajero', reserva.dni_pasajero)
    .eq('partido', reserva.partido)
    .eq('estado', 'Aceptada')
    .neq('id', reserva.id)
    .maybeSingle();

  if (yaAceptada) {
    await sb.from('reservas_autos').update({ estado: 'Cancelada' }).eq('id', reserva.id);
    return paginaSimple(
      'Ya tiene lugar en otro auto',
      `${nombrePasajero} ya tiene un lugar confirmado en otro auto para ${reserva.partido}, así que esta solicitud quedó cancelada sola. Tu auto sigue con la misma disponibilidad, no se descontó ningún cupo.`
    );
  }

  const { data: viajeActualizado } = await sb.rpc('descontar_cupo_auto', { p_id_viaje: reserva.id_viaje });
  if (!viajeActualizado) {
    await sb.from('reservas_autos').update({ estado: 'Rechazada' }).eq('id', reserva.id);
    return paginaSimple('Sin lugares', 'Ya no te quedaban lugares disponibles, así que no pudimos confirmar este pasajero. No le enviamos ningún aviso (solo se notifica cuando se acepta una solicitud).');
  }

  await sb.from('reservas_autos').update({ estado: 'Aceptada', fecha_aceptacion: new Date().toISOString() }).eq('id', reserva.id);

  await sb
    .from('reservas_autos')
    .update({ estado: 'Cancelada' })
    .eq('dni_pasajero', reserva.dni_pasajero)
    .eq('partido', reserva.partido)
    .eq('estado', 'Pendiente')
    .neq('id', reserva.id);

  try {
    if (!validarEmail(reserva.email_pasajero)) throw new Error('El pasajero no tiene email válido.');
    await resend.emails.send({
      from: FROM_EMAIL,
      to: reserva.email_pasajero,
      subject: `¡Tu viaje a ${reserva.partido} fue aceptado!`,
      html: htmlAceptacion({
        nombrePasajero,
        nombreConductor: `${reserva.conductor_nombre} ${reserva.conductor_apellido}`,
        partido: reserva.partido,
        linkWhatsapp: linkWhatsapp(reserva.conductor_whatsapp, `${reserva.conductor_nombre} ${reserva.conductor_apellido}`, reserva.partido),
      }),
    });
  } catch (mailError) {
    await logError('reservas-autos accion - email aceptacion', mailError);
    return paginaSimple(
      'Aceptaste el viaje (con un problema)',
      `Aceptaste a ${nombrePasajero} y le guardamos el lugar, pero hubo un fallo técnico al mandarle el email con tu WhatsApp. Escribile vos directamente o avisale a soporte para que lo resuelva.`,
      true
    );
  }

  return paginaSimple('¡Listo!', `Aceptaste a ${nombrePasajero} para tu viaje a ${reserva.partido}. Le enviamos un email con tu WhatsApp para que se ponga en contacto.`);
}
