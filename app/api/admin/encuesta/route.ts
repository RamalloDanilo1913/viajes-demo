import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { FROM_EMAIL, REPLY_TO } from '@/lib/resend';
import { extraerContactos, listasDeContactos, nombreViajeDesdeInfo, traerTodo } from '@/lib/contactos';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const sb = supabaseAdmin();
  try {
    const [{ data: info }, { data: reservas, error: errRes }, encuestas, listas] = await Promise.all([
      sb.from('info_bondi').select('destino, fecha_salida').eq('id', 1).single(),
      sb.from('reservas_bondi').select('*, reservas_bondi_pasajeros(*)'),
      traerTodo<any>((d, h) =>
        sb
          .from('encuestas_bondi')
          .select('viaje, email, nombre, enviado_at, respondido_at, calificacion, que_te_parecio, a_mejorar')
          .order('enviado_at', { ascending: false })
          .range(d, h)
      ),
      listasDeContactos(sb),
    ]);
    if (errRes) throw new Error(errRes.message);

    return NextResponse.json({
      viajeSugerido: nombreViajeDesdeInfo(info),
      reservasActuales: (reservas || []).length,
      destinatarios: extraerContactos(reservas || []).length,
      listas,
      config: {
        remitenteDePrueba: FROM_EMAIL.includes('resend.dev'),
        remitente: FROM_EMAIL,
        hayReplyTo: !!REPLY_TO,
        hayAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      },
      encuestas,
    });
  } catch (e: any) {
    return NextResponse.json({ error: `${e.message} (¿corriste el SQL de sql/ en Supabase?)` }, { status: 500 });
  }
}
