import { NextResponse } from 'next/server';
import { supabaseAdmin, logError } from '@/lib/supabase';
import { validarDni, validarEmail, validarTelefono } from '@/lib/validaciones';
import { RECARGO_MERCADOPAGO_PCT } from '@/lib/constants';
import type { DatosReservaBondi } from '@/lib/types';
import crypto from 'crypto';
import { ipDe, limpiarTexto, superaLimite, tipoDeArchivo } from '@/lib/seguridad';

// un grupo familiar grande entra en 12, si piden mas lo hablo
const MAX_PASAJEROS = 12;
const MAX_COMPROBANTE_BYTES = 5 * 1024 * 1024;
// si se suma otra filial hay que tocar tambien el check de la tabla
const FILIALES = ['Capital Federal', 'Buenos Aires'] as const;

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (superaLimite(`reservas-bondi:${ipDe(req)}`, 15, 10 * 60 * 1000)) {
    return NextResponse.json({ success: false, str: 'Demasiados intentos. Probá de nuevo en unos minutos.' }, { status: 429 });
  }

  const datos: (DatosReservaBondi & { metodoPago?: 'transferencia' | 'mercadopago' }) | null = await req.json().catch(() => null);
  if (!datos || typeof datos !== 'object') return NextResponse.json({ success: false, str: 'Error: solicitud inválida.' });
  const metodoPago = datos.metodoPago === 'mercadopago' ? 'mercadopago' : 'transferencia';
  const filial = FILIALES.find((f) => f === datos.filial) || 'Capital Federal';

  const pasajeros = Array.isArray(datos.pasajeros) ? datos.pasajeros : [];
  if (pasajeros.length === 0) return NextResponse.json({ success: false, str: 'Error: Cargá al menos un pasajero.' });
  if (pasajeros.length > MAX_PASAJEROS) return NextResponse.json({ success: false, str: `Error: Una reserva admite hasta ${MAX_PASAJEROS} pasajeros.` });

  for (const p of pasajeros) {
    p.nombre = limpiarTexto(p.nombre, 80);
    p.dni = limpiarTexto(String(p.dni ?? ''), 8);
    p.fechaNacimiento = limpiarTexto(p.fechaNacimiento, 10);
    p.parada = limpiarTexto(p.parada, 100);
    p.email = limpiarTexto(p.email, 120);
    p.telefono = limpiarTexto(String(p.telefono ?? ''), 15);
    p.telEmergencia = limpiarTexto(String(p.telEmergencia ?? ''), 15);
    p.localidad = limpiarTexto(p.localidad, 80);
    p.numSocio = limpiarTexto(String(p.numSocio ?? ''), 20);
  }

  const sb = supabaseAdmin();
  const { data: info } = await sb.from('info_bondi').select('paradas').eq('id', 1).single();
  const requierePararada = Array.isArray(info?.paradas) && info!.paradas.length > 0;

  try {
    await sb.rpc('expirar_reservas_mercadopago_pendientes', { p_minutos: 30 });
  } catch {
    // si falla la limpieza no pasa nada, la reserva sigue igual
  }

  if (metodoPago === 'mercadopago') {
    const { data: config } = await sb.from('configuracion').select('mercadopago_habilitado').eq('id', 1).single();
    if (config?.mercadopago_habilitado === false) {
      return NextResponse.json({ success: false, str: 'El pago con Mercado Pago ya no está disponible para este viaje. Pagá por transferencia.' });
    }
  }

  for (let i = 0; i < pasajeros.length; i++) {
    const p = pasajeros[i];
    const num = i + 1;
    if (!p.nombre?.trim()) return NextResponse.json({ success: false, str: `Error: Falta el nombre del Pasajero ${num}.` });
    if (!validarDni(p.dni)) return NextResponse.json({ success: false, str: `Error: El DNI del Pasajero ${num} debe tener 7 u 8 números.` });
    if (!p.fechaNacimiento) return NextResponse.json({ success: false, str: `Error: Falta la fecha de nacimiento del Pasajero ${num}.` });
    if (requierePararada && !p.parada?.trim()) return NextResponse.json({ success: false, str: `Error: Elegí una parada de subida para el Pasajero ${num}.` });
    if (p.esSocio && !p.numSocio?.trim()) return NextResponse.json({ success: false, str: `Error: Falta el número de socio del Pasajero ${num}.` });

    if (!p.esMenor) {
      if (!validarTelefono(p.telefono)) return NextResponse.json({ success: false, str: `Error: El teléfono del Pasajero ${num} debe tener entre 10 y 15 números.` });
      if (!validarEmail(p.email)) return NextResponse.json({ success: false, str: `Error: El email del Pasajero ${num} no es válido.` });
      if (!p.localidad?.trim()) return NextResponse.json({ success: false, str: `Error: Falta la localidad del Pasajero ${num}.` });
      if (p.telEmergencia && p.telEmergencia !== '-' && !validarTelefono(p.telEmergencia)) {
        return NextResponse.json({ success: false, str: `Error: El teléfono de emergencia del Pasajero ${num} debe tener entre 10 y 15 números.` });
      }
    }
  }
  // por seguro tiene que ir al menos un mayor
  if (pasajeros.every((p) => p.esMenor)) {
    return NextResponse.json({ success: false, str: 'Error: Tiene que viajar al menos un mayor de edad en la reserva.' });
  }
  const dnisDelGrupo = pasajeros.map((p) => p.dni.trim());
  const repetido = dnisDelGrupo.find((d, i) => dnisDelGrupo.indexOf(d) !== i);
  if (repetido) return NextResponse.json({ success: false, str: `Error: El DNI ${repetido} está cargado dos veces entre los pasajeros.` });

  let comprobanteUrl = '';
  let comprobanteFallo = false;
  if (metodoPago === 'transferencia' && typeof datos.fileData === 'string' && datos.fileData) {
    try {
      const buffer = Buffer.from(datos.fileData, 'base64');
      if (buffer.length === 0 || buffer.length > MAX_COMPROBANTE_BYTES) throw new Error('Comprobante vacío o de más de 5 MB');
      const tipo = tipoDeArchivo(buffer);
      if (!tipo) throw new Error('Tipo de archivo no permitido (solo PDF, JPG, PNG o WEBP)');
      // nombre random para que no se pueda adivinar el link del comprobante
      const rutaArchivo = `${crypto.randomUUID()}.${tipo.ext}`;
      const { error: uploadError } = await sb.storage.from('comprobantes').upload(rutaArchivo, buffer, {
        contentType: tipo.mime,
      });
      if (uploadError) throw uploadError;
      comprobanteUrl = rutaArchivo;
    } catch (uploadError) {
      await logError('reservas-bondi POST - subida comprobante', uploadError);
      comprobanteFallo = true;
    }
  }

  const pasajerosParaRpc = pasajeros.map((p) => ({
    nombre: p.nombre,
    dni: p.dni,
    es_menor: !!p.esMenor,
    fecha_nacimiento: p.fechaNacimiento || null,
    parada: p.parada || '',
    email: p.esMenor ? '' : p.email,
    telefono: p.esMenor ? '' : p.telefono,
    tel_emergencia: p.esMenor ? '-' : p.telEmergencia || '-',
    localidad: p.esMenor ? '' : p.localidad,
    socio: !!p.esSocio,
    num_socio: p.numSocio || '',
  }));

  const { data: reservaId, error } = await sb.rpc('crear_reserva_bondi', {
    p_filial: filial,
    p_pasajeros: pasajerosParaRpc,
    p_comprobante_url: comprobanteUrl,
    p_metodo_pago: metodoPago,
    // el recargo se calcula en la base, aca solo paso el porcentaje
    p_recargo_pct: metodoPago === 'mercadopago' ? RECARGO_MERCADOPAGO_PCT : 0,
  });

  if (error) {
    const msg = error.message || '';
    if (msg.includes('SIN_CUPOS')) return NextResponse.json({ success: false, str: 'Operación rechazada: no quedan suficientes lugares disponibles para todos los pasajeros que cargaste.' });
    if (msg.includes('DNI_DUPLICADO')) return NextResponse.json({ success: false, str: 'Error: uno de los DNI que cargaste ya tiene una reserva registrada para este viaje.' });
    await logError('reservas-bondi POST - crear_reserva_bondi', error);
    return NextResponse.json({ success: false, str: 'El servidor está procesando muchas peticiones. Intentá en unos segundos.' });
  }

  const { data: reservaCreada } = await sb.from('reservas_bondi').select('monto_total').eq('id', reservaId).single();
  const montoTotal = reservaCreada?.monto_total ?? 0;

  if (metodoPago === 'mercadopago') {
    return NextResponse.json({ success: true, reservaId, montoTotal, metodoPago });
  }

  const waConfig = (await sb.from('configuracion').select('whatsapp').eq('id', 1).single()).data?.whatsapp || '';

  if (comprobanteUrl) {
    return NextResponse.json({ success: true, titulo: '¡Reserva confirmada!', str: '¡Tu pasaje está reservado! ✅ Ya recibimos tu comprobante.' });
  }
  if (comprobanteFallo) {
    return NextResponse.json({ success: true, titulo: 'Pendiente de pago', str: `Tus datos fueron guardados, pero hubo un error al subir el comprobante. Por favor envialo por WhatsApp al +${waConfig}.` });
  }
  return NextResponse.json({ success: true, titulo: 'Pendiente de pago', str: `Tus datos fueron cargados correctamente. Enviá el comprobante por WhatsApp al +${waConfig}.` });
}
