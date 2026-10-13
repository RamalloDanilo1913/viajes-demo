import { esc } from './contactos';
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY || 're_clave_no_configurada');
// con onboarding@resend.dev solo llegan mails a mi cuenta, hay que verificar dominio
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Viajes Filial Capital Federal <onboarding@resend.dev>';

function layout(colorHeader: string, titulo: string, cuerpoHtml: string): string {
  return `
  <div style="font-family:Roboto,Arial,sans-serif;max-width:480px;margin:0 auto;">
    <div style="background:${colorHeader};padding:18px 22px;border-radius:10px 10px 0 0;">
      <h2 style="color:#fff;margin:0;font-style:italic;font-size:16px;text-transform:uppercase;">${titulo}</h2>
    </div>
    <div style="background:#f8fafc;padding:20px 22px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;">
      ${cuerpoHtml}
    </div>
  </div>`;
}

export function htmlNuevaSolicitud(opts: {
  partido: string;
  nombrePasajero: string;
  dni: string;
  telefono: string;
  ratingHtml: string;
  linkAceptar: string;
  linkRechazar: string;
}): string {
  const cuerpo = `
    <p style="margin:4px 0;"><strong>Partido:</strong> ${esc(opts.partido)}</p>
    <p style="margin:4px 0;"><strong>Pasajero:</strong> ${esc(opts.nombrePasajero)}</p>
    <p style="margin:4px 0;"><strong>DNI:</strong> ${esc(opts.dni)}</p>
    <p style="margin:4px 0;"><strong>Teléfono:</strong> ${esc(opts.telefono)}</p>
    ${opts.ratingHtml}
    <p style="margin:18px 0 10px;">¿Le das el lugar en tu auto?</p>
    <a href="${esc(opts.linkAceptar)}" style="display:inline-block;background:#15803d;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:700;margin-right:10px;">Aceptar</a>
    <a href="${esc(opts.linkRechazar)}" style="display:inline-block;background:#991b1b;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:700;">Rechazar</a>
    <p style="margin:16px 0 0; font-size:12px; color:#64748b;"><em>Aclaración: al pasajero solo le avisamos por email si aceptás. Si rechazás o no respondés, no recibe ninguna notificación.</em></p>
  `;
  return layout('#001f3f', 'Nueva solicitud para tu viaje', cuerpo);
}

export function htmlAceptacion(opts: { nombrePasajero: string; nombreConductor: string; partido: string; linkWhatsapp: string }): string {
  const cuerpo = `
    <p>Hola ${esc(opts.nombrePasajero)}, <strong>${esc(opts.nombreConductor)}</strong> aceptó tu solicitud para viajar a ${esc(opts.partido)}.</p>
    <p>Escribile por WhatsApp para coordinar el punto de encuentro:</p>
    <a href="${esc(opts.linkWhatsapp)}" style="display:inline-block;background:#15803d;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:700;">Abrir WhatsApp</a>
  `;
  return layout('#065f46', '¡Tu viaje fue aceptado!', cuerpo);
}

export function htmlPrueba(): string {
  return layout('#001f3f', 'Prueba de envío', '<p>Si recibiste este email, Resend está funcionando correctamente.</p>');
}

export function htmlEncuesta(opts: { nombre: string; viaje: string; linkEncuesta: string; linkBaja: string }): string {
  const saludo = opts.nombre ? `Hola ${esc(opts.nombre)},` : 'Hola,';
  const cuerpo = `
    <p style="margin:0 0 12px;">${saludo}</p>
    <p style="margin:0 0 12px;">Gracias por viajar con la <strong>Filial Capital Federal</strong> (<strong>${esc(opts.viaje)}</strong>). Esperamos que lo hayas disfrutado.</p>
    <p style="margin:0 0 16px;">Nos ayudaría mucho que nos cuentes cómo te fue. Son 2 minutos: una calificación de 1 a 5 estrellas y, si querés, tu opinión y qué podemos mejorar.</p>
    <p style="margin:0 0 18px;text-align:center;">
      <a href="${opts.linkEncuesta}" style="display:inline-block;background:#001f3f;color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:6px;font-weight:700;">Calificar el viaje</a>
    </p>
    <p style="margin:0 0 14px;font-size:12px;color:#64748b;">Si el botón no funciona, copiá y pegá este link en tu navegador:<br>${opts.linkEncuesta}</p>
    <p style="margin:0 0 6px;">Gracias, y nos vemos en el próximo viaje.</p>
    <p style="margin:0;"><strong>Talleres Filial Capital Federal</strong></p>
    <p style="margin:18px 0 0;font-size:11.5px;color:#64748b;">Recibís este mail porque viajaste con nosotros. Si no querés recibir más avisos de la filial, <a href="${opts.linkBaja}" style="color:#64748b;">podés darte de baja acá</a>.</p>
  `;
  return layout('#001f3f', 'Gracias por viajar con nosotros', cuerpo);
}

export function textoEncuesta(opts: { nombre: string; viaje: string; linkEncuesta: string; linkBaja: string }): string {
  return [
    opts.nombre ? `Hola ${opts.nombre},` : 'Hola,',
    '',
    `Gracias por viajar con la Filial Capital Federal (${opts.viaje}). Esperamos que lo hayas disfrutado.`,
    '',
    'Nos ayudaría mucho que nos cuentes cómo te fue. Son 2 minutos: una calificación de 1 a 5 estrellas y, si querés, tu opinión y qué podemos mejorar.',
    '',
    `Calificar el viaje: ${opts.linkEncuesta}`,
    '',
    'Gracias, y nos vemos en el próximo viaje.',
    'Talleres Filial Capital Federal',
    '',
    `Recibís este mail porque viajaste con nosotros. Si no querés recibir más avisos de la filial, podés darte de baja acá: ${opts.linkBaja}`,
  ].join('\n');
}

export function asuntoEncuesta(viaje: string): string {
  void viaje;
  return '¿Cómo estuvo tu viaje con la Filial? Contanos en 2 minutos';
}

export const REPLY_TO = process.env.RESEND_REPLY_TO || undefined;

// list-unsubscribe para que gmail muestre el boton de darse de baja
export function headersBaja(urlBajaApi: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${urlBajaApi}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

function nombrePila(nombre: string): string {
  return (nombre || '').trim().split(/\s+/)[0] || '';
}

function conNombre(mensaje: string, nombre: string): string {
  return mensaje
    .replace(/\{nombre\}/gi, nombrePila(nombre))
    .replace(/[ \t]+([,.!?;:])/g, '$1');
}

export interface OpcionesPersonalizado {
  nombre: string;
  mensaje: string;
  botonTexto?: string;
  botonLink?: string;
  linkBaja: string;
}

export function htmlPersonalizado(o: OpcionesPersonalizado): string {
  const texto = conNombre(o.mensaje, o.nombre).trim();
  const parrafos = texto
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px;">${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  const boton =
    o.botonTexto && o.botonLink
      ? `<p style="margin:6px 0 18px;text-align:center;"><a href="${esc(o.botonLink)}" style="display:inline-block;background:#001f3f;color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:6px;font-weight:700;">${esc(o.botonTexto)}</a></p>`
      : '';
  const cuerpo = `
    ${parrafos}
    ${boton}
    <p style="margin:6px 0 0;"><strong>Talleres Filial Capital Federal</strong></p>
    <p style="margin:18px 0 0;font-size:11.5px;color:#64748b;">Recibís este mail porque viajaste con nosotros. Si no querés recibir más avisos de la filial, <a href="${o.linkBaja}" style="color:#64748b;">podés darte de baja acá</a>.</p>
  `;
  return layout('#001f3f', 'Filial Capital Federal', cuerpo);
}

export function textoPersonalizado(o: OpcionesPersonalizado): string {
  return [
    conNombre(o.mensaje, o.nombre).trim(),
    o.botonTexto && o.botonLink ? `\n${o.botonTexto}: ${o.botonLink}` : '',
    '\nTalleres Filial Capital Federal',
    `\nRecibís este mail porque viajaste con nosotros. Si no querés recibir más avisos de la filial, podés darte de baja acá: ${o.linkBaja}`,
  ]
    .filter(Boolean)
    .join('\n');
}
