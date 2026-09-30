-- ============================================================
-- MODERACION DE COMENTARIOS
-- Agrega estado para poder distinguir comentarios visibles,
-- reportados y eliminados sin borrar inmediatamente su registro.
-- ============================================================

alter table public.comentarios
  add column estado text not null default 'activo';

alter table public.comentarios
  add constraint comentarios_estado_check
  check (estado in ('activo', 'reportado', 'eliminado'));

create index comentarios_documento_estado_idx
  on public.comentarios (documento_id, estado, created_at asc);

-- Los comentarios eliminados o reportados dejan de aparecer en
-- el listado público. El registro permanece para moderación.
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
    and c.estado = 'activo'
  order by c.created_at asc;
$$;

grant execute on function public.obtener_comentarios(uuid, uuid) to anon, authenticated;

-- Reportar un comentario tres veces hace que pase a 'reportado'.
-- No se elimina físicamente: queda disponible para la moderación.
create or replace function public.registrar_reporte(
  p_documento_id  uuid default null,
  p_motivo        text default null,
  p_comentario_id uuid default null,
  p_anon_id       uuid default null
)
returns table (id uuid, ya_reportado boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    uuid;
  v_count int;
  v_uid   uuid := auth.uid();
begin
  if (p_documento_id is null) = (p_comentario_id is null) then
    raise exception 'Debes indicar exactamente uno: documento_id o comentario_id';
  end if;

  if v_uid is null and p_anon_id is null then
    raise exception 'anon_id requerido para reportar sin sesión';
  end if;

  begin
    insert into public.reportes (
      documento_id,
      comentario_id,
      usuario_id,
      anon_id,
      motivo
    )
    values (
      p_documento_id,
      p_comentario_id,
      v_uid,
      case when v_uid is null then p_anon_id else null end,
      p_motivo
    )
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
      update public.documentos
      set estado = 'reportado'
      where documentos.id = p_documento_id;
    end if;
  else
    select count(*) into v_count
    from public.reportes
    where comentario_id = p_comentario_id;

    if v_count >= 3 then
      update public.comentarios
      set estado = 'reportado'
      where comentarios.id = p_comentario_id
        and comentarios.estado = 'activo';
    end if;
  end if;

  return query select v_id, false;
end;
$$;

grant execute on function public.registrar_reporte(uuid, text, uuid, uuid) to anon, authenticated;
