'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Card, BotonPeligro, TablaVacia, Mensaje, Cargando } from '@/components/admin/ui';

export default function AutosAdminPage() {
  const [lista, setLista] = useState<any[] | null>(null);
  const [msg, setMsg] = useState<{ texto: string; ok: boolean } | null>(null);

  function cargar() {
    fetch('/api/admin/viajes-autos')
      .then((r) => r.json())
      .then(setLista);
  }
  useEffect(cargar, []);

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este auto publicado?')) return;
    const res = await fetch(`/api/admin/viajes-autos?id=${id}`, { method: 'DELETE' }).then((r) => r.json());
    setMsg({ texto: res.mensaje || res.error, ok: !!res.success });
    setTimeout(() => setMsg(null), 4000);
    cargar();
  }

  return (
    <AdminShell titulo="🚗 Autos">
      <Card title="Autos publicados">
        {msg && <Mensaje texto={msg.texto} ok={msg.ok} />}
        {lista === null ? (
          <Cargando />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[10.5px] uppercase text-slate-500">
                  <th className="p-2.5">Conductor</th>
                  <th className="p-2.5">DNI</th>
                  <th className="p-2.5">Partido</th>
                  <th className="p-2.5">Salida</th>
                  <th className="p-2.5">Cupos</th>
                  <th className="p-2.5">Precio</th>
                  <th className="p-2.5">WhatsApp</th>
                  <th className="p-2.5">Email</th>
                  <th className="p-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {lista.length === 0 && <TablaVacia colSpan={9}>No hay autos publicados.</TablaVacia>}
                {lista.map((v) => (
                  <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-2.5">{v.nombre} {v.apellido}</td>
                    <td className="p-2.5">{v.dni}</td>
                    <td className="p-2.5">{v.partido}</td>
                    <td className="p-2.5 whitespace-nowrap">{new Date(v.fecha_salida).toLocaleString('es-AR')}</td>
                    <td className="p-2.5">{v.cupos}</td>
                    <td className="p-2.5">{v.precio}</td>
                    <td className="p-2.5">{v.whatsapp}</td>
                    <td className="p-2.5">{v.email}</td>
                    <td className="p-2.5">
                      <BotonPeligro onClick={() => eliminar(v.id)}>Eliminar</BotonPeligro>
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
