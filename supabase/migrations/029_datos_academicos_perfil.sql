-- Datos académicos del perfil: carrera y semestre.

alter table public.perfiles
  add column if not exists semestre smallint;

alter table public.perfiles
  drop constraint if exists perfiles_semestre_check;

alter table public.perfiles
  add constraint perfiles_semestre_check
  check (semestre between 1 and 10);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_carrera_id uuid;
  v_semestre smallint;
begin
  if coalesce(new.raw_user_meta_data->>'carrera_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    v_carrera_id := (new.raw_user_meta_data->>'carrera_id')::uuid;
  end if;

  if coalesce(new.raw_user_meta_data->>'semestre', '') ~ '^[1-9]|10$' then
    v_semestre := (new.raw_user_meta_data->>'semestre')::smallint;
  end if;

  insert into public.perfiles (
    id,
    correo_institucional,
    nombre,
    carrera_id,
    semestre,
    rol
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    v_carrera_id,
    v_semestre,
    'estudiante'
  );

  return new;
end;
$$;
