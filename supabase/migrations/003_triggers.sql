-- ============================================================
-- TRIGGER: Crear perfil automáticamente al registrarse
-- Cuando Supabase Auth crea un usuario nuevo, se crea su fila en perfiles.
-- ============================================================
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
    'estudiante'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- FUNCIÓN: Búsqueda de documentos con joins completos
-- Usada desde API routes para evitar joins anidados repetitivos.
-- ============================================================
create or replace function public.buscar_documentos(
  p_query        text    default null,
  p_carrera_id   uuid    default null,
  p_materia_id   uuid    default null,
  p_profesor_id  uuid    default null,
  p_semestre     text    default null,
  p_corte        text    default null,
  p_limit        int     default 20,
  p_offset       int     default 0
)
returns table (
  id            uuid,
  tipo          text,
  corte         text,
  archivo_url   text,
  subido_por    uuid,
  fecha_subida  date,
  semestre      text,
  materia_id    uuid,
  materia_nombre text,
  profesor_id   uuid,
  profesor_nombre text,
  carrera_id    uuid,
  carrera_nombre text,
  carrera_color  text
)
language sql
stable
as $$
  select
    d.id,
    d.tipo,
    d.corte,
    d.archivo_url,
    d.subido_por,
    d.fecha_subida,
    o.semestre,
    m.id            as materia_id,
    m.nombre        as materia_nombre,
    p.id            as profesor_id,
    p.nombre        as profesor_nombre,
    c.id            as carrera_id,
    c.nombre        as carrera_nombre,
    c.color         as carrera_color
  from public.documentos d
  join public.ofertas    o on o.id = d.oferta_id
  join public.materias   m on m.id = o.materia_id
  join public.profesores p on p.id = o.profesor_id
  join public.carreras   c on c.id = m.carrera_id
  where
    d.estado = 'activo'
    and (p_carrera_id  is null or c.id = p_carrera_id)
    and (p_materia_id  is null or m.id = p_materia_id)
    and (p_profesor_id is null or p.id = p_profesor_id)
    and (p_semestre    is null or o.semestre = p_semestre)
    and (p_corte       is null or d.corte = p_corte)
    and (
      p_query is null
      or m.nombre ilike '%' || p_query || '%'
      or p.nombre ilike '%' || p_query || '%'
      or c.nombre ilike '%' || p_query || '%'
    )
  order by d.fecha_subida desc
  limit  p_limit
  offset p_offset;
$$;
