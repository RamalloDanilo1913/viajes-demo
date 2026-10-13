import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, logError } from '@/lib/supabase';
import { compararSeguro } from '@/lib/seguridad';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'Cron no configurado' }, { status: 503 });
  const auth = req.headers.get('authorization') || '';
  if (!compararSeguro(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const sb = supabaseAdmin();
  try {
    // 30 min tiene que coincidir con lo que se llama desde reservas-bondi
    const { data, error } = await sb.rpc('expirar_reservas_mercadopago_pendientes', { p_minutos: 30 });
    if (error) throw error;
    return NextResponse.json({ ok: true, expiradas: data ?? 0 });
  } catch (err) {
    await logError('cron expirar-mercadopago', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
