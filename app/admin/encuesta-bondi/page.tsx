'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Card, StatCard, BotonChico, Mensaje, Cargando } from '@/components/admin/ui';

interface EncuestaFila {
  viaje: string;
  email: string;
  nombre: string;
  enviado_at: string;
  respondido_at: string | null;
  calificacion: number | null;
  que_te_parecio: string;
  a_mejorar: string;
}

interface ListaContactos {
  viaje: string;
  total: number;
  activos: number;
  bajas: number;
  ultimaActualizacion: string;
}

interface Campania {
  id: string;
  viaje_lista: string;
  asunto: string;
  enviados: number;
  fallidos: number;
  enviado_at: string;
}

interface Resumen {
  viajeSugerido: string;
  reservasActuales: number;
  destinatarios: number;
  listas: ListaContactos[];
  config: { remitenteDePrueba: boolean; remitente: string; hayReplyTo: boolean; hayAppUrl: boolean };
  encuestas: EncuestaFila[];
}

const ACTUALES = '__actuales__';

function Estrellas({ n }: { n: number }) {
  return (
    <span className="text-amber-400 tracking-tight" aria-label={`${n} de 5`}>
      {'★'.repeat(n)}
      <span className="text-slate-300">{'★'.repeat(5 - n)}</span>
    </span>
  );
}

function consejosAsunto(asunto: string): string[] {
  const c: string[] = [];
  const letras = asunto.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, '');
  if (letras.length >= 6 && letras.replace(/[^A-ZÁÉÍÓÚÑ]/g, '').length / letras.length > 0.6) c.push('evitá escribir todo en MAYÚSCULAS');
  if (/!{2,}|¡.*!.*!/.test(asunto)) c.push('evitá varios signos de exclamación');
  if (/\b(gratis|urgente|ganaste|oferta|promoci[oó]n|100%)\b/i.test(asunto)) c.push('evitá palabras como "gratis", "urgente" u "oferta"');
  if (asunto.length > 70) c.push('un asunto de menos de 70 caracteres se ve completo y filtra mejor');
  return c;
}

export default function EncuestaBondiPage() {
  const [datos, setDatos] = useState<Resumen | null>(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [msg, setMsg] = useState<{ texto: string; ok: boolean } | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const [origenEncuesta, setOrigenEncuesta] = useState(ACTUALES);
  const [viaje, setViaje] = useState('');
  const [emailPrueba, setEmailPrueba] = useState('');
  const [viajeResultados, setViajeResultados] = useState('');

  const [viajeGuardar, setViajeGuardar] = useState('');

  const [listaMail, setListaMail] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [botonTexto, setBotonTexto] = useState('');
  const [botonLink, setBotonLink] = useState('');
  const [emailPruebaMail, setEmailPruebaMail] = useState('');

  function cargar() {
    fetch('/api/admin/encuesta')
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Error al cargar.');
        setDatos(d);
        setViaje((v) => v || d.viajeSugerido || '');
        setViajeGuardar((v) => v || d.viajeSugerido || '');
        setViajeResultados((v) => v || d.encuestas[0]?.viaje || '');
        setListaMail((v) => v || d.listas[0]?.viaje || '');
      })
      .catch((e) => setErrorCarga(e.message));
    fetch('/api/admin/mail-personalizado')
      .then((r) => r.json())
      .then((d) => d && Array.isArray(d.campanias) && setCampanias(d.campanias))
      .catch(() => {});
  }
  useEffect(cargar, []);

  function avisar(texto: string, ok: boolean, ms = 10000) {
    setMsg({ texto, ok });
    setTimeout(() => setMsg(null), ms);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const listaEncuesta = datos?.listas.find((l) => l.viaje === origenEncuesta);
  const viajeEncuesta = origenEncuesta === ACTUALES ? viaje : origenEncuesta;
  const destinatariosEncuesta = origenEncuesta === ACTUALES ? datos?.destinatarios ?? 0 : listaEncuesta?.activos ?? 0;

  async function enviarEncuesta(modo: 'prueba' | 'todos') {
    if (modo === 'todos') {
      const ok = confirm(
        `Vas a enviar la encuesta de "${viajeEncuesta}" a ${destinatariosEncuesta} personas` +
          `${origenEncuesta === ACTUALES ? ' (las reservas actuales de Reservas Bondi)' : ' (lista de contactos guardada)'}.\n\n` +
          'Esto no se puede deshacer. Se omiten los dados de baja y los que ya la recibieron para este viaje.\n\n¿Enviar ahora?'
      );
      if (!ok) return;
    }
    setOcupado(`encuesta-${modo}`);
    try {
      const res = await fetch('/api/admin/encuesta/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viaje: viajeEncuesta, modo, emailPrueba, origen: origenEncuesta === ACTUALES ? 'actuales' : 'lista' }),
      }).then((r) => r.json());
      avisar(res.mensaje || res.error || 'Listo.', !!res.success);
      if (modo === 'todos') cargar();
    } catch {
      avisar('No se pudo conectar con el servidor. Probá de nuevo.', false);
    } finally {
      setOcupado(null);
    }
  }

  async function guardarContactos() {
    setOcupado('contactos');
    try {
      const res = await fetch('/api/admin/contactos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viaje: viajeGuardar }),
      }).then((r) => r.json());
      avisar(res.mensaje || res.error, !!res.success);
      cargar();
    } finally {
      setOcupado(null);
    }
  }

  const listaMailSel = datos?.listas.find((l) => l.viaje === listaMail);
  const consejos = consejosAsunto(asunto);

  async function enviarMail(modo: 'prueba' | 'enviar') {
    if (modo === 'enviar') {
      const ok = confirm(
        `Vas a enviar "${asunto}" a ${listaMailSel?.activos ?? 0} personas de la lista "${listaMail}".\n\n` +
          'Esto no se puede deshacer. Se omiten los que se dieron de baja.\n\n¿Enviar ahora?'
      );
      if (!ok) return;
    }
    setOcupado(`mail-${modo}`);
    try {
      const res = await fetch('/api/admin/mail-personalizado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modo, viaje: listaMail, asunto, mensaje, botonTexto, botonLink, emailPrueba: emailPruebaMail }),
      }).then((r) => r.json());
      avisar(res.mensaje || res.error || 'Listo.', !!res.success);
      if (modo === 'enviar') cargar();
    } catch {
      avisar('No se pudo conectar con el servidor. Probá de nuevo.', false);
    } finally {
      setOcupado(null);
    }
  }

  const viajes = useMemo(() => Array.from(new Set((datos?.encuestas || []).map((e) => e.viaje))), [datos]);
  const delViaje = useMemo(() => (datos?.encuestas || []).filter((e) => e.viaje === viajeResultados), [datos, viajeResultados]);
  const respondidas = delViaje.filter((e) => e.respondido_at && e.calificacion);
  const promedio = respondidas.length ? respondidas.reduce((a, e) => a + (e.calificacion || 0), 0) / respondidas.length : 0;

  return (
    <AdminShell titulo="⭐ Encuesta y avisos">
      {msg && <Mensaje texto={msg.texto} ok={msg.ok} />}
      {errorCarga && <Mensaje texto={errorCarga} ok={false} />}

      {datos?.config.remitenteDePrueba && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 text-[12.5px] rounded-lg p-3 mb-5">
          <strong>Falta configurar el remitente.</strong> Estás usando el remitente de prueba de Resend ({datos.config.remitente}). Con ese remitente los
          mails caen en spam y solo llegan al dueño de la cuenta. Verificá tu dominio en Resend (SPF, DKIM y DMARC) y cargá <code>RESEND_FROM_EMAIL</code>{' '}
          en Vercel. Hasta entonces el envío a todos está bloqueado; la prueba sí funciona.
        </div>
      )}
      {datos && !datos.config.hayAppUrl && (
        <Mensaje texto="Falta la variable NEXT_PUBLIC_APP_URL en Vercel: los links del mail no van a funcionar." ok={false} />
      )}

      <Card title="1. Encuesta post viaje (manual)">
        {datos === null && !errorCarga ? (
          <Cargando />
        ) : (
          <>
            <label className="block text-[12px] font-bold text-slate-600 uppercase mb-1">Enviar a</label>
            <select className="campo-input mb-3" value={origenEncuesta} onChange={(e) => setOrigenEncuesta(e.target.value)}>
              <option value={ACTUALES}>Reservas Bondi actuales ({datos?.destinatarios ?? 0} mails)</option>
              {(datos?.listas || []).map((l) => (
                <option key={l.viaje} value={l.viaje}>
                  Contactos guardados: {l.viaje} ({l.activos})
                </option>
              ))}
            </select>

            {origenEncuesta === ACTUALES ? (
              <>
                <label className="block text-[12px] font-bold text-slate-600 uppercase mb-1">Nombre del viaje (aparece en el mail y agrupa los resultados)</label>
                <input className="campo-input mb-1" value={viaje} onChange={(e) => setViaje(e.target.value)} placeholder="Ej: Córdoba - 11/10/2026" maxLength={120} />
                <p className="text-[11.5px] text-slate-500 mb-3">
                  Al enviar, esos mails también se guardan como lista de contactos con este nombre. Si ya cerraste el viaje, elegí arriba su lista guardada.
                </p>
              </>
            ) : (
              <p className="text-[12px] text-slate-500 mb-3">Viaje: <strong>{origenEncuesta}</strong>. Si volvés a enviar, no se le repite a quien ya la recibió.</p>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3">
              <p className="text-[12px] font-bold text-navy mb-2">Probalo primero en tu casilla</p>
              <div className="flex gap-2 flex-wrap">
                <input type="email" className="campo-input !w-auto flex-1 min-w-[200px]" placeholder="tu-mail@gmail.com" value={emailPrueba} onChange={(e) => setEmailPrueba(e.target.value)} />
                <BotonChico onClick={() => ocupado === null && enviarEncuesta('prueba')}>{ocupado === 'encuesta-prueba' ? 'Enviando...' : 'Enviar prueba'}</BotonChico>
              </div>
              <p className="text-[11.5px] text-slate-500 mt-2">
                Mandátela a un Gmail y a un Outlook/Hotmail. Si llega a “Principal” o “Recibidos” (y no a spam), estás listo. En Gmail: ⋮ → “Mostrar original” y
                chequeá que SPF, DKIM y DMARC digan PASS.
              </p>
            </div>

            <button
              type="button"
              className="btn-primario !w-auto px-5 !py-2.5"
              disabled={ocupado !== null || viajeEncuesta.trim().length < 3 || !destinatariosEncuesta}
              onClick={() => enviarEncuesta('todos')}
            >
              {ocupado === 'encuesta-todos' ? 'Enviando... no cierres la página' : `Enviar encuesta a ${destinatariosEncuesta} personas`}
            </button>
          </>
        )}
      </Card>

      <Card title="2. Resultados de la encuesta">
        {datos === null ? (
          <Cargando />
        ) : viajes.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">Todavía no se envió ninguna encuesta.</p>
        ) : (
          <>
            <select className="campo-input mb-4 !w-auto" value={viajeResultados} onChange={(e) => setViajeResultados(e.target.value)}>
              {viajes.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <StatCard valor={delViaje.length} etiqueta="Enviadas" />
              <StatCard valor={`${respondidas.length}${delViaje.length ? ` (${Math.round((respondidas.length / delViaje.length) * 100)}%)` : ''}`} etiqueta="Respondidas" />
              <StatCard valor={respondidas.length ? promedio.toFixed(1) : '—'} etiqueta="Promedio ★" />
            </div>

            {respondidas.length > 0 && (
              <div className="mb-5 max-w-xs">
                {[5, 4, 3, 2, 1].map((n) => {
                  const cant = respondidas.filter((e) => e.calificacion === n).length;
                  return (
                    <div key={n} className="flex items-center gap-2 text-[12px] mb-1">
                      <span className="w-6 text-right font-bold text-slate-600">{n}★</span>
                      <div className="flex-1 bg-slate-100 rounded h-3 overflow-hidden">
                        <div className="bg-amber-400 h-3" style={{ width: `${(cant / respondidas.length) * 100}%` }} />
                      </div>
                      <span className="w-6 text-slate-500">{cant}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {respondidas.length === 0 && <p className="text-slate-400 text-xs text-center py-5 m-0">Nadie respondió todavía.</p>}
              {respondidas.map((e, i) => (
                <div key={i} className="px-3 py-2.5 text-[12.5px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-navy">{e.nombre || e.email}</span>
                    <Estrellas n={e.calificacion || 0} />
                  </div>
                  {e.que_te_parecio && <p className="text-slate-700 mt-1 mb-0">“{e.que_te_parecio}”</p>}
                  {e.a_mejorar && (
                    <p className="text-slate-600 mt-1 mb-0">
                      <strong className="text-[11px] uppercase text-slate-500">A mejorar: </strong>
                      {e.a_mejorar}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card title="3. Mail personalizado (avisar otro viaje)">
        {datos === null ? (
          <Cargando />
        ) : datos.listas.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">Todavía no hay listas de contactos. Se crean al cerrar un viaje, al enviar la encuesta o al guardar pasajeros abajo.</p>
        ) : (
          <>
            <label className="block text-[12px] font-bold text-slate-600 uppercase mb-1">Enviar a la lista del viaje</label>
            <select className="campo-input mb-3" value={listaMail} onChange={(e) => setListaMail(e.target.value)}>
              {datos.listas.map((l) => (
                <option key={l.viaje} value={l.viaje}>
                  {l.viaje} ({l.activos} contactos{l.bajas ? `, ${l.bajas} de baja` : ''})
                </option>
              ))}
            </select>

            <label className="block text-[12px] font-bold text-slate-600 uppercase mb-1">Asunto</label>
            <input className="campo-input mb-1" value={asunto} onChange={(e) => setAsunto(e.target.value)} maxLength={120} placeholder="Ej: Ya está confirmado el próximo Bondi Oficial" />
            {consejos.length > 0 && <p className="text-[11.5px] text-amber-700 mb-2">Para que no caiga en spam: {consejos.join('; ')}.</p>}

            <label className="block text-[12px] font-bold text-slate-600 uppercase mb-1 mt-2">Mensaje</label>
            <textarea
              className="campo-input mb-1"
              rows={8}
              maxLength={5000}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder={'Hola {nombre},\n\nYa está confirmado el próximo Bondi Oficial a ...\n\nSalida: ...\nPrecio: ...\n\nLas reservas se abren el ...'}
            />
            <p className="text-[11.5px] text-slate-500 mb-3">
              Escribí <code>{'{nombre}'}</code> donde quieras que aparezca el nombre de pila de cada persona. Una línea en blanco separa párrafos. Al final del mail se agrega
              solo la firma de la filial y el link para darse de baja.
            </p>

            <div className="grid sm:grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-[12px] font-bold text-slate-600 uppercase mb-1">Botón (opcional): texto</label>
                <input className="campo-input" value={botonTexto} onChange={(e) => setBotonTexto(e.target.value)} maxLength={60} placeholder="Ej: Reservar mi lugar" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-600 uppercase mb-1">Botón (opcional): link</label>
                <input className="campo-input" value={botonLink} onChange={(e) => setBotonLink(e.target.value)} maxLength={500} placeholder="https://..." />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3">
              <p className="text-[12px] font-bold text-navy mb-2">Probalo primero en tu casilla</p>
              <div className="flex gap-2 flex-wrap">
                <input type="email" className="campo-input !w-auto flex-1 min-w-[200px]" placeholder="tu-mail@gmail.com" value={emailPruebaMail} onChange={(e) => setEmailPruebaMail(e.target.value)} />
                <BotonChico onClick={() => ocupado === null && enviarMail('prueba')}>{ocupado === 'mail-prueba' ? 'Enviando...' : 'Enviar prueba'}</BotonChico>
              </div>
            </div>

            <button
              type="button"
              className="btn-primario !w-auto px-5 !py-2.5"
              disabled={ocupado !== null || asunto.trim().length < 3 || mensaje.trim().length < 10 || !listaMailSel?.activos}
              onClick={() => enviarMail('enviar')}
            >
              {ocupado === 'mail-enviar' ? 'Enviando... no cierres la página' : `Enviar a ${listaMailSel?.activos ?? 0} personas`}
            </button>

            {campanias.length > 0 && (
              <div className="mt-5">
                <p className="text-[12px] font-bold text-slate-500 uppercase mb-1.5">Últimos envíos</p>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 text-[12px]">
                  {campanias.map((c) => (
                    <div key={c.id} className="px-3 py-2">
                      <span className="font-bold text-navy">{c.asunto}</span>
                      <span className="text-slate-500">
                        {' '}
                        → {c.viaje_lista} · {c.enviados} enviados{c.fallidos ? ` · ${c.fallidos} fallidos` : ''} · {new Date(c.enviado_at).toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Card title="4. Contactos guardados (una lista por viaje)">
        <p className="text-[12.5px] text-slate-600 mb-3">
          Cada viaje tiene su propia lista, separada de las demás. Se crean al <strong>cerrar el viaje</strong> (botón en Reservas Bondi), al enviar la encuesta o al
          vaciar el colectivo; también podés guardar a mano las reservas actuales:
        </p>
        <div className="flex gap-2 flex-wrap mb-4">
          <input className="campo-input !w-auto flex-1 min-w-[220px]" value={viajeGuardar} onChange={(e) => setViajeGuardar(e.target.value)} placeholder="Nombre del viaje (ej: Córdoba - 11/10/2026)" maxLength={120} />
          <BotonChico onClick={() => ocupado === null && guardarContactos()}>{ocupado === 'contactos' ? 'Guardando...' : 'Guardar pasajeros actuales'}</BotonChico>
        </div>

        {datos === null ? (
          <Cargando />
        ) : datos.listas.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">Todavía no hay listas guardadas.</p>
        ) : (
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
            {datos.listas.map((l) => (
              <div key={l.viaje} className="px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap text-[12.5px]">
                <div>
                  <p className="font-bold text-navy m-0">{l.viaje}</p>
                  <p className="text-slate-500 text-[11.5px] m-0">
                    {l.total} contactos · {l.activos} activos{l.bajas ? ` · ${l.bajas} de baja` : ''}
                  </p>
                </div>
                <a
                  href={`/api/admin/contactos/exportar?viaje=${encodeURIComponent(l.viaje)}`}
                  className="inline-block bg-navy hover:bg-navy-light text-white text-[11.5px] font-bold px-3 py-1.5 rounded transition-colors"
                >
                  Descargar Excel
                </a>
              </div>
            ))}
          </div>
        )}
        {datos && datos.listas.length > 1 && (
          <p className="mt-3 text-[12px]">
            <a href="/api/admin/contactos/exportar" className="font-bold text-navy underline decoration-dotted">
              Descargar Excel con todas las listas juntas
            </a>
          </p>
        )}
      </Card>
    </AdminShell>
  );
}
