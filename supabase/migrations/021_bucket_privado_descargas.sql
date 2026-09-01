-- ============================================================
-- FIX SEGURIDAD: el bucket 'documentos' era público y su URL se
-- devolvía en buscar_documentos() (usada por GET /api/documentos,
-- el buscador público). Cualquiera podía leer archivo_url del
-- JSON de búsqueda y descargar el PDF directo, sin pasar nunca
-- por registrar_descarga() — el límite de "2 gratis" era cosmético,
-- no un control de acceso real.
--
-- Solución:
--   1) Bucket pasa a privado.
--   2) Se guarda la ruta interna del objeto (archivo_path) además
--      de la URL pública vieja (archivo_url, que ya no sirve para
--      nada público — queda solo como referencia histórica /
--      para uso de moderadores, que ya tienen acceso total a la
--      tabla vía RLS).
--   3) buscar_documentos() deja de devolver archivo_url: el
--      público ya no puede llegar al archivo sin pasar por la
--      API, que ahora emitirá una signed URL de corta duración
--      SOLO si registrar_descarga() aprueba (ver cambio en
--      /api/descargas en el código de la app).
-- ============================================================

-- 1) Bucket privado
update storage.buckets set public = false where id = 'documentos';

-- Ya no tiene sentido una policy de lectura pública sobre un
-- bucket privado (nadie sin service_role puede leer igual), pero
-- la quitamos explícitamente para que quede claro en el historial
-- de policies que la lectura pública está cerrada.
drop policy if exists "Storage documentos: lectura pública" on storage.objects;

-- 2) Ruta interna del objeto, separada de la URL pública histórica
alter table public.documentos add column archivo_path text;

-- Backfill: la URL pública tiene forma
-- https://.../storage/v1/object/public/documentos/<path>
update public.documentos
set archivo_path = regexp_replace(archivo_url, '^.*/object/public/documentos/', '')
where archivo_path is null;

alter table public.documentos alter column archivo_path set not null;

-- 3) buscar_documentos(): mismo shape que 019, pero sin archivo_url
-- (así el buscador público nunca vuelve a filtrar la ruta del archivo).
drop function if exists public.buscar_documentos(text, uuid, uuid, text, text, text, uuid, int, int);

create or replace function public.buscar_documentos(
  p_query        text    default null,
  p_carrera_id   uuid    default null,
  p_materia_id   uuid    default null,
  p_semestre     text    default null,
  p_corte        text    default null,
  p_orden        text    default 'recientes',
  p_anon_id      uuid    default null,
  p_limit        int     default 20,
  p_offset       int     default 0
)
returns table (
  id                uuid,
  tipo              text,
  corte             text,
  subido_por        uuid,
  fecha_subida      date,
  temas             text[],
  semestre          text,
  materia_id        uuid,
  materia_nombre    text,
  carrera_id        uuid,
  carrera_nombre    text,
  carrera_color     text,
  votos_count       int,
  comentarios_count int,
  ya_voto           boolean
)
language sql
stable
as $$
  select
    d.id,
    d.tipo,
    d.corte,
    d.subido_por,
    d.fecha_subida,
    d.temas,
    o.semestre,
    m.id            as materia_id,
    m.nombre        as materia_nombre,
    c.id            as carrera_id,
    c.nombre        as carrera_nombre,
    c.color         as carrera_color,
    coalesce(v.votos_count, 0)::int       as votos_count,
    coalesce(cm.comentarios_count, 0)::int as comentarios_count,
    exists (
      select 1 from public.votos v2
      where v2.documento_id = d.id
        and (
          (auth.uid() is not null and v2.usuario_id = auth.uid())
          or (p_anon_id is not null and v2.anon_id = p_anon_id)
        )
    ) as ya_voto
  from public.documentos d
  join public.ofertas    o on o.id = d.oferta_id
  join public.materias   m on m.id = o.materia_id
  join public.carreras   c on c.id = m.carrera_id
  left join (
    select documento_id, count(*) as votos_count
    from public.votos
    group by documento_id
  ) v on v.documento_id = d.id
  left join (
    select documento_id, count(*) as comentarios_count
    from public.comentarios
    group by documento_id
  ) cm on cm.documento_id = d.id
  where
    d.estado = 'activo'
    and (p_carrera_id  is null or c.id = p_carrera_id)
    and (p_materia_id  is null or m.id = p_materia_id)
    and (p_semestre    is null or o.semestre = p_semestre)
    and (p_corte       is null or d.corte = p_corte)
    and (
      p_query is null
      or m.nombre ilike '%' || p_query || '%'
      or c.nombre ilike '%' || p_query || '%'
      or exists (
        select 1 from unnest(d.temas) as tema
        where tema ilike '%' || p_query || '%'
      )
    )
  order by
    case when p_orden = 'utiles' then coalesce(v.votos_count, 0) end desc nulls last,
    d.fecha_subida desc
  limit  p_limit
  offset p_offset;
$$;
