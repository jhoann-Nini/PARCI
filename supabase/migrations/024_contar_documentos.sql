-- ============================================================
-- contar_documentos(): mismo criterio de filtrado que
-- buscar_documentos() (019_temas_a_array.sql), pero devuelve solo
-- el total — se usa para el contador de cada sección de carrera en
-- la página de inicio ("Ingeniería · 86"), sin traer todas las
-- filas.
-- ============================================================

create or replace function public.contar_documentos(
  p_query      text default null,
  p_carrera_id uuid default null,
  p_materia_id uuid default null,
  p_semestre   text default null,
  p_corte      text default null
)
returns bigint
language sql
stable
as $$
  select count(*)
  from public.documentos d
  join public.ofertas    o on o.id = d.oferta_id
  join public.materias   m on m.id = o.materia_id
  join public.carreras   c on c.id = m.carrera_id
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
    );
$$;
