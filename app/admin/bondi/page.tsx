'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Card, Mensaje, Cargando } from '@/components/admin/ui';

export default function BondiAdminPage() {
  const [d, setD] = useState<any>(null);
  const [paradas, setParadas] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<{ texto: string; ok: boolean } | null>(null);

  function cargar() {
    fetch('/api/admin/info-bondi')
      .then((r) => r.json())
      .then((data) => {
        setD(data);
        setParadas(Array.isArray(data.paradas) ? data.paradas : []);
      });
  }
  useEffect(cargar, []);

  function campo(nombre: string, valor: any) {
    setD((prev: any) => ({ ...prev, [nombre]: valor }));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const res = await fetch('/api/admin/info-bondi', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...d, paradas }),
    }).then((r) => r.json());
    setGuardando(false);
    setMsg({ texto: res.mensaje || res.error, ok: !!res.success });
    setTimeout(() => setMsg(null), 4000);
  }

  async function vaciar() {
    if (!confirm('¿Vaciar la información del colectivo? Dejará de mostrarse en la web hasta que cargues uno nuevo.')) return;
    const res = await fetch('/api/admin/info-bondi', { method: 'DELETE' }).then((r) => r.json());
    setMsg({ texto: res.mensaje, ok: true });
    cargar();
  }

  if (!d) return <AdminShell titulo="🚌 Info Bondi"><Cargando /></AdminShell>;

  return (
    <AdminShell titulo="🚌 Info Bondi">
      <Card title="Información del colectivo oficial">
        {msg && <Mensaje texto={msg.texto} ok={msg.ok} />}
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="campo-label">Descripción</label>
            <input className="campo-input" value={d.descripcion || ''} onChange={(e) => campo('descripcion', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="campo-label">Destino</label>
              <input className="campo-input" value={d.destino || ''} onChange={(e) => campo('destino', e.target.value)} />
            </div>
            <div>
              <label className="campo-label">Cupos disponibles</label>
              <input className="campo-input" type="number" min={0} value={d.cupos_disponibles ?? ''} onChange={(e) => campo('cupos_disponibles', e.target.value)} />
            </div>
          </div>
          <h3 className="text-navy uppercase italic font-bold text-xs pt-2 border-t border-dashed border-slate-200">Salida</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="campo-label">Fecha</label>
              <input className="campo-input" type="date" value={d.fecha_salida || ''} onChange={(e) => campo('fecha_salida', e.target.value)} />
            </div>
            <div>
              <label className="campo-label">Hora</label>
              <input className="campo-input" type="time" value={d.hora_salida || ''} onChange={(e) => campo('hora_salida', e.target.value)} />
            </div>
            <div>
              <label className="campo-label">Lugar</label>
              <input className="campo-input" value={d.lugar_salida || ''} onChange={(e) => campo('lugar_salida', e.target.value)} />
            </div>
          </div>
          <h3 className="text-navy uppercase italic font-bold text-xs pt-2 border-t border-dashed border-slate-200">Regreso</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="campo-label">Fecha</label>
              <input className="campo-input" type="date" value={d.fecha_regreso || ''} onChange={(e) => campo('fecha_regreso', e.target.value)} />
            </div>
            <div>
              <label className="campo-label">Hora</label>
              <input className="campo-input" type="time" value={d.hora_regreso || ''} onChange={(e) => campo('hora_regreso', e.target.value)} />
            </div>
            <div>
              <label className="campo-label">Lugar</label>
              <input className="campo-input" value={d.lugar_regreso || ''} onChange={(e) => campo('lugar_regreso', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="campo-label">Precio adulto ($)</label>
              <input className="campo-input" type="number" step="0.01" value={d.precio_adulto ?? ''} onChange={(e) => campo('precio_adulto', e.target.value)} />
            </div>
            <div>
              <label className="campo-label">Precio menor de 12 años ($)</label>
              <input className="campo-input" type="number" step="0.01" value={d.precio_menor ?? ''} onChange={(e) => campo('precio_menor', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="campo-label">Comentario / advertencia</label>
            <input className="campo-input" value={d.comentario || ''} onChange={(e) => campo('comentario', e.target.value)} />
          </div>

          <div>
            <label className="campo-label">Paradas en el camino</label>
            <div className="space-y-2 mt-1.5">
              {paradas.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="campo-input"
                    placeholder="Ej: Terminal Córdoba 22:00hs"
                    value={p}
                    onChange={(e) => setParadas((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
                  />
                  <button type="button" onClick={() => setParadas((prev) => prev.filter((_, idx) => idx !== i))} className="text-bordeaux text-xs font-bold px-2">
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" className="btn-secundario" onClick={() => setParadas((prev) => [...prev, ''])}>
                + Agregar parada
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button className="btn-primario !normal-case !not-italic" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={vaciar} className="btn-primario !normal-case !not-italic !bg-bordeaux hover:!bg-red-900">
              Vaciar (dar de baja el colectivo)
            </button>
          </div>
        </form>
      </Card>
    </AdminShell>
  );
}
