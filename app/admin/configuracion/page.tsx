'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Card, Mensaje, Cargando } from '@/components/admin/ui';

export default function ConfiguracionPage() {
  const [d, setD] = useState<any>(null);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<{ texto: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/admin/configuracion')
      .then((r) => r.json())
      .then(setD);
  }, []);

  function campo(nombre: string, valor: any) {
    setD((prev: any) => ({ ...prev, [nombre]: valor }));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const res = await fetch('/api/admin/configuracion', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d),
    }).then((r) => r.json());
    setGuardando(false);
    setMsg({ texto: res.mensaje || res.error, ok: !!res.success });
    setTimeout(() => setMsg(null), 4000);
  }

  if (!d) return <AdminShell titulo="⚙️ Configuración"><Cargando /></AdminShell>;

  return (
    <AdminShell titulo="⚙️ Configuración">
      <Card title="Banner y WhatsApp de soporte">
        {msg && <Mensaje texto={msg.texto} ok={msg.ok} />}
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="campo-label">URL del banner (imagen de fondo del header)</label>
            <input className="campo-input" value={d.banner_url || ''} onChange={(e) => campo('banner_url', e.target.value)} />
          </div>
          <div>
            <label className="campo-label">WhatsApp de soporte</label>
            <input className="campo-input" value={d.whatsapp || ''} onChange={(e) => campo('whatsapp', e.target.value)} placeholder="Ej: 5491100000000" />
          </div>

          <label className="flex items-center gap-2 text-[13.5px] pt-2">
            <input type="checkbox" checked={!!d.mostrar_filial_ba} onChange={(e) => campo('mostrar_filial_ba', e.target.checked)} />
            Este viaje participa también la Filial Buenos Aires (muestra el selector de filial y el segundo alias)
          </label>

          <label className="flex items-center gap-2 text-[13.5px] bg-blue-50 border border-blue-200 rounded-md px-3 py-2.5">
            <input type="checkbox" checked={d.mercadopago_habilitado !== false} onChange={(e) => campo('mercadopago_habilitado', e.target.checked)} />
            Mostrar botón de "Pagar con Mercado Pago" en el sitio (desactivalo cuando ya no quieras recibir pagos por esta vía — las reservas por transferencia siguen funcionando igual)
          </label>

          <h3 className="text-navy uppercase italic font-bold text-xs pt-3 border-t border-dashed border-slate-200">Filial Capital Federal</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="campo-label">Alias</label>
              <input className="campo-input" value={d.alias || ''} onChange={(e) => campo('alias', e.target.value)} />
            </div>
            <div>
              <label className="campo-label">CBU/CVU</label>
              <input className="campo-input" value={d.cbu || ''} onChange={(e) => campo('cbu', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="campo-label">Titular</label>
            <input className="campo-input" value={d.titular || ''} onChange={(e) => campo('titular', e.target.value)} />
          </div>

          {d.mostrar_filial_ba && (
            <>
              <h3 className="text-navy uppercase italic font-bold text-xs pt-3 border-t border-dashed border-slate-200">Filial Buenos Aires</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="campo-label">Alias</label>
                  <input className="campo-input" value={d.alias_ba || ''} onChange={(e) => campo('alias_ba', e.target.value)} />
                </div>
                <div>
                  <label className="campo-label">CBU/CVU</label>
                  <input className="campo-input" value={d.cbu_ba || ''} onChange={(e) => campo('cbu_ba', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="campo-label">Titular</label>
                <input className="campo-input" value={d.titular_ba || ''} onChange={(e) => campo('titular_ba', e.target.value)} />
              </div>
            </>
          )}

          <button className="btn-primario !normal-case !not-italic" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </Card>
    </AdminShell>
  );
}
