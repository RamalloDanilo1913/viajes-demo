'use client';

import { useEffect, useRef, useState } from 'react';
import type { Configuracion } from '@/lib/types';
import { RECARGO_MERCADOPAGO_PCT } from '@/lib/constants';

export default function PagoModal({
  visible,
  monto,
  config,
  filial,
  onFilialChange,
  mostrarSelectorFilial,
  onConfirmarTransferencia,
  onIniciarMercadoPago,
  onPagoConfirmado,
  onCerrar,
}: {
  visible: boolean;
  monto: number;
  config: Configuracion | null;
  filial: 'Capital Federal' | 'Buenos Aires';
  onFilialChange: (f: 'Capital Federal' | 'Buenos Aires') => void;
  mostrarSelectorFilial: boolean;
  onConfirmarTransferencia: (file: File | null) => Promise<{ ok: boolean; error?: string }>;
  onIniciarMercadoPago: () => Promise<{ ok: boolean; reservaId?: string; error?: string }>;
  onPagoConfirmado: () => void;
  onCerrar: () => void;
}) {
  const [metodo, setMetodo] = useState<'transferencia' | 'mercadopago'>('transferencia');
  const [file, setFile] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [esperandoPagoMP, setEsperandoPagoMP] = useState(false);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) detenerPolling();
    return detenerPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function detenerPolling() {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
  }

  if (!visible) return null;

  const mpHabilitado = config?.mercadopagoHabilitado !== false;
  const metodoEfectivo = mpHabilitado ? metodo : 'transferencia';
  const montoConRecargo = Math.round(monto * (1 + RECARGO_MERCADOPAGO_PCT / 100));
  const montoAMostrar = metodoEfectivo === 'mercadopago' ? montoConRecargo : monto;

  const esBA = filial === 'Buenos Aires';
  const alias = esBA ? config?.aliasBA : config?.alias;
  const cbu = esBA ? config?.cbuBA : config?.cbu;
  const titular = esBA ? config?.titularBA : config?.titular;

  async function confirmarTransferencia() {
    setEnviando(true);
    setError('');
    const res = await onConfirmarTransferencia(file);
    setEnviando(false);
    if (!res.ok) setError(res.error || 'Error inesperado. Intentá de nuevo.');
  }

  async function pagarConMercadoPago() {
    setEnviando(true);
    setError('');

    const resReserva = await onIniciarMercadoPago();
    if (!resReserva.ok || !resReserva.reservaId) {
      setEnviando(false);
      setError(resReserva.error || 'No pudimos iniciar la reserva. Intentá de nuevo.');
      return;
    }

    const resPreferencia = await fetch('/api/mercadopago/crear-preferencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservaId: resReserva.reservaId }),
    }).then((r) => r.json());

    if (!resPreferencia.initPoint) {
      setEnviando(false);
      setError(resPreferencia.error || 'No pudimos iniciar el pago con Mercado Pago.');
      return;
    }

    // se abre en pestaña nueva y esta queda esperando el pago
    window.open(resPreferencia.initPoint, '_blank');

    setEnviando(false);
    setEsperandoPagoMP(true);

    const reservaId = resReserva.reservaId;
    // pregunto el estado cada tanto hasta que llegue el webhook
    intervaloRef.current = setInterval(async () => {
      const estado = await fetch(`/api/reservas-bondi/estado?id=${reservaId}`, { cache: 'no-store' })
        .then((r) => r.json())
        .catch(() => null);

      if (estado?.estadoPago === 'pagado') {
        detenerPolling();
        setEsperandoPagoMP(false);
        onPagoConfirmado();
      } else if (estado?.estadoPago === 'rechazado') {
        detenerPolling();
        setEsperandoPagoMP(false);
        setError('El pago fue rechazado por Mercado Pago. Podés reintentar.');
      }
    }, 3000);
  }

  function copiarAlias() {
    if (!alias) return;

    function marcarCopiado() {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(alias).then(marcarCopiado).catch(() => copiarConFallback(alias, marcarCopiado));
    } else {
      copiarConFallback(alias, marcarCopiado);
    }
  }

  function copiarConFallback(texto: string, alHacerlo: () => void) {
    const el = document.createElement('textarea');
    el.value = texto;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    try {
      document.execCommand('copy');
      alHacerlo();
    } catch {
    }
    document.body.removeChild(el);
  }

  return (
    <div className="fixed inset-0 bg-black/55 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[400px] rounded-xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="bg-navy px-5 py-4 shrink-0">
          <h2 className="text-white uppercase italic font-black text-base m-0 tracking-wide">Pagá tu pasaje</h2>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          {mostrarSelectorFilial && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onFilialChange('Capital Federal')}
                className={`flex-1 text-xs py-2.5 rounded-md border-[1.5px] ${!esBA ? 'bg-navy text-white border-navy' : 'bg-slate-100 text-slate-700 border-slate-300'}`}
              >
                Capital Federal
              </button>
              <button
                type="button"
                onClick={() => onFilialChange('Buenos Aires')}
                className={`flex-1 text-xs py-2.5 rounded-md border-[1.5px] ${esBA ? 'bg-navy text-white border-navy' : 'bg-slate-100 text-slate-700 border-slate-300'}`}
              >
                Buenos Aires
              </button>
            </div>
          )}

          <div className="text-center">
            <p className="text-[11px] font-bold text-slate-500 uppercase mb-0.5">Monto a pagar</p>
            <p className="text-navy text-3xl font-black">${montoAMostrar.toLocaleString('es-AR')}</p>
            {metodoEfectivo === 'mercadopago' && (
              <p className="text-[11px] text-slate-400 mt-0.5">Incluye recargo de {RECARGO_MERCADOPAGO_PCT.toString().replace('.', ',')}% de Mercado Pago</p>
            )}
          </div>

          {mpHabilitado && (
            <div className="flex gap-2 border-b border-slate-200 pb-3.5">
              <button
                type="button"
                onClick={() => setMetodo('transferencia')}
                className={`flex-1 text-[12.5px] font-bold py-2.5 rounded-md border-[1.5px] ${metodoEfectivo === 'transferencia' ? 'bg-navy text-white border-navy' : 'bg-white text-slate-600 border-slate-300'}`}
              >
                🏦 Transferencia
              </button>
              <button
                type="button"
                onClick={() => setMetodo('mercadopago')}
                className={`flex-1 text-[12.5px] font-bold py-2.5 rounded-md border-[1.5px] ${metodoEfectivo === 'mercadopago' ? 'bg-navy text-white border-navy' : 'bg-white text-slate-600 border-slate-300'}`}
              >
                💳 Mercado Pago
              </button>
            </div>
          )}

          {metodoEfectivo === 'transferencia' ? (
            <>
              <div className="border-[1.5px] border-dashed border-slate-300 rounded-lg p-3.5">
                <p className="text-[11px] font-bold text-slate-500 uppercase mb-0.5">Alias</p>
                <p className="text-sm font-bold mb-2.5">{alias || '—'}</p>
                <button onClick={copiarAlias} className={`text-xs font-bold px-3.5 py-1.5 rounded text-white mb-2.5 ${copiado ? 'bg-emerald-700' : 'bg-navy'}`}>
                  {copiado ? '✓ Alias copiado' : 'Copiar alias'}
                </button>
                <p className="text-[11px] font-bold text-slate-500 uppercase mb-0.5">CBU/CVU</p>
                <p className="text-[12.5px] text-slate-700 mb-2.5 break-all">{cbu || '—'}</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase mb-0.5">Titular</p>
                <p className="text-[12.5px] text-slate-700 break-all">{titular || '—'}</p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase mb-2">Comprobante de transferencia</p>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <label className="bg-slate-600 text-white text-xs font-bold px-3.5 py-2.5 rounded cursor-pointer">
                    Elegir archivo
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </label>
                  <span className="text-xs text-slate-500 break-all">{file ? file.name : 'No se eligió ningún archivo'}</span>
                </div>
              </div>

              {error && <p className="text-red-800 text-[12.5px] font-bold text-center">{error}</p>}

              <div className="flex gap-2">
                <button className="btn-primario !normal-case !not-italic" disabled={enviando} onClick={confirmarTransferencia}>
                  {enviando ? 'Procesando...' : 'Finalizar compra'}
                </button>
                <button className="btn-primario !normal-case !not-italic !bg-slate-600" onClick={onCerrar} disabled={enviando}>
                  Volver
                </button>
              </div>
            </>
          ) : (
            <>
              {esperandoPagoMP ? (
                <div className="text-center py-3">
                  <div className="inline-block w-8 h-8 border-4 border-navy/20 border-t-navy rounded-full animate-spin mb-3" />
                  <p className="text-[13px] text-slate-600 mb-1">Esperando la confirmación de Mercado Pago...</p>
                  <p className="text-[11.5px] text-slate-400">Completá el pago en la pestaña que se abrió. Esto se actualiza solo, no cierres esta ventana.</p>
                </div>
              ) : (
                <>
                  <p className="text-[13px] text-slate-600 text-center">
                    Se abre una pestaña nueva de Mercado Pago para pagar con tarjeta, dinero en cuenta o Mercado Crédito.
                  </p>
                  {error && <p className="text-red-800 text-[12.5px] font-bold text-center">{error}</p>}
                  <div className="flex gap-2">
                    <button className="btn-primario !normal-case !not-italic" disabled={enviando} onClick={pagarConMercadoPago}>
                      {enviando ? 'Iniciando...' : 'Pagar con Mercado Pago'}
                    </button>
                    <button className="btn-primario !normal-case !not-italic !bg-slate-600" onClick={onCerrar} disabled={enviando}>
                      Volver
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
