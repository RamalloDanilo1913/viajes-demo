'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Card, BotonPeligro, TablaVacia, Mensaje, Cargando } from '@/components/admin/ui';

export default function ErroresPage() {
  const [lista, setLista] = useState<any[] | null>(null);
  const [msg, setMsg] = useState<{ texto: string; ok: boolean } | null>(null);

  function cargar() {
    fetch('/api/admin/errores')
      .then((r) => r.json())
      .then(setLista);
  }
  useEffect(cargar, []);

  async function vaciar() {
    if (!confirm('¿Vaciar el registro de errores técnicos?')) return;
    const res = await fetch('/api/admin/errores', { method: 'DELETE' }).then((r) => r.json());
    setMsg({ texto: res.mensaje || res.error, ok: !!res.success });
    setTimeout(() => setMsg(null), 4000);
    cargar();
  }

  return (
    <AdminShell titulo="⚠️ Errores técnicos">
      <Card title="Fallos técnicos (ej: emails que no se pudieron enviar)" action={<BotonPeligro onClick={vaciar}>Vaciar registro</BotonPeligro>}>
        <p className="text-[12.5px] text-slate-500 -mt-3 mb-4">
          Si un email no se pudo enviar (dirección inválida, Resend caído, etc.) queda registrado acá para que lo revises sin entrar a los logs de Vercel.
        </p>
        {msg && <Mensaje texto={msg.texto} ok={msg.ok} />}
        {lista === null ? (
          <Cargando />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[10.5px] uppercase text-slate-500">
                  <th className="p-2.5">Fecha</th>
                  <th className="p-2.5">Contexto</th>
                  <th className="p-2.5">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {lista.length === 0 && <TablaVacia colSpan={3}>Sin errores registrados. 👍</TablaVacia>}
                {lista.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50 align-top">
                    <td className="p-2.5 whitespace-nowrap">{new Date(e.fecha).toLocaleString('es-AR')}</td>
                    <td className="p-2.5">{e.contexto}</td>
                    <td className="p-2.5">{e.detalle}</td>
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
