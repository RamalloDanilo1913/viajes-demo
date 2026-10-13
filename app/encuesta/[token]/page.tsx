'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function EncuestaPage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<{ nombre: string; viaje: string; yaRespondido: boolean; prueba?: boolean } | null>(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [estrellas, setEstrellas] = useState(0);
  const [hover, setHover] = useState(0);
  const [queTePareci, setQueTePareci] = useState('');
  const [aMejorar, setAMejorar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);

  useEffect(() => {
    fetch(`/api/encuesta/${token}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'No encontramos esta encuesta.');
        setInfo(d);
      })
      .catch((e) => setErrorCarga(e.message));
  }, [token]);

  async function enviar() {
    setError('');
    if (estrellas === 0) return setError('Elegí cuántas estrellas le das al viaje.');
    setEnviando(true);
    try {
      const res = await fetch(`/api/encuesta/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calificacion: estrellas, queTePareci, aMejorar }),
      }).then((r) => r.json());
      if (res.success) setListo(true);
      else setError(res.error || 'No se pudo enviar.');
    } catch {
      setError('No se pudo enviar. Revisá tu conexión y probá de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  const textos = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
  const activas = hover || estrellas;

  return (
    <div className="min-h-screen bg-slate-100 flex items-start sm:items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8 w-full max-w-md">
        <p className="text-[10.5px] uppercase tracking-widest text-slate-400 font-bold mb-1">Talleres Filial Capital Federal</p>

        {errorCarga ? (
          <p className="text-slate-600 text-[14px] py-6">{errorCarga}</p>
        ) : !info ? (
          <p className="text-slate-400 text-sm py-10 text-center">Cargando...</p>
        ) : info.yaRespondido || listo ? (
          <div className="text-center py-6">
            <p className="text-4xl mb-3">💙</p>
            <h1 className="text-navy font-black uppercase italic text-lg mb-2">¡Gracias por tu opinión!</h1>
            <p className="text-slate-600 text-[13.5px]">Lo que nos contás nos sirve para que el próximo viaje sea mejor. Ya podés cerrar esta pestaña.</p>
          </div>
        ) : (
          <>
            <h1 className="text-navy font-black uppercase italic text-lg leading-tight mb-1">¿Cómo estuvo tu viaje?</h1>
            <p className="text-slate-600 text-[13.5px] mb-5">
              {info.nombre ? `${info.nombre}, ` : ''}contanos cómo te fue en <strong>{info.viaje}</strong>.
              {info.prueba && <span className="block text-amber-700 text-[12px] mt-1">Esto es una prueba: no se guarda nada.</span>}
            </p>

            <p className="text-[12px] font-bold text-slate-600 uppercase mb-1">Tu calificación</p>
            <div className="flex items-center gap-1 mb-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setEstrellas(n)}
                  onMouseEnter={() => setHover(n)}
                  aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
                  className={`text-[40px] leading-none px-0.5 transition-colors ${n <= activas ? 'text-amber-400' : 'text-slate-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="text-[12.5px] text-slate-500 h-5 mb-4">{textos[activas]}</p>

            <label className="block text-[12px] font-bold text-slate-600 uppercase mb-1">¿Qué te pareció el viaje? (opcional)</label>
            <textarea className="campo-input mb-4" rows={3} maxLength={1500} value={queTePareci} onChange={(e) => setQueTePareci(e.target.value)} />

            <label className="block text-[12px] font-bold text-slate-600 uppercase mb-1">¿Qué podemos mejorar? (opcional)</label>
            <textarea className="campo-input mb-4" rows={3} maxLength={1500} value={aMejorar} onChange={(e) => setAMejorar(e.target.value)} />

            {error && <p className="bg-red-100 text-red-800 text-[13px] font-bold rounded-md p-2.5 mb-3 text-center">{error}</p>}

            <button type="button" className="btn-primario" onClick={enviar} disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar mi opinión'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
