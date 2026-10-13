import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const sb = supabaseAdmin();
  const { data } = await sb.from('configuracion').select('*').eq('id', 1).single();
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const datos = await req.json();
  const sb = supabaseAdmin();
  const { error } = await sb
    .from('configuracion')
    .update({
      banner_url: datos.banner_url || '',
      alias: datos.alias || '',
      cbu: datos.cbu || '',
      titular: datos.titular || '',
      whatsapp: datos.whatsapp || '',
      alias_ba: datos.alias_ba || '',
      cbu_ba: datos.cbu_ba || '',
      titular_ba: datos.titular_ba || '',
      mostrar_filial_ba: !!datos.mostrar_filial_ba,
      mercadopago_habilitado: !!datos.mercadopago_habilitado,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  if (error) return NextResponse.json({ success: false, error: error.message });
  return NextResponse.json({ success: true, mensaje: 'Configuración actualizada.' });
}
