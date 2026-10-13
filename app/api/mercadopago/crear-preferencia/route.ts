import { NextResponse } from 'next/server';
import { supabaseAdmin, logError } from '@/lib/supabase';
import { crearPreferenciaBondi } from '@/lib/mercadopago';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { reservaId } = await req.json();
  if (!reservaId) return NextResponse.json({ error: 'Falta el id de la reserva.' }, { status: 400 });

  const sb = supabaseAdmin();
  const { data: reserva } = await sb
    .from('reservas_bondi')
    .select('id, monto_total, email, metodo_pago, estado_pago')
    .eq('id', reservaId)
    .single();

  if (!reserva) return NextResponse.json({ error: 'No encontramos esa reserva.' }, { status: 404 });
  if (reserva.metodo_pago !== 'mercadopago') return NextResponse.json({ error: 'Esta reserva no es de Mercado Pago.' }, { status: 400 });
  if (reserva.estado_pago === 'pagado') return NextResponse.json({ error: 'Esta reserva ya está pagada.' }, { status: 400 });

  const { data: config } = await sb.from('configuracion').select('mercadopago_habilitado').eq('id', 1).single();
  if (config?.mercadopago_habilitado === false) {
    return NextResponse.json({ error: 'El pago con Mercado Pago ya no está disponible para este viaje.' }, { status: 400 });
  }

  try {
    const { preferenceId, initPoint } = await crearPreferenciaBondi({
      reservaId: reserva.id,
      monto: Number(reserva.monto_total),
      descripcion: 'Pasaje Bondi — Viajes Filial Capital Federal',
      payerEmail: reserva.email || undefined,
    });

    await sb.from('reservas_bondi').update({ mp_preference_id: preferenceId }).eq('id', reserva.id);

    return NextResponse.json({ initPoint });
  } catch (err) {
    await logError('mercadopago crear-preferencia', err);
    return NextResponse.json({ error: 'No pudimos iniciar el pago con Mercado Pago. Probá de nuevo en un momento.' }, { status: 500 });
  }
}
