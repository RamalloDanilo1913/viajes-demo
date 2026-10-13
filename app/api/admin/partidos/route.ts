import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const sb = supabaseAdmin();
  const { data, error } = await sb.from('partidos').select('*').order('orden', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { nombre } = await req.json();
  if (!nombre?.trim()) return NextResponse.json({ success: false, error: 'Escribí el nombre del partido.' });

  const sb = supabaseAdmin();
  const { data: ultimo } = await sb.from('partidos').select('orden').order('orden', { ascending: false }).limit(1).maybeSingle();
  const siguienteOrden = (ultimo?.orden || 0) + 1;

  const { error } = await sb.from('partidos').insert({ nombre: nombre.trim(), orden: siguienteOrden, activo: true });
  if (error) {
    if (error.code === '23505') return NextResponse.json({ success: false, error: 'Ese partido ya está cargado.' });
    return NextResponse.json({ success: false, error: error.message });
  }
  return NextResponse.json({ success: true, mensaje: 'Partido agregado.' });
}

export async function DELETE(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'Falta el id.' });

  const sb = supabaseAdmin();
  const { error } = await sb.from('partidos').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, error: error.message });
  return NextResponse.json({ success: true, mensaje: 'Partido eliminado.' });
}
