import { resend } from './resend';
import { logError } from './supabase';

// lotes de 50 con pausa para que gmail no marque los mails como spam
const TAMANO_LOTE = 50;
const PAUSA_ENTRE_LOTES_MS = 1200;
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Payload = Parameters<typeof resend.batch.send>[0][number];

export async function enviarEnLotes<T>(
  items: T[],
  armar: (item: T) => Payload,
  contexto: string,
  alFallar?: (lote: T[]) => Promise<void>
): Promise<{ enviados: number; fallidos: number }> {
  let enviados = 0;
  let fallidos = 0;
  for (let i = 0; i < items.length; i += TAMANO_LOTE) {
    const lote = items.slice(i, i + TAMANO_LOTE);
    try {
      const { error } = await resend.batch.send(lote.map(armar));
      if (error) throw new Error(error.message);
      enviados += lote.length;
    } catch (e: any) {
      fallidos += lote.length;
      await logError(`${contexto}: envío de lote`, e.message);
      if (alFallar) await alFallar(lote);
    }
    if (i + TAMANO_LOTE < items.length) await dormir(PAUSA_ENTRE_LOTES_MS);
  }
  return { enviados, fallidos };
}
