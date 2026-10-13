'use client';

export function StatCard({ valor, etiqueta }: { valor: string | number; etiqueta: string }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
      <div className="text-[28px] font-black text-navy leading-none">{valor}</div>
      <div className="text-[11.5px] font-bold text-slate-500 uppercase tracking-wide mt-2">{etiqueta}</div>
    </div>
  );
}

export function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-4 md:p-6 border border-slate-200 shadow-sm mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5 pb-3 border-b border-slate-100">
        <h2 className="text-navy italic font-bold uppercase text-[15px] m-0">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Badge({ children, color = 'slate' }: { children: React.ReactNode; color?: 'slate' | 'amber' | 'emerald' | 'red' }) {
  const estilos: Record<string, string> = {
    slate: 'bg-slate-200 text-slate-700',
    amber: 'bg-amber-100 text-amber-800',
    emerald: 'bg-emerald-100 text-emerald-800',
    red: 'bg-red-100 text-red-800',
  };
  return <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold ${estilos[color]}`}>{children}</span>;
}

export function BotonPeligro({ children, onClick, className = '' }: { children: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`bg-red-700 hover:bg-red-800 text-white text-[11.5px] font-bold px-3 py-1.5 rounded transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

export function BotonChico({ children, onClick, color = 'navy' }: { children: React.ReactNode; onClick: () => void; color?: 'navy' | 'amber' }) {
  const estilos = color === 'amber' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-navy hover:bg-navy-light';
  return (
    <button onClick={onClick} className={`${estilos} text-white text-[11.5px] font-bold px-3 py-1.5 rounded transition-colors`}>
      {children}
    </button>
  );
}

export function TablaVacia({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center text-slate-400 text-sm py-8">
        {children}
      </td>
    </tr>
  );
}

export function Mensaje({ texto, ok }: { texto: string; ok: boolean }) {
  return (
    <p className={`text-center p-3 rounded-md text-[13px] font-bold mb-4 ${ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
      {texto}
    </p>
  );
}

export function Cargando() {
  return <p className="text-center text-slate-400 text-sm py-10">Cargando...</p>;
}
