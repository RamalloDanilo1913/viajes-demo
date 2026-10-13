import { NextRequest } from 'next/server';
import { supabaseAdmin, logError } from '@/lib/supabase';
import { jsonNoStore } from '@/lib/noStore';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  if (params.token === 'prueba') return jsonNoStore({ nombre: '', viaje: 'Viaje de prueba', yaRespondido: false, prueba: true });
  if (!UUID.test(params.token)) return jsonNoStore({ error: 'Link inválido.' }, { status: 404 });

  const sb = supabaseAdmin();
  const { data } = await sb.from('encuestas_bondi').select('nombre, viaje, respondido_at').eq('token', params.token).maybeSingle();
  if (!data) return jsonNoStore({ error: 'No encontramos esta encuesta.' }, { status: 404 });

  return jsonNoStore({
    nombre: (data.nombre || '').split(' ')[0],
    viaje: data.viaje,
    yaRespondido: !!data.respondido_at,
  });
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const body = await req.json().catch(() => ({}));
  const calificacion = parseInt(body.calificacion, 10);
  if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
    return jsonNoStore({ success: false, error: 'Elegí una calificación de 1 a 5 estrellas.' });
  }
  const queTePareci = String(body.queTePareci || '').trim().slice(0, 1500);
  const aMejorar = String(body.aMejorar || '').trim().slice(0, 1500);

  if (params.token === 'prueba') return jsonNoStore({ success: true, prueba: true });
  if (!UUID.test(params.token)) return jsonNoStore({ success: false, error: 'Link inválido.' }, { status: 404 });

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('encuestas_bondi')
    .update({ calificacion, que_te_parecio: queTePareci, a_mejorar: aMejorar, respondido_at: new Date().toISOString() })
    .eq('token', params.token)
    .is('respondido_at', null)
    .select('id');

  if (error) {
    await logError('Encuesta: guardar respuesta', error.message);
    return jsonNoStore({ success: false, error: 'No pudimos guardar tu respuesta. Probá de nuevo en un rato.' });
  }
  if (!data || data.length === 0) return jsonNoStore({ success: false, error: 'Esta encuesta ya fue respondida. ¡Gracias!' });
  return jsonNoStore({ success: true });
}
