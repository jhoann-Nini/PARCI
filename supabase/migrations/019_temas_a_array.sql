-- ============================================================
-- TEMAS COMO ARREGLO DE ETIQUETAS — reemplaza el texto libre de
-- 017_temas_documentos.sql por un text[] de palabras/frases cortas
-- (tags), para que la UI pueda mostrarlos como burbujas individuales
-- y sugerir autocompletado en vez de depender de un separador ",".
--
-- Migra los documentos que ya tengan `temas` cargado como texto
-- ("grafos, árboles binarios, recursividad") partiéndolo por coma,
-- recortando espacios y descartando fragmentos vacíos.
-- ============================================================

alter table public.documentos add column temas_tags text[];

update public.documentos d
set temas_tags = (
  select array_agg(distinct trim(tag))
  from unnest(string_to_array(d.temas, ',')) as tag
  where trim(tag) <> ''
)
where d.temas is not null;

alter table public.documentos drop column temas;
alter table public.documentos rename column temas_tags to temas;

-- Tope de 8 temas por documento (la UI ya lo limita; esto es cinturón
-- y tirantes para inserts directos que no pasen por el formulario).
alter table public.documentos
  add constraint documentos_temas_max_check
  check (temas is null or array_length(temas, 1) <= 8);

-- Recrear buscar_documentos(): mismo shape que 017, pero `temas`
-- ahora es text[] y la búsqueda libre revisa cada elemento del arreglo.
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
  archivo_url       text,
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
    d.archivo_url,
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

-- ────────────────────────────────────────────────────────────
-- sugerencias_temas(): temas ya usados en otros documentos de la
-- misma materia, para autocompletar y reducir duplicados tipo
-- "arboles" / "árboles" / "arbol binario" al subir un nuevo parcial.
-- ────────────────────────────────────────────────────────────
create or replace function public.sugerencias_temas(p_materia_id uuid)
returns table (tema text)
language sql
stable
as $$
  select distinct tema
  from public.documentos d
  join public.ofertas o on o.id = d.oferta_id
  cross join lateral unnest(d.temas) as tema
  where o.materia_id = p_materia_id
    and d.estado = 'activo'
  order by tema;
$$;
