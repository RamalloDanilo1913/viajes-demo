import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const filial = req.nextUrl.searchParams.get('filial');
  const soloMenores = req.nextUrl.searchParams.get('soloMenores') === 'true';

  const sb = supabaseAdmin();
  let query = sb
    .from('reservas_bondi')
    .select('*, reservas_bondi_pasajeros(*)')
    .order('created_at', { ascending: false });

  if (filial) query = query.eq('filial', filial);
  if (soloMenores) query = query.gt('cant_menores', 0);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rutaDe = (valor: string | null) =>
    !valor ? null : valor.includes('/comprobantes/') ? decodeURIComponent(valor.split('/comprobantes/').pop()!.split('?')[0]) : valor;
  const rutas = Array.from(new Set((data || []).map((r) => rutaDe(r.comprobante_url)).filter((x): x is string => !!x)));
  const firmados = new Map<string, string>();
  if (rutas.length) {
    const { data: urls } = await sb.storage.from('comprobantes').createSignedUrls(rutas, 3600);
    (urls || []).forEach((u) => { if (u.path && u.signedUrl) firmados.set(u.path, u.signedUrl); });
  }

  const resultado = (data || []).map((r) => ({
    id: r.id,
    fecha: r.created_at,
    nombreTitular: r.nombre_titular,
    dniTitular: r.dni_titular,
    email: r.email,
    socio: r.socio,
    numSocio: r.num_socio,
    telefono: r.telefono,
    telEmergencia: r.tel_emergencia,
    localidad: r.localidad,
    filial: r.filial,
    cantAdultos: r.cant_adultos,
    cantMenores: r.cant_menores,
    montoTotal: r.monto_total,
    comprobanteUrl: (rutaDe(r.comprobante_url) && firmados.get(rutaDe(r.comprobante_url)!)) || '',
    metodoPago: r.metodo_pago || 'transferencia',
    estadoPago: r.estado_pago || 'pendiente',
    notaAdmin: r.nota_admin || '',
    pasajeros: (r.reservas_bondi_pasajeros || []).map((p: any) => ({
      nombre: p.nombre,
      dni: p.dni,
      esMenor: p.es_menor,
      fechaNacimiento: p.fecha_nacimiento,
      parada: p.parada,
      email: p.email,
      telefono: p.telefono,
      telEmergencia: p.tel_emergencia,
      localidad: p.localidad,
      esSocio: p.socio,
      numSocio: p.num_socio,
    })),
  }));

  return NextResponse.json(resultado);
}

export async function DELETE(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'Falta el id.' });

  const sb = supabaseAdmin();
  const { error } = await sb.from('reservas_bondi').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, error: error.message });
  return NextResponse.json({ success: true, mensaje: 'Reserva eliminada.' });
}

export async function PATCH(req: NextRequest) {
  const usuario = await requireAdmin(req);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id, notaAdmin, estadoPago } = await req.json();
  if (!id) return NextResponse.json({ success: false, error: 'Falta el id.' });

  const sb = supabaseAdmin();

  if (typeof notaAdmin === 'string') {
    const { error } = await sb.from('reservas_bondi').update({ nota_admin: notaAdmin }).eq('id', id);
    if (error) return NextResponse.json({ success: false, error: error.message });
    if (estadoPago === undefined) return NextResponse.json({ success: true, mensaje: 'Comentario guardado.' });
  }

  if (estadoPago) {
    if (!['pendiente', 'pagado', 'rechazado'].includes(estadoPago)) {
      return NextResponse.json({ success: false, error: 'Estado inválido.' });
    }

    const { data: reserva } = await sb.from('reservas_bondi').select('metodo_pago').eq('id', id).single();
    if (!reserva) return NextResponse.json({ success: false, error: 'No encontramos esa reserva.' });

    if (reserva.metodo_pago === 'mercadopago') {
      const { error } = await sb.rpc('actualizar_estado_pago_mp', {
        p_reserva_id: id,
        p_estado: estadoPago,
        p_payment_id: `ajuste-manual-${usuario}`,
        p_preference_id: null,
      });
      if (error) return NextResponse.json({ success: false, error: error.message });
    } else {
      const { error } = await sb.from('reservas_bondi').update({ estado_pago: estadoPago }).eq('id', id);
      if (error) return NextResponse.json({ success: false, error: error.message });
    }
  }

  return NextResponse.json({ success: true, mensaje: 'Cambios guardados.' });
}
