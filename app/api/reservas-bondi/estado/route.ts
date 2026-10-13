import { NextRequest, NextResponse } from 'next/server';
import { jsonNoStore } from '@/lib/noStore';
import { supabaseAdmin } from '@/lib/supabase';
import { esUuid } from '@/lib/seguridad';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!esUuid(id)) return jsonNoStore({ error: 'Id inválido.' }, { status: 400 });

  const sb = supabaseAdmin();
  const { data } = await sb.from('reservas_bondi').select('estado_pago').eq('id', id).single();
  if (!data) return jsonNoStore({ error: 'No encontrada.' }, { status: 404 });

  return jsonNoStore({ estadoPago: data.estado_pago });
}
