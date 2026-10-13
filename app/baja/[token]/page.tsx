'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function BajaPage() {
  const { token } = useParams<{ token: string }>();
  const [estado, setEstado] = useState<'inicial' | 'enviando' | 'listo' | 'error'>('inicial');
  const [mensaje, setMensaje] = useState('');

  async function darseDeBaja() {
    setEstado('enviando');
    try {
      const res = await fetch(`/api/baja/${token}`, { method: 'POST' }).then((r) => r.json());
      if (res.success) setEstado('listo');
      else {
        setMensaje(res.error || 'No pudimos procesar la baja.');
        setEstado('error');
      }
    } catch {
      setMensaje('No pudimos procesar la baja. Probá de nuevo.');
      setEstado('error');
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 max-w-sm w-full text-center">
        {estado === 'listo' ? (
          <>
            <p className="text-4xl mb-3">✅</p>
            <h1 className="text-navy font-black uppercase italic text-lg mb-2">Listo, te dimos de baja</h1>
            <p className="text-slate-600 text-[13.5px]">No vas a recibir más avisos de la filial por mail.</p>
          </>
        ) : (
          <>
            <h1 className="text-navy font-black uppercase italic text-lg mb-2">¿No querés recibir más avisos?</h1>
            <p className="text-slate-600 text-[13.5px] mb-5">Dejaríamos de escribirte cuando salgan nuevos viajes de la Filial Capital Federal.</p>
            {estado === 'error' && <p className="bg-red-100 text-red-800 text-[13px] font-bold rounded-md p-2.5 mb-3">{mensaje}</p>}
            <button type="button" className="btn-primario" onClick={darseDeBaja} disabled={estado === 'enviando'}>
              {estado === 'enviando' ? 'Procesando...' : 'Darme de baja'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
