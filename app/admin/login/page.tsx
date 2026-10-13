'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginAdmin() {
  const router = useRouter();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password }),
    }).then((r) => r.json());
    setCargando(false);

    if (res.success) router.replace('/admin');
    else setError(res.error || 'No se pudo iniciar sesión.');
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-[380px] rounded-xl p-8 shadow-lg border border-slate-200">
        <p className="text-center text-[10.5px] uppercase tracking-widest text-slate-400 font-bold mb-1">Viajes Filial Capital Federal</p>
        <h1 className="text-navy italic font-black uppercase text-xl text-center mb-6">Panel Admin</h1>
        <form onSubmit={enviar} className="space-y-4">
          <div>
            <label className="campo-label">Usuario</label>
            <input className="campo-input" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoFocus required />
          </div>
          <div>
            <label className="campo-label">Contraseña</label>
            <input className="campo-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn-primario !normal-case !not-italic" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
          {error && <p className="text-red-800 text-[13px] font-bold text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
}
