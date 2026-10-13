insert into public.configuracion (id) values (1) on conflict (id) do nothing;
insert into public.info_bondi (id) values (1) on conflict (id) do nothing;
insert into public.bondi_meta (id) values (1) on conflict (id) do nothing;
insert into public.bondi_config (id, pin) values (1, 'cambiar-este-pin') on conflict (id) do nothing;

insert into storage.buckets (id, name, public) values ('comprobantes', 'comprobantes', false) on conflict (id) do nothing;
