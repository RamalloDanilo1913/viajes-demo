'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { StatCard, Cargando } from '@/components/admin/ui';

export default function ResumenPage() {
  const [r, setR] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/resumen')
      .then((res) => res.json())
      .then(setR);
  }, []);

  return (
    <AdminShell titulo="📊 Resumen">
      {!r ? (
        <Cargando />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard valor={r.autosActivos} etiqueta="Autos activos" />
          <StatCard valor={r.cuposAutosLibres} etiqueta="Lugares libres en autos" />
          <StatCard valor={r.solicitudesPendientes} etiqueta="Solicitudes pendientes" />
          <StatCard valor={r.solicitudesAceptadas} etiqueta="Solicitudes aceptadas" />
          <StatCard valor={r.bondiCupos ?? '—'} etiqueta={`Cupos bondi (${r.bondiDestino || 'sin destino'})`} />
          <StatCard valor={r.reservasBondi} etiqueta="Reservas de bondi" />
          <StatCard valor={r.perfilesRegistrados} etiqueta="Perfiles registrados" />
          <StatCard valor={r.viajesHistoricos} etiqueta="Viajes publicados (histórico)" />
        </div>
      )}
    </AdminShell>
  );
}
