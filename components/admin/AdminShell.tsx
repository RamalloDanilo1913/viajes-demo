'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin', label: 'Resumen', icon: '📊' },
  { href: '/admin/bondi', label: 'Info Bondi', icon: '🚌' },
  { href: '/admin/partidos', label: 'Partidos', icon: '⚽' },
  { href: '/admin/configuracion', label: 'Configuración', icon: '⚙️' },
  { href: '/admin/reservas-bondi', label: 'Reservas Bondi', icon: '🎫' },
  { href: '/admin/encuesta-bondi', label: 'Encuesta y avisos', icon: '⭐' },
  { href: '/admin/autos', label: 'Autos', icon: '🚗' },
  { href: '/admin/solicitudes', label: 'Solicitudes', icon: '📋' },
  { href: '/admin/historial', label: 'Historial', icon: '🗂️' },
  { href: '/admin/perfiles', label: 'Perfiles', icon: '⭐' },
  { href: '/admin/errores', label: 'Errores técnicos', icon: '⚠️' },
];

export default function AdminShell({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [usuario, setUsuario] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    fetch('/api/admin/session')
      .then((r) => {
        if (r.status === 401) {
          router.replace('/admin/login');
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d) setUsuario(d.usuario);
        setCargando(false);
      });
  }, [router]);

  useEffect(() => setMenuAbierto(false), [pathname]);

  async function cerrarSesion() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
  }

  if (cargando) return <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-400">Cargando panel...</div>;
  if (!usuario) return null;

  const contenidoSidebar = (
    <>
      <div className="px-5 py-6 border-b border-white/10">
        <p className="text-[10.5px] uppercase tracking-widest text-white/50 font-bold mb-1">Panel Admin</p>
        <h1 className="italic font-black uppercase text-[15px] leading-tight">Viajes Filial Capital Federal</h1>
      </div>
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map((item) => {
          const activo = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-2.5 text-[13px] font-semibold transition-colors ${
                activo ? 'bg-white/10 text-white border-r-[3px] border-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </a>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-[11px] text-white/50 mb-2">Conectado como {usuario}</p>
        <button onClick={cerrarSesion} className="w-full bg-white/10 hover:bg-white/20 text-white text-[11.5px] font-bold py-2 rounded transition-colors">
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <aside className="hidden md:flex w-60 bg-navy text-white flex-col fixed inset-y-0 left-0">{contenidoSidebar}</aside>

      {menuAbierto && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-72 bg-navy text-white flex flex-col">{contenidoSidebar}</div>
          <div className="flex-1 bg-black/50" onClick={() => setMenuAbierto(false)} />
        </div>
      )}

      <main className="flex-1 md:ml-60 min-w-0">
        <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 md:py-5 flex items-center gap-3">
          <button
            onClick={() => setMenuAbierto(true)}
            className="md:hidden text-navy text-2xl leading-none px-1 -ml-1"
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <h1 className="text-navy italic font-black uppercase text-base md:text-lg m-0 truncate">{titulo}</h1>
        </div>
        <div className="p-4 md:p-8 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
