export interface Configuracion {
  bannerUrl: string;
  alias: string;
  cbu: string;
  titular: string;
  whatsapp: string;
  aliasBA: string;
  cbuBA: string;
  titularBA: string;
  mostrarFilialBA: boolean;
  mercadopagoHabilitado: boolean;
}

export interface InfoBondi {
  descripcion: string;
  destino: string;
  fecha_salida: string | null;
  hora_salida: string;
  lugar_salida: string;
  cupos_disponibles: number;
  fecha_regreso: string | null;
  lugar_regreso: string;
  hora_regreso: string;
  comentario: string;
  precio_adulto: number | null;
  precio_menor: number | null;
  paradas: string[];
}

export interface PasajeroBondi {
  nombre: string;
  dni: string;
  esMenor: boolean;
  fechaNacimiento: string;
  parada: string;
  email: string;
  telefono: string;
  telEmergencia: string;
  localidad: string;
  esSocio: boolean;
  numSocio: string;
}

export interface DatosReservaBondi {
  filial: 'Capital Federal' | 'Buenos Aires';
  pasajeros: PasajeroBondi[];
  metodoPago?: 'transferencia' | 'mercadopago';
  fileData?: string;
  fileName?: string;
  fileMime?: string;
}

export interface ViajeAuto {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  whatsapp: string;
  partido: string;
  fecha_salida: string;
  fecha_regreso: string | null;
  precio: string;
  lugar_salida: string;
  notas: string;
  cupos: number;
}

export interface DatosSocio {
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  numero_socio: string;
  fecha_nacimiento: string;
  email: string;
}
