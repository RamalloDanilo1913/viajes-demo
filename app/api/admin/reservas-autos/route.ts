import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const sb = supabaseAdmin();
  const { data, error } = await sb.from('reservas_autos').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'Falta el id.' });

  const sb = supabaseAdmin();
  const { error } = await sb.from('reservas_autos').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, error: error.message });
  return NextResponse.json({ success: true, mensaje: 'Solicitud eliminada.' });
}
