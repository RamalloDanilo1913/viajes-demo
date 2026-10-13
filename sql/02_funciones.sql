CREATE OR REPLACE FUNCTION public.actualizar_estado_pago_mp(p_reserva_id uuid, p_estado text, p_payment_id text, p_preference_id text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
declare
  v_total int;
  v_estado_anterior text;
  v_cupo_confirmado_anterior boolean;
  v_cupo_ok boolean := true;
begin
  select cant_adultos + cant_menores, estado_pago, cupo_confirmado
  into v_total, v_estado_anterior, v_cupo_confirmado_anterior
  from reservas_bondi
  where id = p_reserva_id;

  if p_estado = 'pagado' and v_estado_anterior is distinct from 'pagado' then
    -- Pasa a pagado: intentamos descontar el cupo.
    update info_bondi
    set cupos_disponibles = cupos_disponibles - v_total
    where id = 1 and cupos_disponibles >= v_total;
    v_cupo_ok := found;
  elsif p_estado is distinct from 'pagado' and v_estado_anterior = 'pagado' and v_cupo_confirmado_anterior then
    -- Sale de pagado y el cupo estaba confirmado: se lo devolvemos.
    update info_bondi set cupos_disponibles = cupos_disponibles + v_total where id = 1;
    v_cupo_ok := false;
  else
    -- Sin cambio real de estado, o pagado->pagado, o nunca tuvo el cupo
    -- confirmado: dejamos cupo_confirmado como estaba.
    v_cupo_ok := v_cupo_confirmado_anterior;
  end if;

  update reservas_bondi
  set estado_pago = p_estado,
      mp_payment_id = p_payment_id,
      mp_preference_id = coalesce(p_preference_id, mp_preference_id),
      cupo_confirmado = v_cupo_ok
  where id = p_reserva_id;

  return v_cupo_ok;
end;
$function$;


CREATE OR REPLACE FUNCTION public.bondi_check(p_pin text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (select 1 from bondi_config where pin = p_pin) then
    raise exception 'PIN incorrecto' using errcode = '28000';
  end if;
end $function$;


CREATE OR REPLACE FUNCTION public.bondi_add_extra(p_pin text, p_texto text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform bondi_check(p_pin);
  if length(trim(coalesce(p_texto,''))) > 0 then
    insert into bondi_extras (texto) values (left(trim(p_texto), 120));
  end if;
end $function$;


CREATE OR REPLACE FUNCTION public.bondi_add_pasajero(p_pin text, p_data jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare base int;
begin
  perform bondi_check(p_pin);
  if length(trim(coalesce(p_data->>'nombre',''))) = 0 then
    raise exception 'Falta el nombre';
  end if;
  select coalesce(max(orden), 0) + 1 into base from bondi_pasajeros;
  insert into bondi_pasajeros (orden, nombre, menor, dni, telefono, parada, pago, falta, comentario, subio, manual)
  values (base, left(trim(p_data->>'nombre'), 120),
          coalesce((p_data->>'menor')::boolean, false),
          left(coalesce(p_data->>'dni',''), 20), left(coalesce(p_data->>'telefono',''), 30),
          left(coalesce(nullif(trim(p_data->>'parada'),''), 'Sin parada'), 80),
          case when p_data->>'pago' = 'D' then 'D' else 'P' end,
          coalesce((p_data->>'falta')::int, 0),
          left(coalesce(p_data->>'comentario',''), 200),
          coalesce((p_data->>'subio')::boolean, false), true);
end $function$;


CREATE OR REPLACE FUNCTION public.bondi_append(p_pin text, p_pasajeros jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare base int;
begin
  perform bondi_check(p_pin);
  if jsonb_typeof(p_pasajeros) <> 'array' or jsonb_array_length(p_pasajeros) > 300 then
    raise exception 'Lista invalida';
  end if;
  select coalesce(max(orden), 0) into base from bondi_pasajeros;
  insert into bondi_pasajeros (orden, nombre, menor, dni, telefono, parada, pago, falta, comentario)
  select base + (x->>'orden')::int, x->>'nombre', coalesce((x->>'menor')::boolean, false),
         x->>'dni', x->>'telefono', x->>'parada',
         case when x->>'pago' = 'D' then 'D' else 'P' end,
         coalesce((x->>'falta')::int, 0), x->>'comentario'
  from jsonb_array_elements(p_pasajeros) x
  where not exists (select 1 from bondi_pasajeros b where b.dni = x->>'dni');
end $function$;


CREATE OR REPLACE FUNCTION public.bondi_clear(p_pin text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform bondi_check(p_pin);
  delete from bondi_pasajeros where true;
  delete from bondi_extras where true;
  update bondi_meta set titulo = null, destino = null, salida = null, lugar = null, total_pdf = null where id = 1;
end $function$;


CREATE OR REPLACE FUNCTION public.bondi_del_extra(p_pin text, p_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform bondi_check(p_pin);
  delete from bondi_extras where id = p_id;
end $function$;


CREATE OR REPLACE FUNCTION public.bondi_del_pasajero(p_pin text, p_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform bondi_check(p_pin);
  delete from bondi_pasajeros where id = p_id and manual;
end $function$;


CREATE OR REPLACE FUNCTION public.bondi_get(p_pin text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform bondi_check(p_pin);
  return jsonb_build_object(
    'meta', coalesce((select to_jsonb(m) from bondi_meta m where m.id = 1), '{}'::jsonb),
    'pasajeros', coalesce((select jsonb_agg(to_jsonb(p) order by p.orden) from bondi_pasajeros p), '[]'::jsonb),
    'extras', coalesce((select jsonb_agg(to_jsonb(e) order by e.id) from bondi_extras e), '[]'::jsonb)
  );
end $function$;


CREATE OR REPLACE FUNCTION public.bondi_load(p_pin text, p_meta jsonb, p_pasajeros jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform bondi_check(p_pin);
  if jsonb_typeof(p_pasajeros) <> 'array' or jsonb_array_length(p_pasajeros) > 300 then
    raise exception 'Lista invalida';
  end if;
  create temp table _old on commit drop as
    select dni, subio, cobrado, nota from bondi_pasajeros where not manual;
  delete from bondi_pasajeros where not manual;
  insert into bondi_pasajeros (orden, nombre, menor, dni, telefono, parada, pago, falta, comentario, subio, cobrado, nota)
  select (x->>'orden')::int, x->>'nombre', coalesce((x->>'menor')::boolean, false),
         x->>'dni', x->>'telefono', x->>'parada',
         case when x->>'pago' = 'D' then 'D' else 'P' end,
         coalesce((x->>'falta')::int, 0), x->>'comentario',
         coalesce(o.subio, false), coalesce(o.cobrado, false), coalesce(o.nota, '')
  from jsonb_array_elements(p_pasajeros) x
  left join lateral (select * from _old where _old.dni = x->>'dni' limit 1) o on true;
  update bondi_meta set
    titulo = p_meta->>'titulo', destino = p_meta->>'destino',
    salida = p_meta->>'salida', lugar = p_meta->>'lugar',
    total_pdf = nullif(p_meta->>'total_pdf','')::int
  where id = 1;
end $function$;


CREATE OR REPLACE FUNCTION public.bondi_update(p_pin text, p_id bigint, p_patch jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform bondi_check(p_pin);
  update bondi_pasajeros set
    subio    = case when p_patch ? 'subio'    then (p_patch->>'subio')::boolean   else subio end,
    cobrado  = case when p_patch ? 'cobrado'  then (p_patch->>'cobrado')::boolean else cobrado end,
    nota     = case when p_patch ? 'nota'     then left(coalesce(p_patch->>'nota',''), 500) else nota end,
    parada   = case when p_patch ? 'parada'   then left(coalesce(nullif(trim(p_patch->>'parada'),''), 'Sin parada'), 80) else parada end,
    updated_at = now()
  where id = p_id;
end $function$;


CREATE OR REPLACE FUNCTION public.crear_reserva_bondi(p_nombre_titular text, p_dni_titular text, p_email text, p_socio boolean, p_num_socio text, p_telefono text, p_tel_emergencia text, p_localidad text, p_filial text, p_pasajeros jsonb, p_comprobante_url text)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
declare
  v_precio_adulto numeric;
  v_precio_menor numeric;
  v_cant_adultos int := 0;
  v_cant_menores int := 0;
  v_total int;
  v_monto numeric;
  v_reserva_id uuid;
  v_p jsonb;
begin
  select precio_adulto, precio_menor into v_precio_adulto, v_precio_menor
  from info_bondi where id = 1;

  v_total := jsonb_array_length(p_pasajeros);
  if v_total = 0 then
    raise exception 'SIN_PASAJEROS';
  end if;

  for v_p in select * from jsonb_array_elements(p_pasajeros) loop
    if (v_p->>'es_menor')::boolean then
      v_cant_menores := v_cant_menores + 1;
    else
      v_cant_adultos := v_cant_adultos + 1;
    end if;
  end loop;

  v_monto := (v_cant_adultos * coalesce(v_precio_adulto, 0)) + (v_cant_menores * coalesce(v_precio_menor, 0));

  -- Descuento atómico: si no alcanzan los cupos, "not found" y abortamos.
  update info_bondi
  set cupos_disponibles = cupos_disponibles - v_total
  where id = 1 and cupos_disponibles >= v_total;
  if not found then
    raise exception 'SIN_CUPOS';
  end if;

  insert into reservas_bondi (
    nombre_titular, dni_titular, email, socio, num_socio, telefono,
    tel_emergencia, localidad, filial, cant_adultos, cant_menores, monto_total, comprobante_url
  ) values (
    p_nombre_titular, p_dni_titular, p_email, p_socio, p_num_socio, p_telefono,
    p_tel_emergencia, p_localidad, p_filial, v_cant_adultos, v_cant_menores, v_monto, p_comprobante_url
  ) returning id into v_reserva_id;

  insert into reservas_bondi_pasajeros (reserva_id, nombre, dni, es_menor)
  select v_reserva_id, (p->>'nombre'), (p->>'dni'), (p->>'es_menor')::boolean
  from jsonb_array_elements(p_pasajeros) p;

  return v_reserva_id;
exception
  when unique_violation then
    raise exception 'DNI_DUPLICADO';
end;
$function$;


CREATE OR REPLACE FUNCTION public.crear_reserva_bondi(p_filial text, p_pasajeros jsonb, p_comprobante_url text, p_metodo_pago text DEFAULT 'transferencia'::text, p_recargo_pct numeric DEFAULT 0)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
declare
  v_precio_adulto numeric;
  v_precio_menor numeric;
  v_cant_adultos int := 0;
  v_cant_menores int := 0;
  v_total int;
  v_monto numeric;
  v_reserva_id uuid;
  v_p jsonb;
  v_titular jsonb;
  v_cupo_ok boolean := false;
begin
  select precio_adulto, precio_menor into v_precio_adulto, v_precio_menor
  from info_bondi where id = 1;

  v_total := jsonb_array_length(p_pasajeros);
  if v_total = 0 then
    raise exception 'SIN_PASAJEROS';
  end if;

  v_titular := p_pasajeros->0;

  for v_p in select * from jsonb_array_elements(p_pasajeros) loop
    if (v_p->>'es_menor')::boolean then
      v_cant_menores := v_cant_menores + 1;
    else
      v_cant_adultos := v_cant_adultos + 1;
    end if;
  end loop;

  v_monto := (v_cant_adultos * coalesce(v_precio_adulto, 0)) + (v_cant_menores * coalesce(v_precio_menor, 0));

  if p_metodo_pago = 'mercadopago' then
    -- Solo validamos que haya lugar; no lo tomamos todavía.
    perform 1 from info_bondi where id = 1 and cupos_disponibles >= v_total;
    if not found then
      raise exception 'SIN_CUPOS';
    end if;

    if p_recargo_pct > 0 then
      v_monto := round(v_monto * (1 + p_recargo_pct / 100));
    end if;
  else
    -- Transferencia: comportamiento de siempre, se descuenta ya.
    update info_bondi
    set cupos_disponibles = cupos_disponibles - v_total
    where id = 1 and cupos_disponibles >= v_total;
    if not found then
      raise exception 'SIN_CUPOS';
    end if;
    v_cupo_ok := true;
  end if;

  insert into reservas_bondi (
    nombre_titular, dni_titular, email, socio, num_socio, telefono,
    tel_emergencia, localidad, filial, cant_adultos, cant_menores, monto_total,
    comprobante_url, metodo_pago, cupo_confirmado
  ) values (
    v_titular->>'nombre', v_titular->>'dni', coalesce(v_titular->>'email', ''),
    coalesce((v_titular->>'socio')::boolean, false), coalesce(v_titular->>'num_socio', ''),
    coalesce(v_titular->>'telefono', ''), coalesce(v_titular->>'tel_emergencia', '-'), coalesce(v_titular->>'localidad', ''),
    p_filial, v_cant_adultos, v_cant_menores, v_monto, p_comprobante_url,
    coalesce(p_metodo_pago, 'transferencia'), v_cupo_ok
  ) returning id into v_reserva_id;

  insert into reservas_bondi_pasajeros (reserva_id, nombre, dni, es_menor, fecha_nacimiento, parada, email, telefono, tel_emergencia, localidad, socio, num_socio)
  select
    v_reserva_id,
    (p->>'nombre'), (p->>'dni'), (p->>'es_menor')::boolean,
    nullif(p->>'fecha_nacimiento', '')::date,
    coalesce(p->>'parada', ''),
    coalesce(p->>'email', ''), coalesce(p->>'telefono', ''), coalesce(p->>'tel_emergencia', '-'), coalesce(p->>'localidad', ''),
    coalesce((p->>'socio')::boolean, false), coalesce(p->>'num_socio', '')
  from jsonb_array_elements(p_pasajeros) p;

  return v_reserva_id;
exception
  when unique_violation then
    raise exception 'DNI_DUPLICADO';
end;
$function$;


CREATE OR REPLACE FUNCTION public.descontar_cupo_auto(p_id_viaje uuid)
 RETURNS viajes_autos
 LANGUAGE plpgsql
AS $function$
declare
  v_fila viajes_autos;
begin
  update viajes_autos
  set cupos = cupos - 1
  where id = p_id_viaje and cupos > 0
  returning * into v_fila;
  return v_fila; -- null si ya no quedaban cupos
end;
$function$;


CREATE OR REPLACE FUNCTION public.expirar_reservas_mercadopago_pendientes(p_minutos integer DEFAULT 30)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
declare
  v_cantidad int;
begin
  delete from reservas_bondi
  where metodo_pago = 'mercadopago'
    and estado_pago = 'pendiente'
    and created_at < now() - (p_minutos || ' minutes')::interval;
  get diagnostics v_cantidad = row_count;
  return v_cantidad;
end;
$function$;
