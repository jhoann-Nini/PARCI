-- ============================================================
-- FIX SEGURIDAD: los reportes anónimos no se deduplicaban.
--
-- Causa: usuario_id queda NULL para reportes anónimos, y en un
-- unique index normal NULL nunca es igual a NULL — así que el
-- índice (documento_id, usuario_id) nunca bloqueaba reportes
-- anónimos repetidos. Cualquiera sin sesión podía llamar
-- registrar_reporte() 3 veces seguidas contra el mismo documento
-- y auto-ocultarlo (estado -> 'reportado'), sin límite de tasa.
--
-- Solución: mismo patrón que ya usan votos/comentarios — un
-- anon_id (uuid persistido en cookie/localStorage del cliente) que
-- sí se puede indexar de forma única por documento/comentario.
-- No es antifraude fuerte (se evade borrando cookies), pero cierra
-- el abuso trivial de un solo clic repetido / script simple, igual
-- que ya se acepta como suficiente para votos.
-- ============================================================

alter table public.reportes
  add column anon_id uuid;

alter table public.reportes
  add constraint reportes_autor_check check (
    (usuario_id is not null and anon_id is null) or
    (usuario_id is null and anon_id is not null)
  );

-- Un reporte por anon_id por documento / por comentario (índices
-- parciales, mismo criterio que ya existe para usuario_id).
create unique index reportes_documento_anon_key
  on public.reportes (documento_id, anon_id)
  where documento_id is not null and anon_id is not null;

create unique index reportes_comentario_anon_key
  on public.reportes (comentario_id, anon_id)
  where comentario_id is not null and anon_id is not null;

-- Reemplaza la policy de insert anónimo (009_reportar_documento.sql)
-- para exigir anon_id en vez de aceptar cualquier reporte anónimo.
drop policy if exists "Reportes: reporte anónimo permitido" on public.reportes;
create policy "Reportes: reporte anónimo permitido"
  on public.reportes for insert
  with check (auth.uid() is null and usuario_id is null and anon_id is not null);

-- registrar_reporte(): ahora acepta p_anon_id y lo usa tanto para
-- el insert como para el conteo de "reportes distintos" (antes el
-- conteo global de filas ya estaba bien porque cuenta filas, no
-- autores distintos — eso no cambia; lo que cambia es que ahora sí
-- se bloquea el reporte repetido del mismo anon_id).
drop function if exists public.registrar_reporte(uuid, text, uuid);

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
    insert into public.reportes (documento_id, comentario_id, usuario_id, anon_id, motivo)
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
      update public.documentos set estado = 'reportado' where documentos.id = p_documento_id;
    end if;
  end if;

  return query select v_id, false;
end;
$$;
