'use client';

import { useEffect, useState } from 'react';
import TabsNav, { Tab } from '@/components/TabsNav';
import BuscarAutos from '@/components/BuscarAutos';
import OfrecerAuto from '@/components/OfrecerAuto';
import BondiOficial from '@/components/BondiOficial';
import type { Configuracion, DatosSocio } from '@/lib/types';

export default function Home() {
  const [tab, setTab] = useState<Tab>('buscar-autos');
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [datosSocio, setDatosSocio] = useState<DatosSocio | null>(null);

  useEffect(() => {
    fetch('/api/configuracion', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setConfig(data && !('error' in data) ? data : null))
      .catch(() => setConfig(null));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;

    const tabParam = params.get('tab');
    window.history.replaceState({}, '', window.location.pathname);
    if (tabParam) setTab(tabParam as Tab);

    fetch('/api/socio-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((d) => setDatosSocio(d));
  }, []);

  return (
    <>
      <header
        className="text-white text-center border-b-4 border-blue-900 px-4 py-16"
        style={{
          backgroundImage: `linear-gradient(rgba(0,31,63,0.70), rgba(0,31,63,0.85)), url('${config?.bannerUrl || ''}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <h1 className="font-black italic uppercase tracking-wide text-3xl md:text-[38px] m-0" style={{ textShadow: '2px 2px 5px rgba(0,0,0,0.6)' }}>
          Viajes Filial Capital Federal
        </h1>
        <p className="italic mt-2.5 text-[15px] opacity-95" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
          Coordinación de traslados para seguir a Talleres
        </p>
      </header>

      <TabsNav activa={tab} onCambiar={setTab} />

      <div className="max-w-[700px] mx-auto my-5 px-4">
        {tab === 'buscar-autos' && <BuscarAutos datosSocio={datosSocio} />}
        {tab === 'ofrecer-auto' && <OfrecerAuto datosSocio={datosSocio} />}
        {tab === 'bondi' && <BondiOficial datosSocio={datosSocio} config={config} />}
      </div>
    </>
  );
}
