import { NextResponse } from 'next/server';
import { jsonNoStore } from '@/lib/noStore';
import { supabaseAdmin } from '@/lib/supabase';
import { validarDni, validarEmail, validarTelefono } from '@/lib/validaciones';
import { ipDe, limpiarTexto, superaLimite } from '@/lib/seguridad';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sb = supabaseAdmin();
  const ahora = new Date().toISOString();

  const { data, error } = await sb
    .from('viajes_autos')
    .select('*')
    .gt('cupos', 0)
    .or(`fecha_salida.gte.${ahora},fecha_salida.is.null`)
    .order('fecha_salida', { ascending: true });

  if (error) return jsonNoStore({ error: 'No se pudieron cargar los viajes.' }, { status: 500 });
  if (!data.length) return jsonNoStore([]);

  const dnis = Array.from(new Set(data.map((v) => String(v.dni))));
  const { data: perfiles } = await sb.from('perfiles').select('*').in('dni', dnis);
  const perfilPorClave = new Map((perfiles || []).map((p) => [`${p.dni}|${String(p.apellido).toLowerCase()}`, p]));

  const resultado = data.map((v) => {
    const perfil = perfilPorClave.get(`${v.dni}|${String(v.apellido).toLowerCase()}`);
    const cantConductor = perfil?.cant_conductor || 0;
    return {
      id: v.id,
      nombre: `${v.nombre} ${v.apellido}`,
      partido: v.partido,
      fechaSalida: formatearFecha(v.fecha_salida),
      fechaRegreso: v.fecha_regreso ? formatearFecha(v.fecha_regreso) : 'Sin regreso',
      precio: v.precio,
      lugarSalida: v.lugar_salida,
      notas: v.notas,
      cupos: v.cupos,
      promedioConductor: cantConductor > 0 ? Math.round((perfil!.suma_estrellas_conductor / cantConductor) * 10) / 10 : null,
      cantConductor,
    };
  });

  return jsonNoStore(resultado);
}

function formatearFecha(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export async function POST(req: Request) {
  if (superaLimite(`viajes-autos:${ipDe(req)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Demasiados intentos. Probá de nuevo en unos minutos.' }, { status: 429 });
  }

  const datos = await req.json().catch(() => null);
  if (!datos || typeof datos !== 'object') return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });

  const nombre = limpiarTexto(datos.nombre, 60);
  const apellido = limpiarTexto(datos.apellido, 60);
  const dni = limpiarTexto(String(datos.dni ?? ''), 8);
  const email = limpiarTexto(datos.email, 120);
  const whatsapp = limpiarTexto(String(datos.whatsapp ?? ''), 15);
  const partido = limpiarTexto(datos.partido, 120);
  const lugarSalida = limpiarTexto(datos.lugarSalida, 160);
  const notas = limpiarTexto(datos.notas, 500);
  const precio = limpiarTexto(String(datos.precio ?? ''), 40);
  const cupos = Number.parseInt(String(datos.cupos ?? ''), 10);

  if (!nombre || !apellido || !dni || !email || !whatsapp || !partido || !datos.fechaSalida) {
    return NextResponse.json({ error: 'Faltan datos obligatorios.' }, { status: 400 });
  }
  if (!Number.isInteger(cupos) || cupos < 1 || cupos > 8) return NextResponse.json({ error: 'Los lugares disponibles deben ser entre 1 y 8.' }, { status: 400 });
  if (!validarDni(dni)) return NextResponse.json({ error: 'El DNI debe contener exactamente 7 u 8 números.' }, { status: 400 });
  if (!validarTelefono(whatsapp)) return NextResponse.json({ error: 'El WhatsApp del chofer debe tener entre 10 y 15 dígitos.' }, { status: 400 });
  if (!validarEmail(email)) return NextResponse.json({ error: 'El email ingresado no es válido.' }, { status: 400 });

  const fechaSalida = new Date(datos.fechaSalida);
  if (isNaN(fechaSalida.getTime())) return NextResponse.json({ error: 'La fecha de salida no es válida.' }, { status: 400 });

  let fechaRegreso: string | null = null;
  if (datos.fechaRegreso) {
    const fr = new Date(datos.fechaRegreso);
    if (!isNaN(fr.getTime())) fechaRegreso = fr.toISOString();
  }

  const sb = supabaseAdmin();
  const { data: nuevo, error } = await sb
    .from('viajes_autos')
    .insert({
      nombre,
      apellido,
      dni,
      email,
      whatsapp,
      partido,
      fecha_salida: fechaSalida.toISOString(),
      fecha_regreso: fechaRegreso,
      precio,
      lugar_salida: lugarSalida,
      notas,
      cupos,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'No se pudo publicar el auto. Intentá de nuevo.' }, { status: 500 });

  await sb.from('historial_viajes').insert({
    id_viaje_original: nuevo.id,
    conductor_nombre: nombre,
    conductor_apellido: apellido,
    conductor_dni: dni,
    conductor_email: email,
    conductor_whatsapp: whatsapp,
    partido,
    fecha_salida: fechaSalida.toISOString(),
    fecha_regreso: fechaRegreso,
    lugar_salida: lugarSalida,
    precio,
    cupos,
  });

  return NextResponse.json({ ok: true, mensaje: '¡Tu auto fue publicado con éxito!' });
}
