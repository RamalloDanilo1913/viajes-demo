import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const sb = supabaseAdmin();
  const { data, error } = await sb.from('perfiles').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const resultado = (data || [])
    .map((p) => ({
      id: p.id,
      dni: p.dni,
      apellido: p.apellido,
      nombreCompleto: p.nombre_completo,
      promedioConductor: p.cant_conductor > 0 ? Math.round((p.suma_estrellas_conductor / p.cant_conductor) * 10) / 10 : null,
      cantConductor: p.cant_conductor,
      promedioPasajero: p.cant_pasajero > 0 ? Math.round((p.suma_estrellas_pasajero / p.cant_pasajero) * 10) / 10 : null,
      cantPasajero: p.cant_pasajero,
    }))
    .sort((a, b) => b.cantConductor + b.cantPasajero - (a.cantConductor + a.cantPasajero));

  return NextResponse.json(resultado);
}

export async function DELETE(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'Falta el id.' });

  const sb = supabaseAdmin();
  const { error } = await sb.from('perfiles').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, error: error.message });
  return NextResponse.json({ success: true, mensaje: 'Perfil eliminado.' });
}
