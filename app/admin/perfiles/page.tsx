'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Card, BotonPeligro, TablaVacia, Mensaje, Cargando } from '@/components/admin/ui';

export default function PerfilesPage() {
  const [lista, setLista] = useState<any[] | null>(null);
  const [msg, setMsg] = useState<{ texto: string; ok: boolean } | null>(null);

  function cargar() {
    fetch('/api/admin/perfiles')
      .then((r) => r.json())
      .then(setLista);
  }
  useEffect(cargar, []);

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este perfil y todo su historial de calificaciones? Esta acción no se puede deshacer.')) return;
    const res = await fetch(`/api/admin/perfiles?id=${id}`, { method: 'DELETE' }).then((r) => r.json());
    setMsg({ texto: res.mensaje || res.error, ok: !!res.success });
    setTimeout(() => setMsg(null), 4000);
    cargar();
  }

  return (
    <AdminShell titulo="⭐ Perfiles">
      <Card title="Perfiles y calificaciones (clave: DNI + Apellido)">
        {msg && <Mensaje texto={msg.texto} ok={msg.ok} />}
        {lista === null ? (
          <Cargando />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[10.5px] uppercase text-slate-500">
                  <th className="p-2.5">Nombre</th>
                  <th className="p-2.5">DNI</th>
                  <th className="p-2.5">Apellido</th>
                  <th className="p-2.5">⭐ Conductor</th>
                  <th className="p-2.5">⭐ Pasajero</th>
                  <th className="p-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {lista.length === 0 && <TablaVacia colSpan={6}>Sin perfiles todavía.</TablaVacia>}
                {lista.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-2.5">{p.nombreCompleto}</td>
                    <td className="p-2.5">{p.dni}</td>
                    <td className="p-2.5">{p.apellido}</td>
                    <td className="p-2.5">{p.promedioConductor !== null ? `⭐ ${p.promedioConductor} (${p.cantConductor})` : '—'}</td>
                    <td className="p-2.5">{p.promedioPasajero !== null ? `⭐ ${p.promedioPasajero} (${p.cantPasajero})` : '—'}</td>
                    <td className="p-2.5">
                      <BotonPeligro onClick={() => eliminar(p.id)}>Eliminar</BotonPeligro>
                    </td>
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
