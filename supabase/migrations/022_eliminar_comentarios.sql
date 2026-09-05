-- Permite eliminar únicamente el comentario propio.
-- Para comentarios anónimos se usa el anon_id de la misma sesión.
create or replace function public.eliminar_comentario(
  p_comentario_id uuid,
  p_anon_id uuid default null
)
returns table (eliminado boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_usuario uuid;
  v_anon uuid;
begin
  select usuario_id, anon_id into v_usuario, v_anon
  from public.comentarios
  where id = p_comentario_id;

  if not found then
    return query select false;
    return;
  end if;

  if v_uid is not null then
    if v_usuario is distinct from v_uid then
      return query select false;
      return;
    end if;
  else
    if v_anon is null or p_anon_id is null or v_anon is distinct from p_anon_id then
      return query select false;
      return;
    end if;
  end if;

  delete from public.comentarios where id = p_comentario_id;
  return query select true;
end;
$$;

grant execute on function public.eliminar_comentario(uuid, uuid) to anon, authenticated;
