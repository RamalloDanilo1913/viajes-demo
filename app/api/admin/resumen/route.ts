import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const sb = supabaseAdmin();

  const [autos, cuposAutos, pendientes, aceptadas, infoBondi, reservasBondi, perfiles, historial] = await Promise.all([
    sb.from('viajes_autos').select('id', { count: 'exact', head: true }),
    sb.from('viajes_autos').select('cupos'),
    sb.from('reservas_autos').select('id', { count: 'exact', head: true }).eq('estado', 'Pendiente'),
    sb.from('reservas_autos').select('id', { count: 'exact', head: true }).eq('estado', 'Aceptada'),
    sb.from('info_bondi').select('destino, cupos_disponibles').eq('id', 1).single(),
    sb.from('reservas_bondi').select('id', { count: 'exact', head: true }),
    sb.from('perfiles').select('id', { count: 'exact', head: true }),
    sb.from('historial_viajes').select('id', { count: 'exact', head: true }),
  ]);

  const cuposAutosLibres = (cuposAutos.data || []).reduce((acc, v) => acc + (v.cupos || 0), 0);

  return NextResponse.json({
    autosActivos: autos.count || 0,
    cuposAutosLibres,
    solicitudesPendientes: pendientes.count || 0,
    solicitudesAceptadas: aceptadas.count || 0,
    bondiCupos: infoBondi.data?.cupos_disponibles ?? null,
    bondiDestino: infoBondi.data?.destino || null,
    reservasBondi: reservasBondi.count || 0,
    perfilesRegistrados: perfiles.count || 0,
    viajesHistoricos: historial.count || 0,
  });
}
