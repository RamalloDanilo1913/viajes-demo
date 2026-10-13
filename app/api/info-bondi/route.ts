import { jsonNoStore } from '@/lib/noStore';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('info_bondi').select('*').eq('id', 1).single();
  if (error) return jsonNoStore({ error: 'No se pudo cargar la información.' }, { status: 500 });

  if (!data.destino || !data.destino.trim()) {
    return jsonNoStore(null);
  }

  return jsonNoStore({
    descripcion: data.descripcion || '',
    destino: data.destino,
    fechaSalida: data.fecha_salida || '',
    horaSalida: data.hora_salida || '',
    lugarSalida: data.lugar_salida || '',
    cupos: data.cupos_disponibles ?? 0,
    fechaRegreso: data.fecha_regreso || '',
    lugarRegreso: data.lugar_regreso || '',
    horaRegreso: data.hora_regreso || '',
    comentario: data.comentario || '',
    precioAdulto: data.precio_adulto,
    precioMenor: data.precio_menor,
    paradas: Array.isArray(data.paradas) ? data.paradas : [],
  });
}
