import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { extraerContactos, guardarContactos, listasDeContactos, nombreViajeDesdeInfo } from '@/lib/contactos';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const listas = await listasDeContactos(supabaseAdmin());
    return NextResponse.json({ listas });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const sb = supabaseAdmin();

  let viaje = String(body.viaje || '').trim().slice(0, 120);
  if (!viaje) {
    const { data: info } = await sb.from('info_bondi').select('destino, fecha_salida').eq('id', 1).single();
    viaje = nombreViajeDesdeInfo(info);
  }
  if (viaje.length < 3) return NextResponse.json({ success: false, error: 'Escribí el nombre del viaje (ej: Córdoba - 11/10/2026).' });

  const { data: reservas, error } = await sb.from('reservas_bondi').select('*, reservas_bondi_pasajeros(*)');
  if (error) return NextResponse.json({ success: false, error: error.message });

  const contactos = extraerContactos(reservas || []);
  if (contactos.length === 0) return NextResponse.json({ success: false, error: 'No hay mails de pasajeros para guardar.' });

  try {
    const n = await guardarContactos(sb, contactos, viaje);
    return NextResponse.json({ success: true, mensaje: `Se guardaron ${n} contactos en la lista "${viaje}".` });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
