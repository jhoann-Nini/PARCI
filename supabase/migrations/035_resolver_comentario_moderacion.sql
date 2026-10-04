-- ============================================================
-- RESOLUCION DE COMENTARIOS EN MODERACION
-- Permite a supervisores y administradores resolver comentarios
-- reportados sin darles UPDATE general sobre la tabla.
-- ============================================================

create or replace function public.resolver_comentario_moderacion(
  p_comentario_id uuid,
  p_estado text
)
returns table (
  id uuid,
  estado text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_moderador() then
    raise exception 'No autorizado';
  end if;

  if p_estado not in ('activo', 'eliminado') then
    raise exception 'Estado de resolución inválido';
  end if;

  return query
  update public.comentarios
  set
    estado = p_estado,
    updated_at = now()
  where id = p_comentario_id
    and estado = 'reportado'
  returning comentarios.id, comentarios.estado;
end;
$$;

revoke execute on function public.resolver_comentario_moderacion(uuid, text)
from public, anon;

grant execute on function public.resolver_comentario_moderacion(uuid, text)
to authenticated;
