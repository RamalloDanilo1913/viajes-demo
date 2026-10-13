'use client';

export default function ConfirmacionModal({
  visible,
  titulo,
  mensaje,
  onCerrar,
}: {
  visible: boolean;
  titulo: string;
  mensaje: string;
  onCerrar: () => void;
}) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 bg-black/55 z-[10000] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[380px] rounded-xl overflow-hidden shadow-2xl text-center">
        <div className="bg-emerald-800 px-5 pt-6 pb-4 text-white">
          <div className="text-4xl mb-2">✅</div>
          <h2 className="italic font-black uppercase text-lg m-0">{titulo}</h2>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-700 mb-4 leading-relaxed">{mensaje}</p>
          <button className="btn-primario !normal-case !not-italic" onClick={onCerrar}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
