import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin, logError } from '@/lib/supabase';
import { extraerContactos, guardarContactos } from '@/lib/contactos';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { viaje: viajeRaw } = await req.json().catch(() => ({}));
  const viaje = String(viajeRaw || '').trim().slice(0, 120);
  if (viaje.length < 3) return NextResponse.json({ success: false, error: 'Escribí el nombre del viaje (ej: Córdoba - 11/10/2026).' });

  const sb = supabaseAdmin();
  try {
    const { data: reservas, error } = await sb.from('reservas_bondi').select('*, reservas_bondi_pasajeros(*)');
    if (error) throw new Error(error.message);
    if (!reservas || reservas.length === 0) return NextResponse.json({ success: false, error: 'No hay reservas para cerrar.' });

    const contactos = extraerContactos(reservas);
    const guardados = await guardarContactos(sb, contactos, viaje);

    const { error: errBorrar } = await sb.from('reservas_bondi').delete().not('id', 'is', null);
    if (errBorrar) throw new Error(`Se guardaron los contactos pero no se pudieron borrar las reservas: ${errBorrar.message}`);

    const pasajeros = reservas.reduce((a: number, r: any) => a + (r.reservas_bondi_pasajeros?.length || 0), 0);
    return NextResponse.json({
      success: true,
      mensaje: `Viaje cerrado. Se guardaron ${guardados} contactos en la lista "${viaje}" y se vaciaron ${reservas.length} reservas (${pasajeros} pasajeros).`,
    });
  } catch (e: any) {
    await logError('Cerrar viaje', e.message);
    return NextResponse.json({ success: false, error: e.message });
  }
}
