-- ============================================================
-- LÍMITE DE DESCARGAS GRATUITAS — cualquier visitante (logueado o
-- anónimo vía anon_id, mismo patrón que votos/comentarios) puede
-- descargar hasta 2 documentos distintos gratis. Para el tercero,
-- necesita haber subido al menos un documento propio; a partir de
-- ahí, descargas ilimitadas para siempre.
--
-- Nota: subir un documento hoy requiere sesión en la UI (la subida
-- anónima solo existe a nivel de API, sin exponer en pantalla), así
-- que "haber subido" solo se evalúa contra usuario_id — un visitante
-- anónimo no puede desbloquear el límite sin crear cuenta.
-- ============================================================

create table public.descargas (
  id           uuid primary key default uuid_generate_v4(),
  documento_id uuid not null references public.documentos (id) on delete cascade,
  usuario_id   uuid references public.perfiles (id) on delete cascade,
  anon_id      uuid,
  created_at   timestamptz not null default now(),
  constraint descargas_autor_check check (
    (usuario_id is not null and anon_id is null) or
    (usuario_id is null and anon_id is not null)
  )
);

-- Una fila por autor por documento: descargar el mismo documento de
-- nuevo no debe sumar al conteo de "documentos distintos descargados".
create unique index descargas_documento_usuario_key
  on public.descargas (documento_id, usuario_id) where usuario_id is not null;
create unique index descargas_documento_anon_key
  on public.descargas (documento_id, anon_id) where anon_id is not null;

-- Para contar cuántos documentos distintos descargó un autor.
create index descargas_usuario_idx on public.descargas (usuario_id) where usuario_id is not null;
create index descargas_anon_idx    on public.descargas (anon_id)    where anon_id is not null;

alter table public.descargas enable row level security;

-- Sin policies de select/insert para roles de cliente: todo el
-- acceso pasa por registrar_descarga() (security definer), igual
-- que registrar_reporte() con la tabla reportes.

-- ────────────────────────────────────────────────────────────
-- registrar_descarga(): valida el límite y registra la descarga
-- en una sola operación atómica. Devuelve permitido = false sin
-- insertar nada cuando corresponde bloquear.
-- ────────────────────────────────────────────────────────────
create or replace function public.registrar_descarga(
  p_documento_id uuid,
  p_anon_id      uuid default null
)
returns table (permitido boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_ya        boolean;
  v_distintos int;
  v_subio     boolean;
begin
  if v_uid is null and p_anon_id is null then
    raise exception 'anon_id requerido para descargar sin sesión';
  end if;

  -- Si ya había descargado este mismo documento, siempre se permite
  -- (no vuelve a contar) y no hace falta insertar de nuevo.
  select exists (
    select 1 from public.descargas d
    where d.documento_id = p_documento_id
      and (
        (v_uid is not null and d.usuario_id = v_uid)
        or (v_uid is null and d.anon_id = p_anon_id)
      )
  ) into v_ya;

  if v_ya then
    return query select true;
    return;
  end if;

  select count(*) into v_distintos
  from public.descargas d
  where
    (v_uid is not null and d.usuario_id = v_uid)
    or (v_uid is null and d.anon_id = p_anon_id);

  v_subio := v_uid is not null and exists (
    select 1 from public.documentos where subido_por = v_uid
  );

  if v_distintos < 2 or v_subio then
    if v_uid is not null then
      insert into public.descargas (documento_id, usuario_id) values (p_documento_id, v_uid);
    else
      insert into public.descargas (documento_id, anon_id) values (p_documento_id, p_anon_id);
    end if;
    return query select true;
  else
    return query select false;
  end if;
end;
$$;
