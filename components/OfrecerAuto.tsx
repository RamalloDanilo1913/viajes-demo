'use client';

import { useEffect, useState } from 'react';
import type { DatosSocio } from '@/lib/types';

export default function OfrecerAuto({ datosSocio }: { datosSocio: DatosSocio | null }) {
  const [partidos, setPartidos] = useState<string[]>([]);
  const [nombre, setNombre] = useState(datosSocio?.nombres || '');
  const [apellido, setApellido] = useState(datosSocio?.apellidos || '');
  const [dni, setDni] = useState(datosSocio?.dni || '');
  const [email, setEmail] = useState(datosSocio?.email || '');
  const [cupos, setCupos] = useState('');
  const [partido, setPartido] = useState('');
  const [salida, setSalida] = useState('');
  const [regreso, setRegreso] = useState('');
  const [seDividenGastos, setSeDividenGastos] = useState(false);
  const [precio, setPrecio] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [lugar, setLugar] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ texto: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/partidos', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setPartidos(Array.isArray(data) ? data : []))
      .catch(() => setPartidos([]));
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{10,15}$/.test(whatsapp)) return setMsg({ texto: 'Error: El WhatsApp del chofer debe tener entre 10 y 15 dígitos numéricos.', ok: false });
    if (!/^\d{7,8}$/.test(dni)) return setMsg({ texto: 'Error: El DNI debe tener 7 u 8 dígitos.', ok: false });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setMsg({ texto: 'Error: El email ingresado no es válido.', ok: false });

    setEnviando(true);
    const res = await fetch('/api/viajes-autos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        apellido,
        dni,
        email,
        cupos,
        partido,
        fechaSalida: salida,
        fechaRegreso: regreso || '',
        precio: seDividenGastos ? 'Se dividen gastos' : precio,
        whatsapp,
        lugarSalida: lugar,
        notas,
      }),
    }).then((r) => r.json());
    setEnviando(false);

    if (res.error) return setMsg({ texto: res.error, ok: false });
    setMsg({ texto: res.mensaje, ok: true });
    setNombre('');
    setApellido('');
    setDni('');
    setEmail('');
    setCupos('');
    setPartido('');
    setSalida('');
    setRegreso('');
    setPrecio('');
    setWhatsapp('');
    setLugar('');
    setNotas('');
  }

  return (
    <div className="card">
      <h2 className="card-titulo">Ofrecer lugar en mi Auto</h2>
      <form onSubmit={enviar} className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Nombre" value={nombre} onChange={setNombre} required />
          <Campo label="Apellido" value={apellido} onChange={setApellido} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Campo label="DNI (7 u 8 números)" value={dni} onChange={setDni} maxLength={8} inputMode="numeric" required />
          <Campo label="Lugares disponibles" value={cupos} onChange={setCupos} type="number" required />
        </div>
        <Campo label="Email (te avisamos ahí cuando alguien pida un lugar)" value={email} onChange={setEmail} type="email" required />
        <div>
          <label className="campo-label">Partido / Destino</label>
          <select className="campo-input" value={partido} onChange={(e) => setPartido(e.target.value)} required>
            <option value="">Seleccionar partido...</option>
            {partidos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Fecha y hora de salida" value={salida} onChange={setSalida} type="datetime-local" required />
          <Campo label="Fecha y hora de regreso (opcional)" value={regreso} onChange={setRegreso} type="datetime-local" />
        </div>
        <div className="grid grid-cols-2 gap-4 items-end">
          <div>
            <label className="campo-label">Precio ($)</label>
            <input className="campo-input" value={precio} disabled={seDividenGastos} onChange={(e) => setPrecio(e.target.value)} placeholder="Ej: 5000" />
            <label className="flex items-center gap-2 mt-1.5 text-[13.5px]">
              <input type="checkbox" checked={seDividenGastos} onChange={(e) => setSeDividenGastos(e.target.checked)} />
              Se dividen gastos
            </label>
          </div>
          <Campo label="WhatsApp (10 a 15 números, sin 15)" value={whatsapp} onChange={setWhatsapp} inputMode="numeric" maxLength={15} required />
        </div>
        <Campo label="Lugar de salida" value={lugar} onChange={setLugar} placeholder="Ej: YPF 9 de Julio 1234" required />
        <Campo label="Notas adicionales (opcional)" value={notas} onChange={setNotas} placeholder="Ej: No fumadores, baúl amplio" />
        <button className="btn-primario" disabled={enviando}>
          {enviando ? 'Publicando...' : 'Publicar Auto'}
        </button>
        {msg && (
          <p className={`text-center p-3 rounded-md text-[13.5px] font-bold ${msg.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{msg.texto}</p>
        )}
      </form>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = 'text',
  required,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  [k: string]: any;
}) {
  return (
    <div>
      <label className="campo-label">{label}</label>
      <input className="campo-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} {...rest} />
    </div>
  );
}
