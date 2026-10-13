'use client';

import { useEffect, useState } from 'react';
import type { DatosSocio } from '@/lib/types';

interface Viaje {
  id: string;
  nombre: string;
  partido: string;
  fechaSalida: string;
  fechaRegreso: string;
  precio: string;
  lugarSalida: string;
  notas: string;
  cupos: number;
  promedioConductor: number | null;
  cantConductor: number;
}

export default function BuscarAutos({ datosSocio }: { datosSocio: DatosSocio | null }) {
  const [viajes, setViajes] = useState<Viaje[] | null>(null);
  const [panelAbierto, setPanelAbierto] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/viajes-autos', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setViajes(Array.isArray(data) ? data : []))
      .catch(() => setViajes([]));
  }, []);

  if (viajes === null) return <div className="card">Buscando viajes activos...</div>;
  if (viajes.length === 0) return <div className="card">No hay autos publicados con lugares disponibles.</div>;

  return (
    <div className="card">
      <h2 className="card-titulo">Autos con lugares disponibles</h2>
      <div className="space-y-4">
        {viajes.map((v) => (
          <ItemAuto key={v.id} viaje={v} abierto={panelAbierto === v.id} onAbrir={() => setPanelAbierto(v.id)} datosSocio={datosSocio} />
        ))}
      </div>
    </div>
  );
}

function ItemAuto({
  viaje,
  abierto,
  onAbrir,
  datosSocio,
}: {
  viaje: Viaje;
  abierto: boolean;
  onAbrir: () => void;
  datosSocio: DatosSocio | null;
}) {
  const [nombre, setNombre] = useState(datosSocio?.nombres || '');
  const [apellido, setApellido] = useState(datosSocio?.apellidos || '');
  const [dni, setDni] = useState(datosSocio?.dni || '');
  const [email, setEmail] = useState(datosSocio?.email || '');
  const [telefono, setTelefono] = useState(datosSocio?.telefono || '');
  const [telEmergencia, setTelEmergencia] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<{ str: string; aviso?: boolean; soporteUrl?: string } | null>(null);

  async function enviar() {
    setError('');
    if (!nombre || !apellido || !dni || !email || !telefono) return setError('Por favor, completa los campos obligatorios.');
    if (!/^\d{7,8}$/.test(dni)) return setError('Error: El DNI debe tener exactamente 7 u 8 dígitos.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Error: El email ingresado no es válido.');
    if (!/^\d{10,15}$/.test(telefono)) return setError('Error: El teléfono debe tener entre 10 y 15 dígitos.');
    if (telEmergencia && !/^\d{10,15}$/.test(telEmergencia)) return setError('Error: El teléfono de emergencia debe tener entre 10 y 15 dígitos.');

    setEnviando(true);
    const res = await fetch('/api/reservas-autos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idViaje: viaje.id, nombre, apellido, dni, email, telefono, telEmergencia: telEmergencia || '-' }),
    }).then((r) => r.json());
    setEnviando(false);

    if (res.success) setResultado(res);
    else setError(res.str);
  }

  return (
    <div className="border-l-4 border-navy bg-slate-50 rounded p-4">
      <h3 className="text-navy italic font-black text-[15px] m-0 mb-2">{viaje.partido}</h3>
      <p className="text-[13.5px] text-slate-700 my-1">
        <strong>Anfitrión:</strong> {viaje.nombre}
        {viaje.promedioConductor !== null && (
          <span className="badge bg-amber-100 text-amber-800 ml-1.5">
            ⭐ {viaje.promedioConductor} ({viaje.cantConductor})
          </span>
        )}
      </p>
      <p className="text-[13.5px] text-slate-700 my-1">
        <strong>Salida:</strong> {viaje.fechaSalida} desde {viaje.lugarSalida}
      </p>
      <p className="text-[13.5px] text-slate-700 my-1">
        <strong>Regreso:</strong> {viaje.fechaRegreso}
      </p>
      <p className="text-[13.5px] text-slate-700 my-1">
        <strong>Costo:</strong> {viaje.precio}
      </p>
      <p>
        <span className="badge bg-navy text-white">Lugares Libres: {viaje.cupos}</span>
      </p>
      {viaje.notas && viaje.notas !== '-' && (
        <p className="text-[13.5px] text-slate-700 my-1">
          <strong>Notas:</strong> {viaje.notas}
        </p>
      )}

      {resultado ? (
        <div className={`mt-3 p-4 rounded-lg text-sm ${resultado.aviso ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'}`}>
          <p className="m-0">{resultado.str}</p>
          {resultado.aviso && resultado.soporteUrl && (
            <a href={resultado.soporteUrl} target="_blank" className="btn-primario !bg-emerald-700 !normal-case !not-italic mt-2.5 inline-block">
              Contactar a soporte
            </a>
          )}
        </div>
      ) : !abierto ? (
        <button className="btn-primario mt-2.5" onClick={onAbrir}>
          Reservar Lugar
        </button>
      ) : (
        <div className="bg-slate-100 p-3.5 rounded-lg mt-3 border border-dashed border-slate-300 space-y-2.5">
          <h4 className="text-[13px] uppercase italic font-bold m-0">Datos del Pasajero</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="campo-label">Nombre</label>
              <input className="campo-input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <label className="campo-label">Apellido</label>
              <input className="campo-input" value={apellido} onChange={(e) => setApellido(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="campo-label">DNI (7 u 8 números)</label>
            <input className="campo-input" inputMode="numeric" maxLength={8} value={dni} onChange={(e) => setDni(e.target.value)} />
          </div>
          <div>
            <label className="campo-label">Email (te avisamos ahí si el conductor te acepta)</label>
            <input className="campo-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="campo-label">Teléfono</label>
              <input className="campo-input" inputMode="numeric" maxLength={15} value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <div>
              <label className="campo-label">Tel. Emergencia (opcional)</label>
              <input className="campo-input" inputMode="numeric" maxLength={15} value={telEmergencia} onChange={(e) => setTelEmergencia(e.target.value)} />
            </div>
          </div>
          <button className="btn-primario !bg-slate-800" disabled={enviando} onClick={enviar}>
            {enviando ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
          {error && <p className="text-red-800 text-xs font-bold text-center m-0">{error}</p>}
        </div>
      )}
    </div>
  );
}
