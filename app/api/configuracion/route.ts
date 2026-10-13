import { jsonNoStore } from '@/lib/noStore';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('configuracion').select('*').eq('id', 1).single();
  if (error) return jsonNoStore({ error: 'No se pudo cargar la información.' }, { status: 500 });

  return jsonNoStore({
    bannerUrl: data.banner_url || '',
    alias: data.alias || '',
    cbu: data.cbu || '',
    titular: data.titular || '',
    whatsapp: data.whatsapp || '',
    aliasBA: data.alias_ba || '',
    cbuBA: data.cbu_ba || '',
    titularBA: data.titular_ba || '',
    mostrarFilialBA: !!data.mostrar_filial_ba,
    mercadopagoHabilitado: data.mercadopago_habilitado !== false,
  });
}
