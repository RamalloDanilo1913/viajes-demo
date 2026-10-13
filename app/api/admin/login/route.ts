import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { crearSesion, ADMIN_COOKIE_NAME } from '@/lib/adminAuth';
import { ipDe, superaLimite, limpiarIntentos } from '@/lib/seguridad';

export const dynamic = 'force-dynamic';

const MAX_FALLOS = 5;
const VENTANA_MS = 15 * 60 * 1000;

const HASH_RELLENO = bcrypt.hashSync('relleno-no-es-una-contrasena', 10);

function esperar(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: Request) {
  const ip = ipDe(req);
  const claveIntentos = `login:${ip}`;

  const body = await req.json().catch(() => null);
  const usuario = body?.usuario;
  const password = body?.password;
  if (typeof usuario !== 'string' || typeof password !== 'string' || !usuario || !password) {
    return NextResponse.json({ success: false, error: 'Completá usuario y contraseña.' });
  }
  if (usuario.length > 64 || password.length > 200) {
    return NextResponse.json({ success: false, error: 'Usuario o contraseña incorrectos.' });
  }

  if (superaLimite(claveIntentos, MAX_FALLOS, VENTANA_MS)) {
    return NextResponse.json({ success: false, error: 'Demasiados intentos. Esperá unos minutos y probá de nuevo.' }, { status: 429 });
  }

  const usuarioEscapado = usuario.trim().replace(/[\\%_]/g, '\\$&');
  const sb = supabaseAdmin();
  const { data: admin } = await sb.from('admins').select('usuario, password_hash').ilike('usuario', usuarioEscapado).maybeSingle();

  const hashValido = await bcrypt.compare(password, admin?.password_hash || HASH_RELLENO);
  if (!admin || !hashValido) {
    await esperar(700);
    return NextResponse.json({ success: false, error: 'Usuario o contraseña incorrectos.' });
  }

  limpiarIntentos(claveIntentos);
  const token = await crearSesion(admin.usuario);
  const res = NextResponse.json({ success: true, usuario: admin.usuario });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 6 * 60 * 60,
  });
  return res;
}
