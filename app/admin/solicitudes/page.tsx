'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Card, Badge, BotonPeligro, TablaVacia, Mensaje, Cargando } from '@/components/admin/ui';

const COLOR_ESTADO: Record<string, 'amber' | 'emerald' | 'red' | 'slate'> = {
  Pendiente: 'amber',
  Aceptada: 'emerald',
  Rechazada: 'red',
  Cancelada: 'slate',
};

export default function SolicitudesPage() {
  const [lista, setLista] = useState<any[] | null>(null);
  const [msg, setMsg] = useState<{ texto: string; ok: boolean } | null>(null);

  function cargar() {
    fetch('/api/admin/reservas-autos')
      .then((r) => r.json())
      .then(setLista);
  }
  useEffect(cargar, []);

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta solicitud?')) return;
    const res = await fetch(`/api/admin/reservas-autos?id=${id}`, { method: 'DELETE' }).then((r) => r.json());
    setMsg({ texto: res.mensaje || res.error, ok: !!res.success });
    setTimeout(() => setMsg(null), 4000);
    cargar();
  }

  return (
    <AdminShell titulo="📋 Solicitudes">
      <Card title="Solicitudes de lugar en auto">
        {msg && <Mensaje texto={msg.texto} ok={msg.ok} />}
        {lista === null ? (
          <Cargando />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[10.5px] uppercase text-slate-500">
                  <th className="p-2.5">Pasajero</th>
                  <th className="p-2.5">DNI</th>
                  <th className="p-2.5">Conductor</th>
                  <th className="p-2.5">Partido</th>
                  <th className="p-2.5">Estado</th>
                  <th className="p-2.5">Calif.</th>
                  <th className="p-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {lista.length === 0 && <TablaVacia colSpan={7}>No hay solicitudes.</TablaVacia>}
                {lista.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-2.5">{s.nombre_pasajero} {s.apellido_pasajero}</td>
                    <td className="p-2.5">{s.dni_pasajero}</td>
                    <td className="p-2.5">{s.conductor_nombre} {s.conductor_apellido}</td>
                    <td className="p-2.5">{s.partido}</td>
                    <td className="p-2.5">
                      <Badge color={COLOR_ESTADO[s.estado] || 'slate'}>{s.estado}</Badge>
                    </td>
                    <td className="p-2.5">
                      {(s.calif_conductor_hecha ? '👤→🚗 ' : '') + (s.calif_pasajero_hecha ? '🚗→👤' : '') || '—'}
                    </td>
                    <td className="p-2.5">
                      <BotonPeligro onClick={() => eliminar(s.id)}>Eliminar</BotonPeligro>
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
