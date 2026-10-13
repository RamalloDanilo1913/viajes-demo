export function validarDni(dni: string | undefined | null): boolean {
  return /^\d{7,8}$/.test((dni || '').toString().trim());
}

export function validarTelefono(tel: string | undefined | null): boolean {
  return /^\d{10,15}$/.test((tel || '').toString().trim());
}

export function validarEmail(email: string | undefined | null): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').toString().trim());
}

export function linkSoporte(mensaje?: string): string {
  const numero = process.env.SOPORTE_WHATSAPP || '';
  const texto = mensaje || 'Hola, necesito ayuda con la web de viajes.';
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

export function linkWhatsapp(whatsapp: string, nombreConductor: string, partido: string): string {
  let tel = whatsapp.replace(/[^0-9]/g, '');
  // si el numero no trae el 54 se lo agrego
  if (!tel.startsWith('54')) tel = '54' + tel;
  const texto = `Hola ${nombreConductor}, ya me anoté en la web de la filial para viajar con vos al ${partido}. ¡Coordinamos!`;
  return `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`;
}
