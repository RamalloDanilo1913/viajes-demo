import { NextRequest } from 'next/server';
import { supabaseAdmin } from './supabase';

export const ADMIN_COOKIE_NAME = 'admin_session';
// 6 horas me parece bien para una sesion de admin
const DURACION_HORAS = 6;

export async function crearSesion(usuario: string): Promise<string> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('admin_sesiones').insert({ usuario }).select('token').single();
  if (error || !data) throw new Error('No se pudo crear la sesión.');
  return data.token;
}

export async function validarSesion(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const sb = supabaseAdmin();
  const limite = new Date(Date.now() - DURACION_HORAS * 60 * 60 * 1000).toISOString();
  const { data } = await sb.from('admin_sesiones').select('usuario').eq('token', token).gte('creado_at', limite).maybeSingle();
  return data?.usuario || null;
}

export async function cerrarSesion(token: string) {
  const sb = supabaseAdmin();
  await sb.from('admin_sesiones').delete().eq('token', token);
}

export async function requireAdmin(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return validarSesion(token);
}
