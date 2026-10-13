import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import crypto from 'crypto';

// ojo: el token es el de produccion, para probar usar el de TEST en .env.local
export function mpClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN en las variables de entorno.');
  return new MercadoPagoConfig({ accessToken });
}

export async function crearPreferenciaBondi(opts: {
  reservaId: string;
  monto: number;
  descripcion: string;
  payerEmail?: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const client = mpClient();
  const preference = new Preference(client);

  const resultado = await preference.create({
    body: {
      items: [
        {
          id: opts.reservaId,
          title: opts.descripcion,
          quantity: 1,
          unit_price: opts.monto,
          currency_id: 'ARS',
        },
      ],
      payer: opts.payerEmail ? { email: opts.payerEmail } : undefined,
      external_reference: opts.reservaId,
      back_urls: {
        success: `${baseUrl}/pago-resultado?estado=success`,
        pending: `${baseUrl}/pago-resultado?estado=pending`,
        failure: `${baseUrl}/pago-resultado?estado=failure`,
      },
      auto_return: 'approved',
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
      // esto es lo que ve el socio en el resumen de la tarjeta, max 16 caracteres
      statement_descriptor: 'VIAJES FILIAL CF',
    },
  });

  return {
    preferenceId: resultado.id!,
    initPoint: resultado.init_point!,
    sandboxInitPoint: resultado.sandbox_init_point,
  };
}

export async function obtenerPago(paymentId: string) {
  const client = mpClient();
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}

export function validarFirmaWebhook(opts: { xSignature: string | null; xRequestId: string | null; dataId: string }): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !opts.xSignature || !opts.xRequestId) return false;

  const partes = Object.fromEntries(
    opts.xSignature.split(',').map((par) => {
      const [k, v] = par.split('=');
      return [k.trim(), v?.trim()];
    })
  );
  const ts = partes['ts'];
  const hashRecibido = partes['v1'];
  if (!ts || !hashRecibido) return false;

  // el orden del manifest es el de la doc de MP, no tocarlo
  const manifest = `id:${opts.dataId.toLowerCase()};request-id:${opts.xRequestId};ts:${ts};`;
  const hashCalculado = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  const bufCalculado = Buffer.from(hashCalculado);
  const bufRecibido = Buffer.from(hashRecibido);
  // timingSafeEqual tira error si los largos no coinciden
  if (bufCalculado.length !== bufRecibido.length) return false;

  return crypto.timingSafeEqual(bufCalculado, bufRecibido);
}
