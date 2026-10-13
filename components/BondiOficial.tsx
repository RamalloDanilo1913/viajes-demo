'use client';

import { useEffect, useState } from 'react';
import type { Configuracion, DatosSocio, PasajeroBondi } from '@/lib/types';
import PagoModal from './PagoModal';
import ConfirmacionModal from './ConfirmacionModal';

interface InfoBondiUI {
  descripcion: string;
  destino: string;
  fechaSalida: string;
  horaSalida: string;
  lugarSalida: string;
  cupos: number | string;
  fechaRegreso: string;
  lugarRegreso: string;
  horaRegreso: string;
  comentario: string;
  precioAdulto: number | null;
  precioMenor: number | null;
  paradas: string[];
}

function pasajeroVacio(paradaPorDefecto = ''): PasajeroBondi {
  return {
    nombre: '', dni: '', esMenor: false, fechaNacimiento: '', parada: paradaPorDefecto,
    email: '', telefono: '', telEmergencia: '', localidad: '', esSocio: false, numSocio: '',
  };
}

function formatearFecha(iso: string): string {
  if (!iso) return '';
  const [anio, mes, dia] = iso.split('-');
  if (!anio || !mes || !dia) return iso;
  return `${dia}/${mes}/${anio}`;
}

export default function BondiOficial({ datosSocio, config }: { datosSocio: DatosSocio | null; config: Configuracion | null }) {
  const [info, setInfo] = useState<InfoBondiUI | null | undefined>(undefined);
  const [infoError, setInfoError] = useState(false);
  const [pasajeros, setPasajeros] = useState<PasajeroBondi[]>([pasajeroVacio()]);
  const [expandido, setExpandido] = useState<number | null>(0);
  const [ultimaParada, setUltimaParada] = useState('');
  const [filial, setFilial] = useState<'Capital Federal' | 'Buenos Aires'>('Capital Federal');

  const [error, setError] = useState('');
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [confirmacion, setConfirmacion] = useState<{ titulo: string; mensaje: string } | null>(null);

  function cargarInfo() {
    fetch('/api/info-bondi', { cache: 'no-store' })
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok || (data && typeof data === 'object' && 'error' in data)) {
          throw new Error('Respuesta inesperada del servidor');
        }
        return data;
      })
      .then((data) => {
        setInfo(data);
        setInfoError(false);
      })
      .catch(() => {
        setInfo(null);
        setInfoError(true);
      });
  }
  // la info del viaje se carga una sola vez al entrar
  useEffect(cargarInfo, []);

  useEffect(() => {
    // si viene del portal de socios completo solo el primer pasajero
    if (!datosSocio) return;
    const nombreCompleto = `${datosSocio.nombres || ''} ${datosSocio.apellidos || ''}`.trim();
    setPasajeros((prev) => {
      const copia = [...prev];
      copia[0] = {
        ...copia[0],
        nombre: nombreCompleto,
        dni: datosSocio.dni || '',
        fechaNacimiento: datosSocio.fecha_nacimiento || '',
        telefono: datosSocio.telefono || '',
        email: datosSocio.email || '',
        esSocio: true,
        numSocio: datosSocio.numero_socio || '',
      };
      return copia;
    });
  }, [datosSocio]);

  const cantAdultos = pasajeros.filter((p) => !p.esMenor).length;
  const cantMenores = pasajeros.filter((p) => p.esMenor).length;
  const montoTotal = cantAdultos * (info?.precioAdulto || 0) + cantMenores * (info?.precioMenor || 0);

  function actualizarPasajero(i: number, campo: keyof PasajeroBondi, valor: string | boolean) {
    setPasajeros((prev) => prev.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p)));
    if (campo === 'parada' && typeof valor === 'string') setUltimaParada(valor);
  }
  function agregarPasajero() {
    setPasajeros((prev) => [...prev, pasajeroVacio(ultimaParada)]);
    setExpandido(pasajeros.length);
  }
  function quitarPasajero(i: number) {
    if (pasajeros.length <= 1) return;
    setPasajeros((prev) => prev.filter((_, idx) => idx !== i));
    setExpandido(null);
  }
  function toggleExpandido(i: number) {
    setExpandido((prev) => (prev === i ? null : i));
  }

  const requiereParada = (info?.paradas?.length || 0) > 0;

  function validarYAbrirModal(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (pasajeros.every((p) => p.esMenor)) return setError('Error: Tiene que viajar al menos un mayor de edad en la reserva.');

    for (let i = 0; i < pasajeros.length; i++) {
      const p = pasajeros[i];
      const num = i + 1;
      if (!p.nombre.trim()) { setExpandido(i); return setError(`Error: Falta el nombre del Pasajero ${num}.`); }
      if (!/^\d{7,8}$/.test(p.dni)) { setExpandido(i); return setError(`Error: El DNI del Pasajero ${num} debe tener 7 u 8 números.`); }
      if (!p.fechaNacimiento) { setExpandido(i); return setError(`Error: Falta la fecha de nacimiento del Pasajero ${num}.`); }
      if (requiereParada && !p.parada) { setExpandido(i); return setError(`Error: Elegí una parada de subida para el Pasajero ${num}.`); }
      if (p.esSocio && !p.numSocio.trim()) { setExpandido(i); return setError(`Error: Falta el número de socio del Pasajero ${num}.`); }
      if (!p.esMenor) {
        if (!/^\d{10,15}$/.test(p.telefono)) { setExpandido(i); return setError(`Error: El teléfono del Pasajero ${num} debe tener entre 10 y 15 números.`); }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) { setExpandido(i); return setError(`Error: El email del Pasajero ${num} no es válido.`); }
        if (!p.localidad.trim()) { setExpandido(i); return setError(`Error: Falta la localidad del Pasajero ${num}.`); }
        if (p.telEmergencia && !/^\d{10,15}$/.test(p.telEmergencia)) { setExpandido(i); return setError(`Error: El teléfono de emergencia del Pasajero ${num} debe tener entre 10 y 15 números.`); }
      }
    }
    setModalPagoAbierto(true);
  }

  async function confirmarTransferencia(file: File | null) {
    const body: any = { filial, pasajeros, metodoPago: 'transferencia' };

    if (file) {
      const base64 = await fileToBase64(file);
      body.fileData = base64;
      body.fileName = file.name;
      body.fileMime = file.type || 'application/octet-stream';
    }

    const res = await fetch('/api/reservas-bondi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.json());

    if (res.success) {
      setModalPagoAbierto(false);
      setConfirmacion({ titulo: res.titulo, mensaje: res.str });
      resetearFormulario();
      cargarInfo();
      return { ok: true };
    }
    return { ok: false, error: res.str };
  }

  async function iniciarReservaMercadoPago(): Promise<{ ok: boolean; reservaId?: string; error?: string }> {
    const res = await fetch('/api/reservas-bondi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filial, pasajeros, metodoPago: 'mercadopago' }),
    }).then((r) => r.json());

    if (res.success && res.reservaId) return { ok: true, reservaId: res.reservaId };
    return { ok: false, error: res.str };
  }

  function pagoMercadoPagoConfirmado() {
    setModalPagoAbierto(false);
    setConfirmacion({ titulo: '¡Pago confirmado!', mensaje: 'Tu pasaje quedó reservado y pagado con Mercado Pago. ✅' });
    resetearFormulario();
    cargarInfo();
  }

  function resetearFormulario() {
    setPasajeros([pasajeroVacio()]);
    setUltimaParada('');
    setExpandido(0);
  }

  if (info === undefined) return <div className="card">Cargando datos...</div>;

  return (
    <>
      <div className="card">
        {infoError ? (
          <>
            <h2 className="card-titulo">Estado del Colectivo / Cupos</h2>
            <p className="text-slate-600 text-[13.5px] mb-3">No pudimos cargar la información del viaje. Puede haber sido un corte momentáneo.</p>
            <button onClick={cargarInfo} className="btn-secundario !w-auto px-5">Reintentar</button>
          </>
        ) : !info ? (
          <>
            <h2 className="card-titulo">Estado del Colectivo / Cupos</h2>
            <p className="font-bold">No hay colectivos oficiales programados para los próximos partidos.</p>
          </>
        ) : (
          <div>
            <p className="text-[11px] font-bold text-navy/60 uppercase tracking-wide mb-1">Bondi Oficial</p>
            <h2 className="text-navy italic font-black text-xl mb-1 leading-tight">{info.destino}</h2>
            {info.descripcion && <p className="text-slate-600 text-[13.5px] mb-4">{info.descripcion}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                <p className="text-[10.5px] font-bold text-slate-500 uppercase mb-1">🚌 Salida</p>
                <p className="text-[14px] font-bold text-navy mb-0.5">
                  {formatearFecha(info.fechaSalida)} {info.horaSalida && `— ${info.horaSalida} hs`}
                </p>
                <p className="text-[12.5px] text-slate-600">{info.lugarSalida}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                <p className="text-[10.5px] font-bold text-slate-500 uppercase mb-1">🏁 Regreso</p>
                <p className="text-[14px] font-bold text-navy mb-0.5">
                  {formatearFecha(info.fechaRegreso)} {info.horaRegreso && `— ${info.horaRegreso} hs`}
                </p>
                <p className="text-[12.5px] text-slate-600">{info.lugarRegreso}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {info.precioAdulto != null && (
                <div className="bg-navy/5 rounded-lg p-3 text-center">
                  <p className="text-[10.5px] font-bold text-slate-500 uppercase">Adulto</p>
                  <p className="text-navy font-black text-lg">${info.precioAdulto}</p>
                </div>
              )}
              {info.precioMenor != null && (
                <div className="bg-navy/5 rounded-lg p-3 text-center">
                  <p className="text-[10.5px] font-bold text-slate-500 uppercase">Menor de 12</p>
                  <p className="text-navy font-black text-lg">${info.precioMenor}</p>
                </div>
              )}
            </div>

            {info.paradas.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 mb-4">
                <p className="text-[11px] font-bold text-amber-800 uppercase mb-1.5">🚏 Paradas en el camino</p>
                <ul className="list-disc ml-4 text-[13px] text-amber-900 space-y-0.5">
                  {info.paradas.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className={`badge text-white ${Number(info.cupos) > 0 ? 'bg-navy' : 'bg-bordeaux'}`}>Cupos disponibles: {info.cupos}</span>
            </div>
            {info.comentario && (
              <p className="italic text-slate-600 text-[13px] mt-3.5 pt-3.5 border-t border-slate-100">⚠️ {info.comentario}</p>
            )}
            {Number(info.cupos) <= 0 && <p className="text-bordeaux font-bold pt-3 text-[13.5px]">Las reservas online para este colectivo están cerradas.</p>}
          </div>
        )}
      </div>

      {info && Number(info.cupos) > 0 && (
        <>
          {!datosSocio && (
            <div className="card bg-amber-50 border-amber-200 text-center">
              <p className="text-amber-800 font-bold text-[13.5px] mb-3">
                ¿Sos socio de la Filial Capital Federal? Acceso rápido: iniciá sesión y te completamos tus datos.
              </p>
              <a
                href={`${process.env.NEXT_PUBLIC_LOGIN_SOCIOS_URL}?volver=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tab=bondi` : '')}`}
                className="btn-primario inline-block !normal-case !not-italic"
              >
                Ingresar como socio (Filial Capital Federal)
              </a>
            </div>
          )}
          {datosSocio && (
            <div className="card bg-emerald-50 border-emerald-200 text-center">
              <p className="text-emerald-800 font-bold text-[13.5px] m-0">✅ Ingresaste como socio. Ya completamos los datos del Pasajero 1.</p>
            </div>
          )}

          <div className="card">
            <h2 className="card-titulo">Reservar pasaje</h2>
            <form onSubmit={validarYAbrirModal} className="space-y-4">
              {config?.mostrarFilialBA && (
                <div>
                  <label className="campo-label">Filial</label>
                  <select className="campo-input" value={filial} onChange={(e) => setFilial(e.target.value as any)}>
                    <option value="Capital Federal">Capital Federal</option>
                    <option value="Buenos Aires">Buenos Aires</option>
                  </select>
                </div>
              )}

              <div className="space-y-2.5">
                {pasajeros.map((p, i) => (
                  <TarjetaPasajero
                    key={i}
                    numero={i + 1}
                    pasajero={p}
                    paradas={info.paradas}
                    expandido={expandido === i}
                    onToggle={() => toggleExpandido(i)}
                    onCambiar={(campo, valor) => actualizarPasajero(i, campo, valor)}
                    onQuitar={pasajeros.length > 1 ? () => quitarPasajero(i) : undefined}
                  />
                ))}
              </div>
              <button type="button" className="btn-secundario" onClick={agregarPasajero}>
                + Agregar pasajero
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg py-3 px-4 text-center">
                <p className="m-0.5 text-sm">
                  {cantAdultos} adulto{cantAdultos !== 1 ? 's' : ''}
                  {cantMenores > 0 ? ` + ${cantMenores} menor${cantMenores !== 1 ? 'es' : ''}` : ''}
                </p>
                <p className="text-navy font-black text-2xl m-0.5">${montoTotal.toLocaleString('es-AR')}</p>
              </div>

              <button className="btn-primario">Confirmar Reserva</button>
              {error && <p className="text-center p-3 rounded-md text-[13.5px] font-bold bg-red-100 text-red-800">{error}</p>}
            </form>
          </div>
        </>
      )}

      <PagoModal
        visible={modalPagoAbierto}
        monto={montoTotal}
        config={config}
        filial={filial}
        onFilialChange={setFilial}
        mostrarSelectorFilial={!!config?.mostrarFilialBA}
        onConfirmarTransferencia={confirmarTransferencia}
        onIniciarMercadoPago={iniciarReservaMercadoPago}
        onPagoConfirmado={pagoMercadoPagoConfirmado}
        onCerrar={() => setModalPagoAbierto(false)}
      />
      <ConfirmacionModal
        visible={!!confirmacion}
        titulo={confirmacion?.titulo || ''}
        mensaje={confirmacion?.mensaje || ''}
        onCerrar={() => setConfirmacion(null)}
      />
    </>
  );
}

function TarjetaPasajero({
  numero,
  pasajero,
  paradas,
  expandido,
  onToggle,
  onCambiar,
  onQuitar,
}: {
  numero: number;
  pasajero: PasajeroBondi;
  paradas: string[];
  expandido: boolean;
  onToggle: () => void;
  onCambiar: (campo: keyof PasajeroBondi, valor: string | boolean) => void;
  onQuitar?: () => void;
}) {
  const resumenNombre = pasajero.nombre.trim();

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between px-3.5 py-3 text-left">
        <span className="text-[13.5px] font-bold text-navy">
          Pasajero {numero}
          {!expandido && resumenNombre && <span className="font-normal text-slate-500"> — {resumenNombre}</span>}
          {!expandido && pasajero.esMenor && <span className="badge bg-amber-100 text-amber-800 ml-2">Menor</span>}
        </span>
        <span className="text-slate-400 text-xs">{expandido ? '▲ Contraer' : '▼ Expandir'}</span>
      </button>

      {expandido && (
        <div className="px-3.5 pb-3.5 space-y-3 border-t border-slate-200 pt-3.5">
          <label className="flex items-center gap-2 text-[13.5px] bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            <input type="checkbox" checked={pasajero.esMenor} onChange={(e) => onCambiar('esMenor', e.target.checked)} />
            El pasajero es menor de 12 años
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="campo-label">Nombre y Apellido</label>
              <input className="campo-input" value={pasajero.nombre} onChange={(e) => onCambiar('nombre', e.target.value)} required />
            </div>
            <div>
              <label className="campo-label">DNI</label>
              <input className="campo-input" inputMode="numeric" maxLength={8} value={pasajero.dni} onChange={(e) => onCambiar('dni', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="campo-label">Fecha de nacimiento</label>
              <input className="campo-input" type="date" value={pasajero.fechaNacimiento} onChange={(e) => onCambiar('fechaNacimiento', e.target.value)} required />
            </div>
            <div>
              <label className="campo-label">¿Es socio?</label>
              <select className="campo-input" value={pasajero.esSocio ? 'Si' : 'No'} onChange={(e) => onCambiar('esSocio', e.target.value === 'Si')}>
                <option value="No">No</option>
                <option value="Si">Sí</option>
              </select>
            </div>
          </div>

          {pasajero.esSocio && (
            <div>
              <label className="campo-label">Número de Socio</label>
              <input className="campo-input" value={pasajero.numSocio} onChange={(e) => onCambiar('numSocio', e.target.value)} required />
            </div>
          )}

          {paradas.length > 0 && (
            <div>
              <label className="campo-label">Parada de subida</label>
              <select className="campo-input" value={pasajero.parada} onChange={(e) => onCambiar('parada', e.target.value)} required>
                <option value="">Elegir parada...</option>
                {paradas.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}

          {!pasajero.esMenor && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="campo-label">Email</label>
                  <input className="campo-input" type="email" value={pasajero.email} onChange={(e) => onCambiar('email', e.target.value)} required />
                </div>
                <div>
                  <label className="campo-label">Localidad donde vivís</label>
                  <input className="campo-input" value={pasajero.localidad} onChange={(e) => onCambiar('localidad', e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="campo-label">Teléfono</label>
                  <input className="campo-input" inputMode="numeric" maxLength={15} value={pasajero.telefono} onChange={(e) => onCambiar('telefono', e.target.value)} required />
                </div>
                <div>
                  <label className="campo-label">Tel. Emergencia (opcional)</label>
                  <input className="campo-input" inputMode="numeric" maxLength={15} value={pasajero.telEmergencia} onChange={(e) => onCambiar('telEmergencia', e.target.value)} />
                </div>
              </div>
            </>
          )}

          {onQuitar && (
            <button type="button" onClick={onQuitar} className="text-bordeaux text-xs font-bold hover:underline">
              ✕ Quitar pasajero
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const resultado = reader.result as string;
      resolve(resultado.substring(resultado.indexOf(',') + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
