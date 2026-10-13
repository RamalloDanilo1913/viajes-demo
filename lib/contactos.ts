import type { SupabaseClient } from '@supabase/supabase-js';

export interface ContactoExtraido {
  email: string;
  nombre: string;
  telefono: string;
  dni: string;
  localidad: string;
}

export function esc(texto: string): string {
  return (texto || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export function extraerContactos(reservas: any[], opciones: { excluirRechazados?: boolean; soloPagados?: boolean } = {}): ContactoExtraido[] {
  const porEmail = new Map<string, ContactoExtraido>();

  for (const r of reservas) {
    const estado = r.estado_pago || 'pendiente';
    if (estado === 'rechazado' && opciones.excluirRechazados !== false) continue;
    if (opciones.soloPagados && estado !== 'pagado') continue;

    const titularEmail = (r.email || '').trim().toLowerCase();
    if (titularEmail.includes('@') && !porEmail.has(titularEmail)) {
      porEmail.set(titularEmail, {
        email: titularEmail,
        nombre: r.nombre_titular || '',
        telefono: r.telefono || '',
        dni: r.dni_titular || '',
        localidad: r.localidad || '',
      });
    }

    for (const p of r.reservas_bondi_pasajeros || []) {
      const email = (p.email || '').trim().toLowerCase();
      if (!email.includes('@')) continue;
      porEmail.set(email, {
        email,
        nombre: p.nombre || porEmail.get(email)?.nombre || '',
        telefono: p.telefono && p.telefono !== '-' ? p.telefono : porEmail.get(email)?.telefono || '',
        dni: p.dni || porEmail.get(email)?.dni || '',
        localidad: p.localidad || porEmail.get(email)?.localidad || '',
      });
    }
  }
  return Array.from(porEmail.values());
}

export async function guardarContactos(sb: SupabaseClient, contactos: ContactoExtraido[], viaje: string): Promise<number> {
  const nombreViaje = (viaje || '').trim();
  if (!nombreViaje) throw new Error('Falta el nombre del viaje para guardar los contactos.');
  if (contactos.length === 0) return 0;
  const filas = contactos.map((c) => ({
    viaje: nombreViaje,
    email: c.email,
    nombre: c.nombre,
    telefono: c.telefono,
    dni: c.dni,
    localidad: c.localidad,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await sb.from('contactos_bondi').upsert(filas, { onConflict: 'viaje,email' });
  if (error) throw new Error(error.message);
  return filas.length;
}

// supabase corta en 1000 filas por consulta, por eso pagino
export async function traerTodo<T = any>(armar: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const paso = 1000;
  const todo: T[] = [];
  for (let desde = 0; ; desde += paso) {
    const { data, error } = await armar(desde, desde + paso - 1);
    if (error) throw new Error(error.message);
    todo.push(...(data || []));
    if (!data || data.length < paso) break;
  }
  return todo;
}

export async function emailsDeBaja(sb: SupabaseClient): Promise<Set<string>> {
  const filas = await traerTodo<{ email: string }>((d, h) => sb.from('bajas_bondi').select('email').range(d, h));
  return new Set(filas.map((f) => f.email));
}

export async function contactosDeViaje(sb: SupabaseClient, viaje: string) {
  return traerTodo<{ email: string; nombre: string; telefono: string; dni: string; localidad: string; token_baja: string }>((d, h) =>
    sb.from('contactos_bondi').select('email, nombre, telefono, dni, localidad, token_baja').eq('viaje', viaje).order('nombre', { ascending: true }).range(d, h)
  );
}

export interface ListaContactos {
  viaje: string;
  total: number;
  activos: number;
  bajas: number;
  ultimaActualizacion: string;
}

export async function listasDeContactos(sb: SupabaseClient): Promise<ListaContactos[]> {
  const [filas, bajas] = await Promise.all([
    traerTodo<{ viaje: string; email: string; updated_at: string }>((d, h) => sb.from('contactos_bondi').select('viaje, email, updated_at').range(d, h)),
    emailsDeBaja(sb),
  ]);
  const mapa = new Map<string, ListaContactos>();
  for (const f of filas) {
    const l = mapa.get(f.viaje) || { viaje: f.viaje, total: 0, activos: 0, bajas: 0, ultimaActualizacion: '' };
    l.total++;
    if (bajas.has(f.email)) l.bajas++;
    else l.activos++;
    if (f.updated_at > l.ultimaActualizacion) l.ultimaActualizacion = f.updated_at;
    mapa.set(f.viaje, l);
  }
  return Array.from(mapa.values()).sort((a, b) => b.ultimaActualizacion.localeCompare(a.ultimaActualizacion));
}

// formato: Destino - dd/mm/aaaa
export function nombreViajeDesdeInfo(info: { destino?: string; fecha_salida?: string | null } | null): string {
  if (!info?.destino) return '';
  const f = info.fecha_salida ? info.fecha_salida.split('-').reverse().join('/') : '';
  return f ? `${info.destino} - ${f}` : info.destino;
}
