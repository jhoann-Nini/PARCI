-- Moderacion automatica de comentarios.
-- Los casos detectados se conservan, pero quedan ocultos con estado 'reportado'.

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
  v_contenido text := trim(p_contenido);
  v_requiere_moderacion boolean;
begin
  if v_uid is null and p_anon_id is null then
    raise exception 'anon_id requerido para comentar sin sesión';
  end if;

  v_requiere_moderacion :=
    v_contenido ~* '\m(mierda|hijueputa|hijo de puta|marica|malparido|malparida|verga)\M'
    or (select count(*) from regexp_matches(v_contenido, 'https?://[^[:space:]]+', 'gi')) >= 2;

  if v_uid is not null then
    insert into public.comentarios (documento_id, usuario_id, contenido, estado)
    values (
      p_documento_id,
      v_uid,
      v_contenido,
      case when v_requiere_moderacion then 'reportado' else 'activo' end
    )
    on conflict (documento_id, usuario_id) where usuario_id is not null
    do update set
      contenido = excluded.contenido,
      updated_at = now(),
      estado = case when v_requiere_moderacion then 'reportado' else 'activo' end
    returning * into v_row;
  else
    insert into public.comentarios (documento_id, anon_id, contenido, estado)
    values (
      p_documento_id,
      p_anon_id,
      v_contenido,
      case when v_requiere_moderacion then 'reportado' else 'activo' end
    )
    on conflict (documento_id, anon_id) where anon_id is not null
    do update set
      contenido = excluded.contenido,
      updated_at = now(),
      estado = case when v_requiere_moderacion then 'reportado' else 'activo' end
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

grant execute on function public.comentar_documento(uuid, text, uuid)
to anon, authenticated;
