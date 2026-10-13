import { NextRequest, NextResponse } from 'next/server';
import { cerrarSesion, ADMIN_COOKIE_NAME } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (token) await cerrarSesion(token);
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return res;
}
