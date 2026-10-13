'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Card, BotonPeligro, TablaVacia, Mensaje, Cargando } from '@/components/admin/ui';

export default function HistorialPage() {
  const [lista, setLista] = useState<any[] | null>(null);
  const [msg, setMsg] = useState<{ texto: string; ok: boolean } | null>(null);

  function cargar() {
    fetch('/api/admin/historial')
      .then((r) => r.json())
      .then(setLista);
  }
  useEffect(cargar, []);

  async function vaciarTodo() {
    // confirm nativo, para el admin alcanza
    if (!confirm('¿Vaciar TODO el historial de viajes publicados? Esta acción no se puede deshacer.')) return;
    const res = await fetch('/api/admin/historial', { method: 'DELETE' }).then((r) => r.json());
    setMsg({ texto: res.mensaje || res.error, ok: !!res.success });
    setTimeout(() => setMsg(null), 4000);
    cargar();
  }

  return (
    <AdminShell titulo="🗂️ Historial">
      <Card title="Historial de todos los viajes publicados" action={<BotonPeligro onClick={vaciarTodo}>Vaciar todo</BotonPeligro>}>
        {msg && <Mensaje texto={msg.texto} ok={msg.ok} />}
        {lista === null ? (
          <Cargando />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[10.5px] uppercase text-slate-500">
                  <th className="p-2.5">Publicado</th>
                  <th className="p-2.5">Conductor</th>
                  <th className="p-2.5">Partido</th>
                  <th className="p-2.5">Salida</th>
                  <th className="p-2.5">Lugar</th>
                  <th className="p-2.5">Precio</th>
                  <th className="p-2.5">Cupos</th>
                </tr>
              </thead>
              <tbody>
                {lista.length === 0 && <TablaVacia colSpan={7}>Sin registros todavía.</TablaVacia>}
                {lista.map((h) => (
                  <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-2.5 whitespace-nowrap">{new Date(h.fecha_publicacion).toLocaleString('es-AR')}</td>
                    <td className="p-2.5">{h.conductor_nombre} {h.conductor_apellido}</td>
                    <td className="p-2.5">{h.partido}</td>
                    <td className="p-2.5 whitespace-nowrap">{h.fecha_salida ? new Date(h.fecha_salida).toLocaleString('es-AR') : '—'}</td>
                    <td className="p-2.5">{h.lugar_salida}</td>
                    <td className="p-2.5">{h.precio}</td>
                    <td className="p-2.5">{h.cupos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
}
