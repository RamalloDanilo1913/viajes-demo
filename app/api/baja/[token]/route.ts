import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { jsonNoStore } from '@/lib/noStore';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(_req: NextRequest, { params }: { params: { token: string } }) {
  if (params.token === 'prueba') return jsonNoStore({ success: true, prueba: true });
  if (!UUID.test(params.token)) return jsonNoStore({ success: false, error: 'Link inválido.' }, { status: 404 });

  const sb = supabaseAdmin();
  const { data: contacto } = await sb.from('contactos_bondi').select('email').eq('token_baja', params.token).maybeSingle();
  if (!contacto) return jsonNoStore({ success: false, error: 'No encontramos este contacto.' }, { status: 404 });

  const { error } = await sb.from('bajas_bondi').upsert({ email: contacto.email }, { onConflict: 'email' });
  if (error) return jsonNoStore({ success: false, error: 'No pudimos procesar la baja. Probá de nuevo.' });
  return jsonNoStore({ success: true });
}

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  return NextResponse.redirect(new URL(`/baja/${params.token}`, req.nextUrl.origin));
}
