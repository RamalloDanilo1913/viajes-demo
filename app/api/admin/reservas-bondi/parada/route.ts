import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin, logError } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { reservaId, dni, parada } = await req.json().catch(() => ({}));
  const nueva = String(parada ?? '').trim();
  if (!reservaId || !dni) return NextResponse.json({ success: false, error: 'Faltan datos del pasajero.' });

  const sb = supabaseAdmin();

  if (nueva) {
    const { data: info } = await sb.from('info_bondi').select('paradas').eq('id', 1).single();
    const paradas: string[] = Array.isArray(info?.paradas) ? info!.paradas : [];
    if (!paradas.includes(nueva)) return NextResponse.json({ success: false, error: 'Esa parada no está cargada en Info Bondi.' });
  }

  try {
    const { data: reserva, error: errBuscar } = await sb
      .from('reservas_bondi')
      .select('id, reservas_bondi_pasajeros(*)')
      .eq('id', reservaId)
      .single();
    if (errBuscar || !reserva) return NextResponse.json({ success: false, error: 'No encontramos esa reserva (¿ya se eliminó?). Actualizá la página.' });

    const fila = ((reserva as any).reservas_bondi_pasajeros || []).find((p: any) => p.dni === dni);
    if (!fila) return NextResponse.json({ success: false, error: 'No encontramos a ese pasajero en la reserva. Actualizá la página.' });

    let q = sb.from('reservas_bondi_pasajeros').update({ parada: nueva }).eq('dni', dni);
    if (fila.id !== undefined) q = q.eq('id', fila.id);
    else if (fila.reserva_id !== undefined) q = q.eq('reserva_id', reservaId);

    const { data: actualizados, error } = await q.select('dni');
    if (error) throw new Error(error.message);
    if (!actualizados || actualizados.length !== 1) {
      throw new Error(`Se esperaba cambiar 1 pasajero y se cambiaron ${actualizados?.length ?? 0}.`);
    }
    return NextResponse.json({ success: true, mensaje: nueva ? `Parada cambiada a ${nueva}.` : 'Pasajero sin parada.' });
  } catch (e: any) {
    await logError('Cambiar parada de pasajero', e.message);
    return NextResponse.json({ success: false, error: `No se pudo cambiar la parada: ${e.message}` });
  }
}
