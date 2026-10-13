'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Card, StatCard, Badge, BotonPeligro, BotonChico, TablaVacia, Mensaje, Cargando } from '@/components/admin/ui';
import { generarListaPdf } from '@/lib/listaPdf';

interface Pasajero {
  nombre: string;
  dni: string;
  esMenor: boolean;
  fechaNacimiento: string | null;
  parada: string;
  email: string;
  telefono: string;
  telEmergencia: string;
  localidad: string;
  esSocio: boolean;
  numSocio: string;
}
interface Reserva {
  id: string;
  fecha: string;
  nombreTitular: string;
  dniTitular: string;
  email: string;
  socio: boolean;
  numSocio: string;
  telefono: string;
  localidad: string;
  filial: string;
  cantAdultos: number;
  cantMenores: number;
  montoTotal: number;
  comprobanteUrl: string;
  metodoPago: 'transferencia' | 'mercadopago';
  estadoPago: 'pendiente' | 'pagado' | 'rechazado';
  notaAdmin: string;
  pasajeros: Pasajero[];
}

function esPdf(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url);
}

function formatearFechaNac(iso: string | null): string {
  if (!iso) return '—';
  const [anio, mes, dia] = iso.split('-');
  if (!anio || !mes || !dia) return iso;
  return `${dia}/${mes}/${anio}`;
}

function normalizar(texto: string): string {
  return (texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function aplanarPasajeros(reservas: Reserva[]) {
  return reservas.flatMap((r) =>
    r.pasajeros.map((p) => ({
      reservaId: r.id,
      nombre: p.nombre || '',
      dni: p.dni || '',
      esMenor: !!p.esMenor,
      parada: (p.parada || '').trim(),
      telefono: (!p.esMenor && p.telefono) || r.telefono || '',
      telefonoEsTitular: p.esMenor || !p.telefono,
      estadoPago: r.estadoPago,
      comentario: r.notaAdmin || '',
      titular: r.nombreTitular,
    }))
  );
}

interface InfoViaje {
  destino: string;
  fecha_salida: string | null;
  hora_salida: string;
  lugar_salida: string;
  paradas: string[];
}

export default function ReservasBondiPage() {
  const [lista, setLista] = useState<Reserva[] | null>(null);
  const [filial, setFilial] = useState('');
  const [soloMenores, setSoloMenores] = useState(false);
  const [mostrarFilialBA, setMostrarFilialBA] = useState(false);
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ texto: string; ok: boolean } | null>(null);
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [guardandoNota, setGuardandoNota] = useState<Set<string>>(new Set());
  const [guardandoEstado, setGuardandoEstado] = useState<Set<string>>(new Set());
  const [infoViaje, setInfoViaje] = useState<InfoViaje | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [paradaSel, setParadaSel] = useState<string | null>(null);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [cambiandoParada, setCambiandoParada] = useState<string | null>(null);
  const [msgParada, setMsgParada] = useState<{ texto: string; ok: boolean } | null>(null);
  const [msgCierre, setMsgCierre] = useState<{ texto: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!lista) return;
    setNotas((prev) => {
      const copia = { ...prev };
      lista.forEach((r) => {
        if (!(r.id in copia)) copia[r.id] = r.notaAdmin;
      });
      return copia;
    });
  }, [lista]);

  async function guardarNota(id: string) {
    setGuardandoNota((prev) => new Set(prev).add(id));
    const res = await fetch('/api/admin/reservas-bondi', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, notaAdmin: notas[id] || '' }),
    }).then((r) => r.json());
    setGuardandoNota((prev) => {
      const copia = new Set(prev);
      copia.delete(id);
      return copia;
    });
    setMsg({ texto: res.mensaje || res.error, ok: !!res.success });
    setTimeout(() => setMsg(null), 3000);
    if (res.success) {
      setLista((prev) => prev && prev.map((r) => (r.id === id ? { ...r, notaAdmin: notas[id] || '' } : r)));
    }
  }

  useEffect(() => {
    fetch('/api/admin/configuracion')
      .then((r) => r.json())
      .then((c) => setMostrarFilialBA(!!c.mostrar_filial_ba));
  }, []);

  useEffect(() => {
    fetch('/api/admin/info-bondi')
      .then((r) => r.json())
      .then((d) => {
        if (!d) return;
        setInfoViaje({
          destino: d.destino || '',
          fecha_salida: d.fecha_salida || null,
          hora_salida: d.hora_salida || '',
          lugar_salida: d.lugar_salida || '',
          paradas: Array.isArray(d.paradas) ? d.paradas : [],
        });
      })
      .catch(() => {});
  }, []);

  function cargar() {
    const params = new URLSearchParams();
    if (filial) params.set('filial', filial);
    if (soloMenores) params.set('soloMenores', 'true');
    fetch(`/api/admin/reservas-bondi?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setLista(Array.isArray(data) ? data : []));
  }
  // recarga cada vez que cambia algun filtro
  useEffect(cargar, [filial, soloMenores]);

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta reserva? Se borran también todos sus pasajeros.')) return;
    const res = await fetch(`/api/admin/reservas-bondi?id=${id}`, { method: 'DELETE' }).then((r) => r.json());
    setMsg({ texto: res.mensaje || res.error, ok: !!res.success });
    setTimeout(() => setMsg(null), 4000);
    cargar();
  }

  async function cambiarEstado(id: string, nuevoEstado: 'pendiente' | 'pagado' | 'rechazado') {
    setGuardandoEstado((prev) => new Set(prev).add(id));
    const res = await fetch('/api/admin/reservas-bondi', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estadoPago: nuevoEstado }),
    }).then((r) => r.json());
    setGuardandoEstado((prev) => {
      const copia = new Set(prev);
      copia.delete(id);
      return copia;
    });
    setMsg({ texto: res.mensaje || res.error, ok: !!res.success });
    setTimeout(() => setMsg(null), 3000);
    cargar();
  }

  function toggleExpandida(id: string) {
    setExpandidas((prev) => {
      const copia = new Set(prev);
      if (copia.has(id)) copia.delete(id);
      else copia.add(id);
      return copia;
    });
  }

  const todoDesplegado = lista !== null && lista.length > 0 && expandidas.size === lista.length;
  function toggleTodo() {
    if (!lista) return;
    setExpandidas(todoDesplegado ? new Set() : new Set(lista.map((r) => r.id)));
  }

  const totalPasajeros = (r: Reserva) => r.cantAdultos + r.cantMenores;

  const resumen = useMemo(() => {
    if (!lista) return { pasajeros: 0, adultos: 0, menores: 0, monto: 0 };
    return lista.reduce(
      (acc, r) => ({
        pasajeros: acc.pasajeros + totalPasajeros(r),
        adultos: acc.adultos + r.cantAdultos,
        menores: acc.menores + r.cantMenores,
        monto: acc.monto + (Number(r.montoTotal) || 0),
      }),
      { pasajeros: 0, adultos: 0, menores: 0, monto: 0 }
    );
  }, [lista]);

  const pasajerosPlano = useMemo(() => aplanarPasajeros(lista || []), [lista]);

  const paradasOrdenadas = useMemo(() => {
    const configuradas = infoViaje?.paradas || [];
    const extra = Array.from(new Set(pasajerosPlano.map((p) => p.parada).filter((p) => p && !configuradas.includes(p))));
    return [...configuradas, ...extra];
  }, [infoViaje, pasajerosPlano]);

  const cantidadPorParada = useMemo(() => {
    const m = new Map<string, number>();
    pasajerosPlano.forEach((p) => m.set(p.parada, (m.get(p.parada) || 0) + 1));
    return m;
  }, [pasajerosPlano]);

  const pasajerosFiltrados = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return pasajerosPlano
      .filter((p) => paradaSel === null || p.parada === paradaSel)
      .filter(
        (p) =>
          !q ||
          normalizar([p.nombre, p.dni, p.titular, p.telefono, p.parada, p.comentario].join(' ')).includes(q)
      )
      .sort((a, b) => {
        const ia = a.parada ? paradasOrdenadas.indexOf(a.parada) : 9999;
        const ib = b.parada ? paradasOrdenadas.indexOf(b.parada) : 9999;
        return ia - ib || a.nombre.localeCompare(b.nombre, 'es');
      });
  }, [pasajerosPlano, busqueda, paradaSel, paradasOrdenadas]);

  async function descargarPdf() {
    if (!lista) return;
    setGenerandoPdf(true);
    try {
      const res = await fetch('/api/admin/reservas-bondi');
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error('lista');
      const filas = aplanarPasajeros(data as Reserva[]);
      if (filas.length === 0) {
        setMsg({ texto: 'Todavía no hay pasajeros para imprimir.', ok: false });
        setTimeout(() => setMsg(null), 3500);
        return;
      }
      const configuradas = infoViaje?.paradas || [];
      const extra = Array.from(new Set(filas.map((f) => f.parada).filter((x) => x && !configuradas.includes(x))));
      await generarListaPdf({
        filas,
        ordenParadas: [...configuradas, ...extra],
        viaje: infoViaje
          ? { destino: infoViaje.destino, fechaSalida: infoViaje.fecha_salida, horaSalida: infoViaje.hora_salida, lugarSalida: infoViaje.lugar_salida }
          : null,
        filtros: [],
      });
    } catch {
      setMsg({ texto: 'No se pudo generar el PDF. Probá de nuevo.', ok: false });
      setTimeout(() => setMsg(null), 4000);
    } finally {
      setGenerandoPdf(false);
    }
  }

  async function cambiarParada(p: { reservaId: string; dni: string; nombre: string; parada: string }, nueva: string) {
    if (nueva === p.parada) return;
    const clave = `${p.reservaId}-${p.dni}`;
    setCambiandoParada(clave);
    setMsgParada(null);
    try {
      const res = await fetch('/api/admin/reservas-bondi/parada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservaId: p.reservaId, dni: p.dni, parada: nueva }),
      }).then((r) => r.json());
      if (res.success) {
        setLista((prev) =>
          prev
            ? prev.map((r) =>
                r.id === p.reservaId ? { ...r, pasajeros: r.pasajeros.map((x) => (x.dni === p.dni ? { ...x, parada: nueva } : x)) } : r
              )
            : prev
        );
        setMsgParada({ texto: `${p.nombre}: ${nueva ? `ahora sube en ${nueva}` : 'sin parada'}.`, ok: true });
      } else {
        setMsgParada({ texto: res.error || 'No se pudo cambiar la parada.', ok: false });
      }
    } catch {
      setMsgParada({ texto: 'No se pudo conectar con el servidor. Probá de nuevo.', ok: false });
    } finally {
      setCambiandoParada(null);
      setTimeout(() => setMsgParada(null), 5000);
    }
  }

  async function cerrarViaje() {
    if (cerrando) return;
    setCerrando(true);
    setMsgCierre(null);
    try {
      const resumen = await fetch('/api/admin/encuesta').then((r) => r.json());
      if (resumen.error) {
        setMsgCierre({ texto: resumen.error, ok: false });
        return;
      }
      if (!resumen.reservasActuales) {
        setMsgCierre({ texto: 'No hay reservas para cerrar.', ok: false });
        return;
      }
      const sugerido: string = resumen.viajeSugerido || resumen.encuestas?.[0]?.viaje || '';
      const nombre = (window.prompt('Nombre de este viaje (con este nombre se guarda la lista de contactos):\n\nEj: Córdoba - 11/10/2026', sugerido) || '').trim();
      if (!nombre) return;

      const encuestaEnviada = (resumen.encuestas || []).some((e: any) => e.viaje === nombre);
      const ok = confirm(
        `Vas a CERRAR el viaje "${nombre}".\n\n` +
          `• Se guardan ${resumen.destinatarios} mails como lista de contactos de este viaje.\n` +
          `• Se BORRAN las ${resumen.reservasActuales} reservas de Reservas Bondi (con sus pasajeros).\n` +
          '• No se tocan Info Bondi, las encuestas ni los contactos de otros viajes.\n\n' +
          (encuestaEnviada ? '' : 'Ojo: todavía no enviaste la encuesta de este viaje con ese nombre (igual la podés enviar después desde los contactos guardados).\n\n') +
          'Esto no se puede deshacer. ¿Cerrar viaje?'
      );
      if (!ok) return;

      const res = await fetch('/api/admin/reservas-bondi/cerrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viaje: nombre }),
      }).then((r) => r.json());
      setMsgCierre({ texto: res.mensaje || res.error || 'Listo.', ok: !!res.success });
      cargar();
    } catch {
      setMsgCierre({ texto: 'No se pudo conectar con el servidor. Probá de nuevo.', ok: false });
    } finally {
      setCerrando(false);
    }
  }

  const hayFiltroBuscador = busqueda.trim() !== '' || paradaSel !== null;

  return (
    <AdminShell titulo="🎫 Reservas Bondi">
      {lista !== null && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard valor={resumen.pasajeros} etiqueta="Total pasajeros" />
          <StatCard valor={resumen.adultos} etiqueta="Total adultos" />
          <StatCard valor={resumen.menores} etiqueta="Total menores" />
          <StatCard valor={`$${resumen.monto.toLocaleString('es-AR')}`} etiqueta="Monto esperado" />
        </div>
      )}

      <Card
        title="Reservas del colectivo"
        action={
          <div className="flex items-center gap-3 flex-wrap">
            {mostrarFilialBA && (
              <select className="campo-input !w-auto !py-1.5 !text-xs" value={filial} onChange={(e) => setFilial(e.target.value)}>
                <option value="">Todas las filiales</option>
                <option value="Capital Federal">Capital Federal</option>
                <option value="Buenos Aires">Buenos Aires</option>
              </select>
            )}
            <label className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-600">
              <input type="checkbox" checked={soloMenores} onChange={(e) => setSoloMenores(e.target.checked)} />
              Solo con menores
            </label>
            {lista && lista.length > 0 && (
              <BotonChico onClick={toggleTodo}>{todoDesplegado ? 'Contraer todo' : 'Desplegar todo'}</BotonChico>
            )}
            <a
              href={`/api/admin/reservas-bondi/exportar?${new URLSearchParams({
                ...(filial ? { filial } : {}),
                ...(soloMenores ? { soloMenores: 'true' } : {}),
              }).toString()}`}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md px-3 py-1.5"
            >
              📥 Descargar lista de pasajeros
            </a>
            <button
              type="button"
              onClick={descargarPdf}
              disabled={generandoPdf || !lista}
              title="PDF para imprimir, con parada, comentarios y casilla para tildar quién subió"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-white bg-navy hover:bg-navy-light disabled:bg-slate-400 rounded-md px-3 py-1.5"
            >
              {generandoPdf ? 'Generando PDF...' : '🖨️ Descargar lista completa (PDF)'}
            </button>
          </div>
        }
      >
        {msg && <Mensaje texto={msg.texto} ok={msg.ok} />}
        {lista === null ? (
          <Cargando />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[10.5px] uppercase text-slate-500">
                  <th className="p-2.5">Fecha</th>
                  <th className="p-2.5">Titular</th>
                  <th className="p-2.5">DNI</th>
                  <th className="p-2.5">Socio</th>
                  {mostrarFilialBA && <th className="p-2.5">Filial</th>}
                  <th className="p-2.5">Pasajeros</th>
                  <th className="p-2.5">Monto</th>
                  <th className="p-2.5">Pago</th>
                  <th className="p-2.5">Comprobante</th>
                  <th className="p-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {lista.length === 0 && <TablaVacia colSpan={mostrarFilialBA ? 10 : 9}>No hay reservas que coincidan con el filtro.</TablaVacia>}
                {lista.map((r) => {
                  const expandida = expandidas.has(r.id);
                  return (
                    <Fragment key={r.id}>
                      <tr className="border-b border-slate-100 hover:bg-slate-50 align-top">
                        <td className="p-2.5 whitespace-nowrap">{new Date(r.fecha).toLocaleString('es-AR')}</td>
                        <td className="p-2.5">
                          <div>{r.nombreTitular}</div>
                          {r.notaAdmin && <div className="text-[11px] text-slate-500 italic mt-0.5">📝 {r.notaAdmin}</div>}
                        </td>
                        <td className="p-2.5">{r.dniTitular}</td>
                        <td className="p-2.5">{r.socio ? `Sí (#${r.numSocio})` : 'No'}</td>
                        {mostrarFilialBA && <td className="p-2.5">{r.filial}</td>}
                        <td className="p-2.5">
                          <button className="text-navy font-bold underline decoration-dotted" onClick={() => toggleExpandida(r.id)}>
                            {totalPasajeros(r)} ({r.cantAdultos} ad. {r.cantMenores > 0 && <Badge color="amber">{r.cantMenores} menor{r.cantMenores !== 1 ? 'es' : ''}</Badge>})
                          </button>
                        </td>
                        <td className="p-2.5 font-bold">${Number(r.montoTotal).toLocaleString('es-AR')}</td>
                        <td className="p-2.5">
                          <div className="flex flex-col gap-1 items-start">
                            <Badge color={r.metodoPago === 'mercadopago' ? 'slate' : 'emerald'}>
                              {r.metodoPago === 'mercadopago' ? '💳 Mercado Pago' : '🏦 Transferencia'}
                            </Badge>
                            <select
                              value={r.estadoPago}
                              disabled={guardandoEstado.has(r.id)}
                              onChange={(e) => cambiarEstado(r.id, e.target.value as 'pendiente' | 'pagado' | 'rechazado')}
                              className={`text-[11px] font-bold rounded px-1.5 py-1 border-[1.5px] ${
                                r.estadoPago === 'pagado'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : r.estadoPago === 'rechazado'
                                  ? 'bg-red-100 text-red-800 border-red-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="pagado">Pagado</option>
                              <option value="rechazado">Rechazado</option>
                            </select>
                          </div>
                        </td>
                        <td className="p-2.5">
                          {r.comprobanteUrl ? (
                            esPdf(r.comprobanteUrl) ? (
                              <a
                                href={r.comprobanteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-navy font-bold underline decoration-dotted text-[12px]"
                              >
                                📄 Ver PDF
                              </a>
                            ) : (
                              <img
                                src={r.comprobanteUrl}
                                className="w-14 h-14 object-cover rounded border border-slate-200 cursor-pointer"
                                onClick={() => setLightbox(r.comprobanteUrl)}
                                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                              />
                            )
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Sin comprobante</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <BotonPeligro onClick={() => eliminar(r.id)}>Eliminar</BotonPeligro>
                        </td>
                      </tr>
                      {expandida && (
                        <tr className="bg-slate-50">
                          <td colSpan={mostrarFilialBA ? 10 : 9} className="p-3.5">
                            <p className="text-[11px] font-bold text-slate-500 uppercase mb-2">Pasajeros de esta reserva</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {r.pasajeros.map((p, i) => (
                                <div key={i} className="bg-white border border-slate-200 rounded-lg px-3.5 py-3 text-[12.5px] space-y-1">
                                  <p className="font-bold text-navy m-0">
                                    {p.nombre} {p.esMenor && <Badge color="amber">Menor</Badge>}
                                  </p>
                                  <p className="m-0 text-slate-600">DNI: {p.dni} · Nac.: {formatearFechaNac(p.fechaNacimiento)}</p>
                                  <p className="m-0 text-slate-600">¿Socio?: {p.esSocio ? `Sí (#${p.numSocio})` : 'No'}</p>
                                  {p.parada && <p className="m-0 text-slate-600">Parada: {p.parada}</p>}
                                  {!p.esMenor && (
                                    <p className="m-0 text-slate-600">
                                      {p.email} · {p.telefono}
                                      {p.telEmergencia && p.telEmergencia !== '-' && ` (emerg: ${p.telEmergencia})`}
                                      {p.localidad && ` · ${p.localidad}`}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="mt-3.5 pt-3.5 border-t border-slate-200">
                              <p className="text-[11px] font-bold text-slate-500 uppercase mb-1.5">Comentario interno (no lo ve el pasajero)</p>
                              <textarea
                                className="campo-input !text-[12.5px] w-full"
                                rows={2}
                                value={notas[r.id] ?? r.notaAdmin}
                                onChange={(e) => setNotas((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                placeholder="Ej: avisó que llega tarde a la parada, pagó con demora, etc."
                              />
                              <div className="mt-1.5">
                                <BotonChico onClick={() => guardarNota(r.id)}>
                                  {guardandoNota.has(r.id) ? 'Guardando...' : 'Guardar comentario'}
                                </BotonChico>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="🔎 Buscar pasajero">
        {lista === null ? (
          <Cargando />
        ) : (
          <>
            <div className="flex gap-2 mb-2">
              <input
                type="search"
                className="campo-input !py-1.5 !text-xs flex-1 min-w-0"
                placeholder="Nombre, DNI, teléfono..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <select
                className="campo-input !w-auto !py-1.5 !text-xs max-w-[46%] font-bold text-navy"
                value={paradaSel === null ? '__todas__' : paradaSel === '' ? '__sin__' : paradaSel}
                onChange={(e) => setParadaSel(e.target.value === '__todas__' ? null : e.target.value === '__sin__' ? '' : e.target.value)}
                aria-label="Filtrar por parada"
              >
                <option value="__todas__">🚏 Todas ({pasajerosPlano.length})</option>
                {paradasOrdenadas.map((par) => (
                  <option key={par} value={par}>
                    {par} ({cantidadPorParada.get(par) || 0})
                  </option>
                ))}
                {(cantidadPorParada.get('') || 0) > 0 && <option value="__sin__">Sin parada ({cantidadPorParada.get('')})</option>}
              </select>
            </div>

            <div className="flex items-center justify-between mb-1.5 text-[11.5px]">
              <span className="font-bold text-slate-500">
                {pasajerosFiltrados.length} de {pasajerosPlano.length}
              </span>
              {hayFiltroBuscador && (
                <button
                  type="button"
                  className="font-bold text-navy underline decoration-dotted"
                  onClick={() => {
                    setBusqueda('');
                    setParadaSel(null);
                  }}
                >
                  Limpiar
                </button>
              )}
            </div>

            {msgParada && (
              <p className={`text-[12px] font-bold rounded-md px-2.5 py-1.5 mb-2 ${msgParada.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {msgParada.ok ? '✓ ' : ''}
                {msgParada.texto}
              </p>
            )}
            <p className="text-[11px] text-slate-500 mb-1.5">Para cambiar la parada de alguien, tocá su parada y elegí la nueva: se guarda al instante.</p>
            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {pasajerosFiltrados.length === 0 && <p className="text-center text-slate-400 text-xs py-5 m-0">Sin resultados.</p>}
              {pasajerosFiltrados.map((p, i) => (
                <div key={`${p.dni}-${i}`} className="px-2.5 py-2 text-[12px]">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-navy leading-tight">
                      {p.nombre} {p.esMenor && <span className="text-amber-700 text-[10.5px]">(menor)</span>}
                    </span>
                    <select
                      className="shrink-0 max-w-[48%] text-[11px] font-bold bg-slate-200 text-slate-700 rounded px-1 py-1 border border-slate-300 disabled:opacity-50"
                      value={p.parada}
                      disabled={cambiandoParada === `${p.reservaId}-${p.dni}`}
                      onChange={(e) => cambiarParada(p, e.target.value)}
                      aria-label={`Parada de ${p.nombre}`}
                    >
                      <option value="">Sin parada</option>
                      {[...(infoViaje?.paradas || []), ...(p.parada && !(infoViaje?.paradas || []).includes(p.parada) ? [p.parada] : [])].map((par) => (
                        <option key={par} value={par}>
                          🚏 {par}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    DNI {p.dni}
                    {p.telefono && p.telefono !== '-' && ` · ${p.telefono}${p.telefonoEsTitular ? ' (tit.)' : ''}`}
                    {p.estadoPago !== 'pagado' && (
                      <span className={p.estadoPago === 'rechazado' ? 'text-red-700 font-bold' : 'text-amber-700 font-bold'}>
                        {' · '}
                        {p.estadoPago === 'rechazado' ? 'Pago rechazado' : 'Pago pendiente'}
                      </span>
                    )}
                  </div>
                  {p.comentario && <div className="text-slate-500 italic text-[11px] mt-0.5">📝 {p.comentario}</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card title="Cerrar viaje">
        {msgCierre && <Mensaje texto={msgCierre.texto} ok={msgCierre.ok} />}
        <p className="text-[12.5px] text-slate-600 mb-3">
          Cuando el viaje terminó: guarda los mails de los pasajeros como lista de contactos de ese viaje (para la encuesta y para avisarles de próximos viajes) y
          después vacía esta lista de reservas para empezar el siguiente. Pide confirmación.
        </p>
        <BotonPeligro onClick={cerrarViaje}>{cerrando ? 'Procesando...' : 'Cerrar viaje'}</BotonPeligro>
      </Card>

      {lightbox && (
        <div className="fixed inset-0 bg-black/85 z-[9999] flex items-center justify-center p-5" onClick={() => setLightbox(null)}>
          <button className="absolute top-5 right-6 text-white text-3xl">✕</button>
          <img src={lightbox} className="max-w-full max-h-[90vh] rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </AdminShell>
  );
}
