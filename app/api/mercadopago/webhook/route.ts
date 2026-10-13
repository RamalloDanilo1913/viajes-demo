import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, logError } from '@/lib/supabase';
import { obtenerPago, validarFirmaWebhook } from '@/lib/mercadopago';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const sb = supabaseAdmin();

  try {
    const url = req.nextUrl;
    const body = await req.json().catch(() => ({}) as any);

    const dataId = url.searchParams.get('data.id') || body?.data?.id || body?.id;
    const tipo = url.searchParams.get('type') || body?.type;

    // MP manda otros tipos de aviso, los ignoro y devuelvo 200 igual
    if (tipo !== 'payment' || !dataId) {
      return NextResponse.json({ ok: true });
    }

    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    const firmaValida = validarFirmaWebhook({ xSignature, xRequestId, dataId: String(dataId) });
    if (!firmaValida) {
      console.warn('mercadopago webhook rechazado: firma inválida o MERCADOPAGO_WEBHOOK_SECRET sin configurar');
      return NextResponse.json({ ok: true });
    }

    // no confio en el body, el estado lo consulto siempre a MP
    const pago = await obtenerPago(String(dataId));
    const reservaId = pago.external_reference;
    if (!reservaId) return NextResponse.json({ ok: true });

    let nuevoEstado: 'pagado' | 'rechazado' | null = null;
    if (pago.status === 'approved') nuevoEstado = 'pagado';
    else if (pago.status === 'rejected' || pago.status === 'cancelled') nuevoEstado = 'rechazado';

    if (nuevoEstado) {
      const { data: cupoOk } = await sb.rpc('actualizar_estado_pago_mp', {
        p_reserva_id: reservaId,
        p_estado: nuevoEstado,
        p_payment_id: String(dataId),
        p_preference_id: (pago as any).preference_id || null,
      });

      if (nuevoEstado === 'pagado' && cupoOk === false) {
        await logError('mercadopago webhook - pago aprobado sin cupos disponibles', { reservaId, dataId });
      }
    }

    // siempre 200, si no MP reintenta y se llena de avisos repetidos
    return NextResponse.json({ ok: true });
  } catch (err) {
    await logError('mercadopago webhook', err);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
