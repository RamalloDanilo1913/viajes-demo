'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Error no controlado:', error);
  }, [error]);

  return (
    <div className="bg-slate-100 flex items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 max-w-sm text-center">
        <p className="text-4xl mb-3">⚠️</p>
        <h1 className="text-navy italic font-black uppercase text-lg mb-2">Algo falló</h1>
        <p className="text-slate-600 text-[13.5px] mb-5">
          Hubo un problema al cargar la página. Puede haber sido un corte momentáneo de conexión.
        </p>
        <button
          onClick={() => reset()}
          className="w-full bg-navy text-white font-bold uppercase text-[13.5px] py-3 rounded-md hover:bg-navy-light transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
