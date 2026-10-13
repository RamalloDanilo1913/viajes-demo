import crypto from 'crypto';

export function compararSeguro(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const esUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);

export function limpiarTexto(valor: unknown, max: number): string {
  if (typeof valor !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return valor.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);
}

// si arranca con = + - @ excel lo toma como formula
export function celdaSegura<T>(valor: T): T | string {
  if (typeof valor === 'string' && /^[=+\-@\t\r]/.test(valor)) return `'${valor}`;
  return valor;
}
export function filasSeguras(filas: Record<string, string | number>[]) {
  return filas.map((fila) =>
    Object.fromEntries(Object.entries(fila).map(([k, v]) => [k, celdaSegura(v)]))
  ) as Record<string, string | number>[];
}

export function ipDe(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  return (xff ? xff.split(',')[0].trim() : req.headers.get('x-real-ip')) || 'desconocida';
}

// en memoria nomas, en vercel se reinicia con cada instancia (alcanza para lo que necesito)
const intentos = new Map<string, number[]>();
export function superaLimite(clave: string, max: number, ventanaMs: number): boolean {
  const ahora = Date.now();
  const recientes = (intentos.get(clave) || []).filter((t) => ahora - t < ventanaMs);
  recientes.push(ahora);
  intentos.set(clave, recientes);
  if (intentos.size > 5000) {
    for (const [k, v] of intentos) if (!v.some((t) => ahora - t < ventanaMs)) intentos.delete(k);
  }
  return recientes.length > max;
}
export function limpiarIntentos(clave: string) {
  intentos.delete(clave);
}

// miro los primeros bytes y no la extension, la extension la pone cualquiera
export function tipoDeArchivo(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length < 12) return null;
  if (buf.subarray(0, 4).toString('latin1') === '%PDF') return { mime: 'application/pdf', ext: 'pdf' };
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', ext: 'png' };
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  return null;
}
