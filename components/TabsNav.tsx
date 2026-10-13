'use client';

export type Tab = 'buscar-autos' | 'ofrecer-auto' | 'bondi';

const TABS: { id: Tab; label: string }[] = [
  { id: 'buscar-autos', label: '🚗 Buscar Auto' },
  { id: 'ofrecer-auto', label: '➕ Ofrecer Auto' },
  { id: 'bondi', label: '🚌 Bondi Oficial' },
];

export default function TabsNav({ activa, onCambiar }: { activa: Tab; onCambiar: (t: Tab) => void }) {
  return (
    <div className="flex bg-white border-b border-slate-300">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onCambiar(t.id)}
          className={`flex-1 py-3.5 text-center text-[13px] font-bold uppercase border-b-[3px] transition-colors ${
            activa === t.id ? 'text-navy border-navy bg-slate-50' : 'text-slate-500 border-transparent'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
