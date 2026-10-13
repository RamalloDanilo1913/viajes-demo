create table public.admin_sesiones (
  token uuid not null default gen_random_uuid(),
  usuario text not null,
  creado_at timestamptz not null default now(),
  constraint admin_sesiones_pkey primary key (token)
);

create table public.admins (
  id uuid not null default gen_random_uuid(),
  usuario text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  constraint admins_pkey primary key (id),
  constraint admins_usuario_key unique (usuario)
);

create table public.bajas_bondi (
  email text not null,
  created_at timestamptz not null default now(),
  constraint bajas_bondi_pkey primary key (email)
);

create table public.bondi_config (
  id integer not null default 1,
  pin text not null,
  constraint bondi_config_pkey primary key (id),
  constraint bondi_config_id_check check (id = 1)
);

create table public.bondi_extras (
  id bigserial not null,
  texto text not null,
  created_at timestamptz not null default now(),
  constraint bondi_extras_pkey primary key (id)
);

create table public.bondi_meta (
  id integer not null default 1,
  titulo text,
  destino text,
  salida text,
  lugar text,
  total_pdf integer,
  constraint bondi_meta_pkey primary key (id),
  constraint bondi_meta_id_check check (id = 1)
);

create table public.bondi_pasajeros (
  id bigserial not null,
  orden integer not null,
  nombre text not null,
  menor boolean not null default false,
  dni text,
  telefono text,
  parada text,
  pago text not null default 'P',
  falta integer not null default 0,
  comentario text,
  subio boolean not null default false,
  cobrado boolean not null default false,
  nota text not null default '',
  updated_at timestamptz not null default now(),
  manual boolean not null default false,
  constraint bondi_pasajeros_pkey primary key (id),
  constraint bondi_pasajeros_pago_check check (pago = any (array['P'::text, 'D'::text]))
);

create table public.campanias_bondi (
  id uuid not null default gen_random_uuid(),
  viaje_lista text not null,
  asunto text not null,
  mensaje text not null default '',
  enviados integer not null default 0,
  fallidos integer not null default 0,
  enviado_at timestamptz not null default now(),
  constraint campanias_bondi_pkey primary key (id)
);

create table public.configuracion (
  id smallint not null default 1,
  banner_url text default '',
  alias text default '',
  cbu text default '',
  titular text default '',
  whatsapp text default '',
  alias_ba text default '',
  cbu_ba text default '',
  titular_ba text default '',
  mostrar_filial_ba boolean not null default false,
  updated_at timestamptz not null default now(),
  mercadopago_habilitado boolean not null default true,
  constraint configuracion_pkey primary key (id),
  constraint configuracion_id_check check (id = 1)
);

create table public.contactos_bondi (
  id uuid not null default gen_random_uuid(),
  viaje text not null,
  email text not null,
  nombre text not null default '',
  telefono text not null default '',
  dni text not null default '',
  localidad text not null default '',
  token_baja uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contactos_bondi_pkey primary key (id),
  constraint contactos_bondi_token_baja_key unique (token_baja),
  constraint contactos_bondi_viaje_check check (length(trim(both from viaje)) > 0),
  constraint contactos_bondi_viaje_email_key unique (viaje, email)
);

create index contactos_bondi_viaje_idx on public.contactos_bondi using btree (viaje);

create table public.encuestas_bondi (
  id uuid not null default gen_random_uuid(),
  viaje text not null,
  email text not null,
  nombre text not null default '',
  token uuid not null default gen_random_uuid(),
  enviado_at timestamptz not null default now(),
  respondido_at timestamptz,
  calificacion smallint,
  que_te_parecio text not null default '',
  a_mejorar text not null default '',
  constraint encuestas_bondi_pkey primary key (id),
  constraint encuestas_bondi_token_key unique (token),
  constraint encuestas_bondi_calificacion_check check ((calificacion >= 1) and (calificacion <= 5)),
  constraint encuestas_bondi_viaje_email_key unique (viaje, email)
);

create index encuestas_bondi_viaje_idx on public.encuestas_bondi using btree (viaje);

create table public.errores (
  id uuid not null default gen_random_uuid(),
  fecha timestamptz not null default now(),
  contexto text not null,
  detalle text,
  constraint errores_pkey primary key (id)
);

create table public.historial_viajes (
  id uuid not null default gen_random_uuid(),
  id_viaje_original uuid,
  fecha_publicacion timestamptz not null default now(),
  conductor_nombre text,
  conductor_apellido text,
  conductor_dni text,
  conductor_email text,
  conductor_whatsapp text,
  partido text,
  fecha_salida timestamptz,
  fecha_regreso timestamptz,
  lugar_salida text,
  precio text,
  cupos integer,
  constraint historial_viajes_pkey primary key (id)
);

create table public.info_bondi (
  id smallint not null default 1,
  descripcion text default '',
  destino text default '',
  hora_salida text default '',
  lugar_salida text default '',
  cupos_disponibles integer default 0,
  lugar_regreso text default '',
  hora_regreso text default '',
  comentario text default '',
  precio_adulto numeric,
  precio_menor numeric,
  paradas jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  fecha_salida date,
  fecha_regreso date,
  constraint info_bondi_pkey primary key (id),
  constraint info_bondi_id_check check (id = 1)
);

create table public.partidos (
  id uuid not null default gen_random_uuid(),
  nombre text not null,
  orden integer not null default 0,
  activo boolean not null default true,
  constraint partidos_pkey primary key (id),
  constraint partidos_nombre_key unique (nombre)
);

create table public.perfiles (
  id uuid not null default gen_random_uuid(),
  dni text not null,
  apellido text not null,
  nombre_completo text not null,
  suma_estrellas_conductor integer not null default 0,
  cant_conductor integer not null default 0,
  suma_estrellas_pasajero integer not null default 0,
  cant_pasajero integer not null default 0,
  constraint perfiles_pkey primary key (id),
  constraint perfiles_dni_apellido_key unique (dni, apellido)
);

create table public.viajes_autos (
  id uuid not null default gen_random_uuid(),
  nombre text not null,
  apellido text not null,
  dni text not null,
  email text not null,
  whatsapp text not null,
  partido text not null,
  fecha_salida timestamptz not null,
  fecha_regreso timestamptz,
  precio text default '',
  lugar_salida text not null,
  notas text default '',
  cupos integer not null,
  created_at timestamptz not null default now(),
  constraint viajes_autos_pkey primary key (id)
);

create index idx_viajes_autos_partido on public.viajes_autos using btree (partido);
create index idx_viajes_autos_fecha_salida on public.viajes_autos using btree (fecha_salida);

create table public.reservas_autos (
  id uuid not null default gen_random_uuid(),
  id_viaje uuid not null,
  nombre_pasajero text not null,
  apellido_pasajero text not null,
  dni_pasajero text not null,
  email_pasajero text not null,
  telefono_pasajero text not null,
  tel_emergencia_pasajero text default '-',
  estado text not null default 'Pendiente',
  token uuid not null default gen_random_uuid(),
  fecha_salida_viaje timestamptz,
  fecha_aceptacion timestamptz,
  calif_conductor_hecha boolean not null default false,
  calif_pasajero_hecha boolean not null default false,
  conductor_nombre text,
  conductor_apellido text,
  conductor_dni text,
  conductor_email text,
  conductor_whatsapp text,
  partido text,
  comentario_conductor text default '',
  comentario_pasajero text default '',
  calif_enviada_48h boolean not null default false,
  created_at timestamptz not null default now(),
  constraint reservas_autos_pkey primary key (id),
  constraint reservas_autos_token_key unique (token),
  constraint reservas_autos_estado_check check (estado = any (array['Pendiente'::text, 'Aceptada'::text, 'Rechazada'::text, 'Cancelada'::text])),
  constraint reservas_autos_id_viaje_dni_pasajero_key unique (id_viaje, dni_pasajero),
  constraint reservas_autos_id_viaje_fkey foreign key (id_viaje) references public.viajes_autos (id) on delete cascade
);

create index idx_reservas_autos_estado on public.reservas_autos using btree (estado);
create index idx_reservas_autos_dni on public.reservas_autos using btree (dni_pasajero);

create table public.reservas_bondi (
  id uuid not null default gen_random_uuid(),
  nombre_titular text not null,
  dni_titular text not null,
  email text not null,
  socio boolean not null default false,
  num_socio text default '',
  telefono text not null,
  tel_emergencia text default '-',
  localidad text not null,
  filial text not null default 'Capital Federal',
  cant_adultos integer not null default 0,
  cant_menores integer not null default 0,
  monto_total numeric not null default 0,
  comprobante_url text default '',
  created_at timestamptz not null default now(),
  metodo_pago text not null default 'transferencia',
  estado_pago text not null default 'pendiente',
  mp_payment_id text,
  mp_preference_id text,
  cupo_confirmado boolean not null default false,
  nota_admin text not null default '',
  constraint reservas_bondi_pkey primary key (id),
  constraint reservas_bondi_estado_pago_check check (estado_pago = any (array['pendiente'::text, 'pagado'::text, 'rechazado'::text])),
  constraint reservas_bondi_filial_check check (filial = any (array['Capital Federal'::text, 'Buenos Aires'::text])),
  constraint reservas_bondi_metodo_pago_check check (metodo_pago = any (array['transferencia'::text, 'mercadopago'::text]))
);

create index idx_reservas_bondi_dni on public.reservas_bondi using btree (dni_titular);

create table public.reservas_bondi_pasajeros (
  id uuid not null default gen_random_uuid(),
  reserva_id uuid not null,
  nombre text not null,
  dni text not null,
  es_menor boolean not null default false,
  fecha_nacimiento date,
  parada text not null default '',
  email text not null default '',
  telefono text not null default '',
  tel_emergencia text not null default '-',
  localidad text not null default '',
  socio boolean not null default false,
  num_socio text not null default '',
  constraint reservas_bondi_pasajeros_pkey primary key (id),
  constraint reservas_bondi_pasajeros_dni_key unique (dni),
  constraint reservas_bondi_pasajeros_reserva_id_fkey foreign key (reserva_id) references public.reservas_bondi (id) on delete cascade
);

create index idx_reservas_bondi_pasajeros_reserva on public.reservas_bondi_pasajeros using btree (reserva_id);
