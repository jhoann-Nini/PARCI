-- ============================================================
-- VOTOS "me sirvió" + COMENTARIOS cortos por documento.
--
-- Mismo patrón anónimo/logueado que ya existe para subir un
-- documento y para reportar (usuario_id nullable = anónimo), pero
-- acá además necesitamos deduplicar por dispositivo anónimo, así
-- que sumamos anon_id: un uuid generado en el cliente (cookie +
-- localStorage) que identifica al visitante sin cuenta. No es un
-- mecanismo de seguridad — igual que la subida anónima, confiamos
-- en el valor que manda el cliente — solo evita doble voto/spam
-- básico desde la misma sesión de navegador.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- VOTOS
-- ────────────────────────────────────────────────────────────
create table public.votos (
  id           uuid primary key default uuid_generate_v4(),
  documento_id uuid not null references public.documentos (id) on delete cascade,
  usuario_id   uuid references public.perfiles (id) on delete cascade,
  anon_id      uuid,
  created_at   timestamptz not null default now(),
  constraint votos_autor_check check (
    (usuario_id is not null and anon_id is null) or
    (usuario_id is null and anon_id is not null)
  )
);

-- Un voto por usuario_id por documento, y uno por anon_id por documento
-- (índices parciales porque usuario_id/anon_id son mutuamente excluyentes
-- y NULL no se compara como igual a NULL en un unique constraint normal).
create unique index votos_documento_usuario_key
  on public.votos (documento_id, usuario_id) where usuario_id is not null;
create unique index votos_documento_anon_key
  on public.votos (documento_id, anon_id) where anon_id is not null;
create index votos_documento_idx on public.votos (documento_id);

alter table public.votos enable row level security;

create policy "Votos: lectura pública"
  on public.votos for select using (true);

create policy "Votos: usuario autenticado vota"
  on public.votos for insert
  with check (auth.uid() is not null and usuario_id = auth.uid() and anon_id is null);

create policy "Votos: anónimo vota"
  on public.votos for insert
  with check (auth.uid() is null and usuario_id is null and anon_id is not null);

-- ────────────────────────────────────────────────────────────
-- COMENTARIOS
-- ────────────────────────────────────────────────────────────
create table public.comentarios (
  id           uuid primary key default uuid_generate_v4(),
  documento_id uuid not null references public.documentos (id) on delete cascade,
  usuario_id   uuid references public.perfiles (id) on delete cascade,
  anon_id      uuid,
  contenido    text not null check (char_length(contenido) between 1 and 500),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint comentarios_autor_check check (
    (usuario_id is not null and anon_id is null) or
    (usuario_id is null and anon_id is not null)
  )
);

-- Un comentario por usuario_id/anon_id por documento — la app resuelve
-- "corregir mi comentario" como un upsert sobre este mismo índice
-- (ver comentar_documento más abajo), no como una fila nueva.
create unique index comentarios_documento_usuario_key
  on public.comentarios (documento_id, usuario_id) where usuario_id is not null;
create unique index comentarios_documento_anon_key
  on public.comentarios (documento_id, anon_id) where anon_id is not null;
create index comentarios_documento_idx on public.comentarios (documento_id, created_at asc);

alter table public.comentarios enable row level security;

create policy "Comentarios: lectura pública"
  on public.comentarios for select using (true);

create policy "Comentarios: usuario autenticado escribe el suyo"
  on public.comentarios for insert
  with check (auth.uid() is not null and usuario_id = auth.uid() and anon_id is null);

create policy "Comentarios: anónimo escribe el suyo"
  on public.comentarios for insert
  with check (auth.uid() is null and usuario_id is null and anon_id is not null);

create policy "Comentarios: usuario autenticado edita el suyo"
  on public.comentarios for update
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- REPORTES — extender para poder reportar un comentario, no solo
-- un documento. Un reporte referencia documento_id O comentario_id,
-- nunca ambos (documento_id pasa a ser nullable).
-- ────────────────────────────────────────────────────────────
alter table public.reportes
  add column comentario_id uuid references public.comentarios (id) on delete cascade;

alter table public.reportes
  alter column documento_id drop not null;

alter table public.reportes
  add constraint reportes_objetivo_check check (
    (documento_id is not null and comentario_id is null) or
    (documento_id is null and comentario_id is not null)
  );

-- Un reporte por usuario_id por comentario (mismo criterio que ya
-- existía para documento_id vía el unique inline de 001_initial_schema).
create unique index reportes_comentario_usuario_key
  on public.reportes (comentario_id, usuario_id)
  where comentario_id is not null and usuario_id is not null;

create index reportes_comentario_idx on public.reportes (comentario_id);

-- Las policies de insert de reportes (009_reportar_documento.sql) ya
-- no distinguen documento_id de comentario_id — solo validan quién
-- es el autor — así que valen tal cual para reportes de comentario.

-- ────────────────────────────────────────────────────────────
-- registrar_reporte(): generalizada para aceptar documento_id O
-- comentario_id. El auto-flag a estado 'reportado' con 3+ reportes
-- sigue existiendo solo para documentos (comentarios no tiene
-- columna estado; moderar comentarios reportados queda para una
-- iteración futura de la cola de moderación).
-- ────────────────────────────────────────────────────────────
drop function if exists public.registrar_reporte(uuid, text);

create or replace function public.registrar_reporte(
  p_documento_id  uuid default null,
  p_motivo        text default null,
  p_comentario_id uuid default null
)
returns table (id uuid, ya_reportado boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    uuid;
  v_count int;
begin
  if (p_documento_id is null) = (p_comentario_id is null) then
    raise exception 'Debes indicar exactamente uno: documento_id o comentario_id';
  end if;

  begin
    insert into public.reportes (documento_id, comentario_id, usuario_id, motivo)
    values (p_documento_id, p_comentario_id, auth.uid(), p_motivo)
    returning reportes.id into v_id;
  exception when unique_violation then
    return query select null::uuid, true;
    return;
  end;

  if p_documento_id is not null then
    select count(*) into v_count
    from public.reportes
    where documento_id = p_documento_id;

    if v_count >= 3 then
      update public.documentos set estado = 'reportado' where documentos.id = p_documento_id;
    end if;
  end if;

  return query select v_id, false;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- votar_documento(): inserta el voto (logueado usa auth.uid(),
-- anónimo usa p_anon_id) y devuelve el conteo actualizado + si
-- ya existía. Atómica y no depende de que el cliente pueda leer
-- la tabla para contar (aunque acá sí hay policy de select pública).
-- ────────────────────────────────────────────────────────────
create or replace function public.votar_documento(
  p_documento_id uuid,
  p_anon_id      uuid default null
)
returns table (votos_count int, ya_voto boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  begin
    if v_uid is not null then
      insert into public.votos (documento_id, usuario_id)
      values (p_documento_id, v_uid);
    else
      if p_anon_id is null then
        raise exception 'anon_id requerido para votar sin sesión';
      end if;
      insert into public.votos (documento_id, anon_id)
      values (p_documento_id, p_anon_id);
    end if;
  exception when unique_violation then
    return query select count(*)::int, true from public.votos v where v.documento_id = p_documento_id;
    return;
  end;

  return query select count(*)::int, false from public.votos v where v.documento_id = p_documento_id;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- comentar_documento(): upsert sobre el índice único
-- (documento_id, usuario_id|anon_id) — si ya existe un comentario
-- del mismo autor en ese documento, lo actualiza en vez de crear
-- uno nuevo (así se implementa "editar mi comentario").
-- ────────────────────────────────────────────────────────────
create or replace function public.comentar_documento(
  p_documento_id uuid,
  p_contenido    text,
  p_anon_id      uuid default null
)
returns public.comentarios
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.comentarios;
begin
  if v_uid is null and p_anon_id is null then
    raise exception 'anon_id requerido para comentar sin sesión';
  end if;

  if v_uid is not null then
    insert into public.comentarios (documento_id, usuario_id, contenido)
    values (p_documento_id, v_uid, trim(p_contenido))
    on conflict (documento_id, usuario_id) where usuario_id is not null
    do update set contenido = excluded.contenido, updated_at = now()
    returning * into v_row;
  else
    insert into public.comentarios (documento_id, anon_id, contenido)
    values (p_documento_id, p_anon_id, trim(p_contenido))
    on conflict (documento_id, anon_id) where anon_id is not null
    do update set contenido = excluded.contenido, updated_at = now()
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- obtener_comentarios(): trae el listado plano de un documento con
-- el nombre del autor ya resuelto (perfiles tiene RLS que solo deja
-- ver el propio perfil, así que el join hay que hacerlo acá adentro,
-- security definer, en vez de desde el cliente). No expone anon_id
-- de otros visitantes — el cliente reconoce "mi" comentario anónimo
-- comparando es_propio, calculado server-side contra p_anon_id.
-- ────────────────────────────────────────────────────────────
create or replace function public.obtener_comentarios(
  p_documento_id uuid,
  p_anon_id      uuid default null
)
returns table (
  id            uuid,
  contenido     text,
  created_at    timestamptz,
  updated_at    timestamptz,
  nombre_autor  text,
  es_propio     boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.contenido,
    c.created_at,
    c.updated_at,
    p.nombre as nombre_autor,
    (
      (c.usuario_id is not null and c.usuario_id = auth.uid())
      or (c.anon_id is not null and p_anon_id is not null and c.anon_id = p_anon_id)
    ) as es_propio
  from public.comentarios c
  left join public.perfiles p on p.id = c.usuario_id
  where c.documento_id = p_documento_id
  order by c.created_at asc;
$$;

-- ────────────────────────────────────────────────────────────
-- buscar_documentos(): se le suman votos_count/comentarios_count
-- (para las tarjetas y para ordenar), ya_voto (para pintar el botón
-- ya votado desde el primer render) y p_orden ('recientes' | 'utiles').
-- ────────────────────────────────────────────────────────────
drop function if exists public.buscar_documentos(text, uuid, uuid, uuid, text, text, int, int);

create or replace function public.buscar_documentos(
  p_query        text    default null,
  p_carrera_id   uuid    default null,
  p_materia_id   uuid    default null,
  p_profesor_id  uuid    default null,
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
  semestre          text,
  materia_id        uuid,
  materia_nombre    text,
  profesor_id       uuid,
  profesor_nombre   text,
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
    o.semestre,
    m.id            as materia_id,
    m.nombre        as materia_nombre,
    p.id            as profesor_id,
    p.nombre        as profesor_nombre,
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
  join public.profesores p on p.id = o.profesor_id
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
    and (p_profesor_id is null or p.id = p_profesor_id)
    and (p_semestre    is null or o.semestre = p_semestre)
    and (p_corte       is null or d.corte = p_corte)
    and (
      p_query is null
      or m.nombre ilike '%' || p_query || '%'
      or p.nombre ilike '%' || p_query || '%'
      or c.nombre ilike '%' || p_query || '%'
    )
  order by
    case when p_orden = 'utiles' then coalesce(v.votos_count, 0) end desc nulls last,
    d.fecha_subida desc
  limit  p_limit
  offset p_offset;
$$;
