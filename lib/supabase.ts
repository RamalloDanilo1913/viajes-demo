import { createClient } from '@supabase/supabase-js';

// OJO: service_role, solo desde el servidor. No importar desde componentes client
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.');
  }
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  });
}

// guarda en la tabla errores para verlos desde el panel, nunca tira excepcion
export async function logError(contexto: string, detalle: unknown) {
  try {
    const sb = supabaseAdmin();
    await sb.from('errores').insert({
      contexto,
      detalle: detalle instanceof Error ? detalle.message : JSON.stringify(detalle),
    });
  } catch (e) {
    console.error('No se pudo registrar el error en la tabla "errores":', e);
  }
  console.error(contexto, detalle);
}
