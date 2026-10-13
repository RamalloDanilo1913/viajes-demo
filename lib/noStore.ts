import { NextResponse } from 'next/server';

export function jsonNoStore(data: unknown, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return res;
}
