-- ============================================================
-- ROLES: usuario | supervisor | administrador
--
-- Reemplaza el esquema anterior (estudiante, egresado, admin):
--   estudiante, egresado → usuario (ya no se distinguen)
--   admin                → administrador
--   supervisor es nuevo: modera reportes y documentos
--   (puede ver/gestionar reportes y cambiar el estado de un
--   documento — activo/reportado/eliminado — pero no toca
--   carreras, materias, profesores, sedes ni info_sede, y no
--   administra los roles de otros usuarios).
-- ============================================================

-- Migrar datos existentes antes de cambiar el constraint
update public.perfiles set rol = 'usuario'       where rol in ('estudiante', 'egresado');
update public.perfiles set rol = 'administrador' where rol = 'admin';

do $$
declare
  c_name text;
begin
  select conname into c_name
  from pg_constraint
  where conrelid = 'public.perfiles'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%rol%';

  if c_name is not null then
    execute format('alter table public.perfiles drop constraint %I', c_name);
  end if;
end $$;

alter table public.perfiles
  add constraint perfiles_rol_check
  check (rol in ('usuario', 'supervisor', 'administrador'));
alter table public.perfiles alter column rol set default 'usuario';

-- El perfil de un usuario nuevo nace como 'usuario'
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfiles (id, correo_institucional, nombre, rol)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    'usuario'
  );
  return new;
end;
$$;

-- is_admin() ahora chequea 'administrador'
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'administrador'
  );
$$;

-- Nuevo helper: administrador o supervisor (moderación)
create or replace function public.is_moderador()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol in ('administrador', 'supervisor')
  );
$$;

-- ────────────────────────────────────────────────────────────
-- DOCUMENTOS — supervisor también modera (ve todos, cambia estado)
-- ────────────────────────────────────────────────────────────
drop policy if exists "Documentos: admin ve todos" on public.documentos;
create policy "Documentos: moderadores ven todos"
  on public.documentos for select
  using (public.is_moderador());

drop policy if exists "Documentos: admin puede actualizar estado" on public.documentos;
create policy "Documentos: moderadores actualizan estado"
  on public.documentos for update
  using (public.is_moderador());

-- ────────────────────────────────────────────────────────────
-- REPORTES — supervisor también los ve, para poder moderar
-- ────────────────────────────────────────────────────────────
drop policy if exists "Reportes: admin ve todos" on public.reportes;
create policy "Reportes: moderadores ven todos"
  on public.reportes for select
  using (public.is_moderador());

-- ────────────────────────────────────────────────────────────
-- PERFILES — un administrador puede gestionar cualquier perfil
-- (para asignar rol de supervisor, por ejemplo). Sin esto no
-- existía ninguna vía dentro de RLS para cambiar el rol de otro
-- usuario, solo la propia fila.
-- ────────────────────────────────────────────────────────────
create policy "Perfiles: admin actualiza cualquiera"
  on public.perfiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- Nadie puede auto-ascenderse de rol al editar su propio perfil:
-- si quien edita no es administrador, el cambio de rol se revierte.
create or replace function public.evitar_autoascenso_rol()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.rol is distinct from old.rol and not public.is_admin() then
    new.rol := old.rol;
  end if;
  return new;
end;
$$;

drop trigger if exists perfiles_evitar_autoascenso_rol on public.perfiles;
create trigger perfiles_evitar_autoascenso_rol
  before update on public.perfiles
  for each row execute procedure public.evitar_autoascenso_rol();
