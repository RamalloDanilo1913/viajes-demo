import { NextResponse } from 'next/server';
import { logError } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { token } = await req.json();
  if (!token) return NextResponse.json(null);

  try {
    const resp = await fetch(`${process.env.SOCIOS_SUPABASE_URL}/rest/v1/rpc/consumir_token_prellenado`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SOCIOS_SUPABASE_PUBLISHABLE_KEY!,
        Authorization: `Bearer ${process.env.SOCIOS_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ p_token: token }),
    });

    if (!resp.ok) {
      await logError('socio-token POST - HTTP ' + resp.status, await resp.text());
      return NextResponse.json(null);
    }

    const filas = await resp.json();
    if (!filas || !filas.length) return NextResponse.json(null);
    return NextResponse.json(filas[0]);
  } catch (err) {
    await logError('socio-token POST', err);
    return NextResponse.json(null);
  }
}
