-- Reglas centralizadas para moderacion de comentarios.
-- Las palabras se pueden agregar/quitar sin modificar comentar_documento().

create table if not exists public.palabras_prohibidas_comentarios (
  palabra text primary key,
  activa boolean not null default true
);

insert into public.palabras_prohibidas_comentarios (palabra)
values
  ('mierda'),
  ('hijueputa'),
  ('hijo de puta'),
  ('marica'),
  ('malparido'),
  ('malparida'),
  ('verga')
on conflict (palabra) do update
set activa = true;

alter table public.palabras_prohibidas_comentarios enable row level security;

create or replace function public.comentario_contiene_palabra_prohibida(
  p_contenido text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_palabra text;
begin
  for v_palabra in
    select palabra
    from public.palabras_prohibidas_comentarios
    where activa = true
  loop
    if p_contenido ~* ('(^|[^[:alnum:]_])' || regexp_replace(v_palabra, '([\\.^$|()\\[\\]{}*+?])', '\\\1', 'g') || '([^[:alnum:]_]|$)') then
      return true;
    end if;
  end loop;

  return false;
end;
$$;

grant execute on function public.comentario_contiene_palabra_prohibida(text)
to anon, authenticated;

create or replace function public.comentar_documento(
  p_documento_id uuid,
  p_contenido text,
  p_anon_id uuid default null
)
returns public.comentarios
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.comentarios;
  v_contenido text := trim(p_contenido);
  v_contenido_prohibido boolean;
  v_spam boolean;
begin
  if v_uid is null and p_anon_id is null then
    raise exception 'anon_id requerido para comentar sin sesión';
  end if;

  v_contenido_prohibido :=
    public.comentario_contiene_palabra_prohibida(v_contenido);

  v_spam :=
    (
      select count(*)
      from regexp_matches(
        v_contenido,
        'https?://[^[:space:]]+',
        'gi'
      )
    ) >= 2;

  if v_contenido_prohibido then
    raise exception 'COMENTARIO_PROHIBIDO';
  end if;

  if v_spam then
    raise exception 'COMENTARIO_SPAM';
  end if;

  if v_uid is not null then
    insert into public.comentarios (
      documento_id,
      usuario_id,
      contenido,
      estado
    )
    values (
      p_documento_id,
      v_uid,
      v_contenido,
      'activo'
    )
    on conflict (documento_id, usuario_id) where usuario_id is not null
    do update set
      contenido = excluded.contenido,
      updated_at = now(),
      estado = 'activo'
    returning * into v_row;
  else
    insert into public.comentarios (
      documento_id,
      anon_id,
      contenido,
      estado
    )
    values (
      p_documento_id,
      p_anon_id,
      v_contenido,
      'activo'
    )
    on conflict (documento_id, anon_id) where anon_id is not null
    do update set
      contenido = excluded.contenido,
      updated_at = now(),
      estado = 'activo'
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

grant execute on function public.comentar_documento(uuid, text, uuid)
to anon, authenticated;
