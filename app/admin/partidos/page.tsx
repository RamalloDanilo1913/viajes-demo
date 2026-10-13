'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Card, BotonPeligro, TablaVacia, Mensaje, Cargando } from '@/components/admin/ui';

export default function PartidosPage() {
  const [lista, setLista] = useState<any[] | null>(null);
  const [nombre, setNombre] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ texto: string; ok: boolean } | null>(null);

  function cargar() {
    fetch('/api/admin/partidos')
      .then((r) => r.json())
      .then(setLista);
  }
  useEffect(cargar, []);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setEnviando(true);
    const res = await fetch('/api/admin/partidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    }).then((r) => r.json());
    setEnviando(false);
    setMsg({ texto: res.mensaje || res.error, ok: !!res.success });
    setTimeout(() => setMsg(null), 4000);
    if (res.success) setNombre('');
    cargar();
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este partido de la lista?')) return;
    const res = await fetch(`/api/admin/partidos?id=${id}`, { method: 'DELETE' }).then((r) => r.json());
    setMsg({ texto: res.mensaje || res.error, ok: !!res.success });
    setTimeout(() => setMsg(null), 4000);
    cargar();
  }

  return (
    <AdminShell titulo="⚽ Partidos">
      <Card title="Agregar partido">
        <p className="text-[12.5px] text-slate-500 -mt-3 mb-4">
          Estos son los partidos que aparecen en el selector de "Ofrecer Auto". Eliminá los que ya pasaron para mantener la lista limpia.
        </p>
        {msg && <Mensaje texto={msg.texto} ok={msg.ok} />}
        <form onSubmit={agregar} className="flex gap-2">
          <input className="campo-input" placeholder="Ej: Talleres vs Belgrano" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <button className="btn-primario !normal-case !not-italic !w-auto px-5 whitespace-nowrap" disabled={enviando}>
            {enviando ? 'Agregando...' : '+ Agregar'}
          </button>
        </form>
      </Card>

      <Card title="Partidos cargados">
        {lista === null ? (
          <Cargando />
        ) : (
          <div className="space-y-2">
            {lista.length === 0 && <p className="text-center text-slate-400 text-sm py-6">No hay partidos cargados.</p>}
            {lista.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
                <span className="text-[13.5px] font-semibold text-slate-700">{p.nombre}</span>
                <BotonPeligro onClick={() => eliminar(p.id)}>Eliminar</BotonPeligro>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AdminShell>
  );
}
