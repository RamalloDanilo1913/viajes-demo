'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ContenidoResultado() {
  const params = useSearchParams();
  const estado = params.get('estado');

  // a esta pagina vuelve MP, el estado real lo confirma el webhook
  const config = {
    success: { icono: '✅', titulo: '¡Pago confirmado!', texto: 'Ya podés cerrar esta pestaña — tu reserva se actualiza sola.', color: 'text-emerald-700' },
    pending: { icono: '⏳', titulo: 'Pago en revisión', texto: 'Mercado Pago está procesando tu pago. Te va a llegar la confirmación en cuanto se acredite. Podés cerrar esta pestaña.', color: 'text-amber-700' },
    failure: { icono: '❌', titulo: 'El pago no se pudo completar', texto: 'Podés cerrar esta pestaña y volver a intentar desde la web.', color: 'text-red-700' },
  }[estado as 'success' | 'pending' | 'failure'] || { icono: 'ℹ️', titulo: 'Listo', texto: 'Podés cerrar esta pestaña.', color: 'text-slate-700' };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 max-w-sm text-center">
        <p className="text-4xl mb-3">{config.icono}</p>
        <h1 className={`font-black uppercase italic text-lg mb-2 ${config.color}`}>{config.titulo}</h1>
        <p className="text-slate-600 text-[13.5px]">{config.texto}</p>
      </div>
    </div>
  );
}

export default function PagoResultadoPage() {
  return (
    <Suspense fallback={null}>
      <ContenidoResultado />
    </Suspense>
  );
}
