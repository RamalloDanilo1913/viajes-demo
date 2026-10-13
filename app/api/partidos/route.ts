import { jsonNoStore } from '@/lib/noStore';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('partidos')
    .select('nombre')
    .eq('activo', true)
    .order('orden', { ascending: true });

  if (error) return jsonNoStore({ error: 'No se pudo cargar la información.' }, { status: 500 });
  return jsonNoStore(data.map((p) => p.nombre));
}
