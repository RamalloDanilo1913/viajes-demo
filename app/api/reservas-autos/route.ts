import { NextResponse } from 'next/server';
import { supabaseAdmin, logError } from '@/lib/supabase';
import { validarDni, validarEmail, validarTelefono, linkSoporte } from '@/lib/validaciones';
import { resend, FROM_EMAIL, htmlNuevaSolicitud } from '@/lib/resend';
import { ipDe, limpiarTexto, superaLimite } from '@/lib/seguridad';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (superaLimite(`reservas-autos:${ipDe(req)}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json({ success: false, str: 'Demasiados intentos. Probá de nuevo en unos minutos.' }, { status: 429 });
  }

  const crudo = await req.json().catch(() => null);
  if (!crudo || typeof crudo !== 'object') return NextResponse.json({ success: false, str: 'Error: solicitud inválida.' });
  const datos = {
    idViaje: limpiarTexto(String(crudo.idViaje ?? ''), 64),
    nombre: limpiarTexto(crudo.nombre, 60),
    apellido: limpiarTexto(crudo.apellido, 60),
    dni: limpiarTexto(String(crudo.dni ?? ''), 8),
    email: limpiarTexto(crudo.email, 120),
    telefono: limpiarTexto(String(crudo.telefono ?? ''), 15),
    telEmergencia: limpiarTexto(String(crudo.telEmergencia ?? ''), 15),
  };

  if (!datos.idViaje || !datos.nombre) return NextResponse.json({ success: false, str: 'Error: Faltan datos de la solicitud.' });
  if (!validarDni(datos.dni)) return NextResponse.json({ success: false, str: 'Error: El DNI debe contener exactamente 7 u 8 números.' });
  if (!validarTelefono(datos.telefono)) return NextResponse.json({ success: false, str: 'Error: El teléfono debe tener entre 10 y 15 números.' });
  if (!validarEmail(datos.email)) return NextResponse.json({ success: false, str: 'Error: El email ingresado no es válido.' });
  if (!datos.apellido) return NextResponse.json({ success: false, str: 'Error: Falta el apellido.' });
  if (datos.telEmergencia && datos.telEmergencia !== '-' && !validarTelefono(datos.telEmergencia)) {
    return NextResponse.json({ success: false, str: 'Error: El teléfono de emergencia debe tener entre 10 y 15 números.' });
  }

  const sb = supabaseAdmin();

  const { data: viaje } = await sb.from('viajes_autos').select('*').eq('id', datos.idViaje).single();
  if (!viaje) return NextResponse.json({ success: false, str: 'Error: El auto seleccionado ya no está disponible.' });
  if (viaje.cupos <= 0) return NextResponse.json({ success: false, str: 'Error: Ya no quedan lugares disponibles en este auto.' });
  if (viaje.fecha_salida && new Date(viaje.fecha_salida) < new Date()) {
    return NextResponse.json({ success: false, str: 'Error: No podés reservar un viaje que ya pasó.' });
  }

  const { data: nueva, error } = await sb
    .from('reservas_autos')
    .insert({
      id_viaje: datos.idViaje,
      nombre_pasajero: datos.nombre,
      apellido_pasajero: datos.apellido,
      dni_pasajero: datos.dni,
      email_pasajero: datos.email,
      telefono_pasajero: datos.telefono,
      tel_emergencia_pasajero: datos.telEmergencia || '-',
      fecha_salida_viaje: viaje.fecha_salida,
      conductor_nombre: viaje.nombre,
      conductor_apellido: viaje.apellido,
      conductor_dni: viaje.dni,
      conductor_email: viaje.email,
      conductor_whatsapp: viaje.whatsapp,
      partido: viaje.partido,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ success: false, str: 'Error: Ya registraste una solicitud para este auto. Buscá otro auto disponible.' });
    }
    await logError('reservas-autos POST - insert', error);
    return NextResponse.json({ success: false, str: 'El sistema está procesando otra solicitud. Por favor, intentá de nuevo en unos segundos.' });
  }

  const { data: perfil } = await sb.from('perfiles').select('*').eq('dni', datos.dni).eq('apellido', datos.apellido).maybeSingle();
  const ratingHtml =
    perfil && perfil.cant_pasajero > 0
      ? `<p style="margin:4px 0;"><strong>Calificación como pasajero:</strong> ⭐ ${Math.round((perfil.suma_estrellas_pasajero / perfil.cant_pasajero) * 10) / 10} (${perfil.cant_pasajero} viaje${perfil.cant_pasajero === 1 ? '' : 's'})</p>`
      : `<p style="margin:4px 0; color:#64748b;"><em>Es su primer viaje con la filial, todavía no tiene calificaciones.</em></p>`;

  const base = process.env.NEXT_PUBLIC_APP_URL;
  const linkAceptar = `${base}/api/reservas-autos/accion?token=${nueva.token}&action=aceptar`;
  const linkRechazar = `${base}/api/reservas-autos/accion?token=${nueva.token}&action=rechazar`;

  try {
    if (!validarEmail(viaje.email)) throw new Error('El conductor no tiene un email válido cargado.');
    await resend.emails.send({
      from: FROM_EMAIL,
      to: viaje.email,
      subject: `Nueva solicitud para tu viaje a ${viaje.partido}`,
      html: htmlNuevaSolicitud({
        partido: viaje.partido,
        nombrePasajero: `${datos.nombre} ${datos.apellido}`,
        dni: datos.dni,
        telefono: datos.telefono,
        ratingHtml,
        linkAceptar,
        linkRechazar,
      }),
    });
  } catch (mailError) {
    await logError('reservas-autos POST - email a conductor', mailError);
    return NextResponse.json({
      success: true,
      aviso: true,
      str: 'Tu solicitud fue cargada correctamente, pero hubo un fallo en el proceso al avisarle al conductor. Comunicate con soporte para que lo resuelvan.',
      soporteUrl: linkSoporte(`Hola, cargué una solicitud para viajar a ${viaje.partido} pero no le llegó el aviso al conductor. Mi DNI es ${datos.dni}.`),
    });
  }

  return NextResponse.json({
    success: true,
    str: '¡Listo! Le avisamos al conductor por email. Ojo: solo te vamos a avisar por email si acepta tu solicitud — si la rechaza o no responde, no recibís ninguna notificación, así que te recomendamos seguir mirando otros autos disponibles.',
  });
}
