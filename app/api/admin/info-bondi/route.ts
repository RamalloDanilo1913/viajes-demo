import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { extraerContactos, guardarContactos, nombreViajeDesdeInfo } from '@/lib/contactos';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const sb = supabaseAdmin();
  const { data } = await sb.from('info_bondi').select('*').eq('id', 1).single();
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const datos = await req.json();
  const sb = supabaseAdmin();
  const { error } = await sb
    .from('info_bondi')
    .update({
      descripcion: datos.descripcion || '',
      destino: datos.destino || '',
      fecha_salida: datos.fecha_salida || null,
      hora_salida: datos.hora_salida || '',
      lugar_salida: datos.lugar_salida || '',
      cupos_disponibles: datos.cupos_disponibles === '' ? null : parseInt(datos.cupos_disponibles, 10),
      fecha_regreso: datos.fecha_regreso || null,
      lugar_regreso: datos.lugar_regreso || '',
      hora_regreso: datos.hora_regreso || '',
      comentario: datos.comentario || '',
      precio_adulto: datos.precio_adulto === '' ? null : parseFloat(datos.precio_adulto),
      precio_menor: datos.precio_menor === '' ? null : parseFloat(datos.precio_menor),
      paradas: Array.isArray(datos.paradas) ? datos.paradas.filter((p: string) => p.trim()) : [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  if (error) return NextResponse.json({ success: false, error: error.message });
  return NextResponse.json({ success: true, mensaje: 'Datos del colectivo actualizados.' });
}

export async function DELETE(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const sb = supabaseAdmin();

  try {
    const { data: info } = await sb.from('info_bondi').select('destino, fecha_salida').eq('id', 1).single();
    const { data: reservas } = await sb.from('reservas_bondi').select('*, reservas_bondi_pasajeros(*)');
    const viaje = nombreViajeDesdeInfo(info);
    if (viaje) await guardarContactos(sb, extraerContactos(reservas || []), viaje);
  } catch (e) {
    console.error('No se pudieron guardar los contactos al vaciar el colectivo:', e);
  }

  const { error } = await sb
    .from('info_bondi')
    .update({
      descripcion: '', destino: '', fecha_salida: null, hora_salida: '', lugar_salida: '', cupos_disponibles: 0,
      fecha_regreso: null, lugar_regreso: '', hora_regreso: '', comentario: '', precio_adulto: null, precio_menor: null, paradas: [],
    })
    .eq('id', 1);

  if (error) return NextResponse.json({ success: false, error: error.message });
  return NextResponse.json({ success: true, mensaje: 'Se vació la información del colectivo. Ya no se mostrará en la web.' });
}
