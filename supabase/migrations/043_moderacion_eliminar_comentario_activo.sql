-- ============================================================
-- resolver_comentario_moderacion(): amplia las transiciones.
--
-- Antes (031): solo reportado -> activo | eliminado.
-- Ahora un moderador tambien puede eliminar un comentario ACTIVO
-- que nadie reporto (contenido abusivo detectado por el propio
-- moderador).
--
-- Transiciones permitidas (todo lo demas -> COMENTARIO_TRANSICION_INVALIDA):
--   reportado -> activo       "Mantener"  (borra los reportes del comentario)
--   reportado -> eliminado    "Eliminar"  (conserva los reportes)
--   activo    -> eliminado    "Eliminar"  (conserva los reportes, si hay)
--   eliminado -> *            no permitido (un eliminado no se restaura aqui)
--
-- El UPDATE sigue siendo una operacion atomica de comparar y cambiar:
-- si dos moderadores actuan a la vez, uno gana y el otro recibe
-- COMENTARIO_TRANSICION_INVALIDA (409 en la ruta).
--
-- Errores (mensaje de la excepcion):
--   NO_AUTORIZADO | ESTADO_INVALIDO | COMENTARIO_NO_ENCONTRADO |
--   COMENTARIO_TRANSICION_INVALIDA
-- ============================================================

drop function if exists public.resolver_comentario_moderacion(uuid, text);

create function public.resolver_comentario_moderacion(
  p_comentario_id uuid,
  p_estado        text
)
returns table (
  id     uuid,
  estado text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id     uuid;
  v_estado text;
begin
  if not public.is_moderador() then
    raise exception 'NO_AUTORIZADO';
  end if;

  if p_estado is null or p_estado not in ('activo', 'eliminado') then
    raise exception 'ESTADO_INVALIDO';
  end if;

  update public.comentarios as c
     set estado = p_estado
   where c.id = p_comentario_id
     and (
          (p_estado = 'activo'    and c.estado = 'reportado')
       or (p_estado = 'eliminado' and c.estado in ('reportado', 'activo'))
     )
  returning c.id, c.estado into v_id, v_estado;

  if not found then
    if exists (select 1 from public.comentarios as c where c.id = p_comentario_id) then
      raise exception 'COMENTARIO_TRANSICION_INVALIDA';
    end if;
    raise exception 'COMENTARIO_NO_ENCONTRADO';
  end if;

  -- Mantener = descartar los reportes, para que el siguiente reporte
  -- no lo vuelva a ocultar de inmediato (registrar_reporte cuenta todas
  -- las filas de reportes).
  if p_estado = 'activo' then
    delete from public.reportes as r
     where r.comentario_id = p_comentario_id;
  end if;

  return query select v_id, v_estado;
end;
$$;

revoke execute on function public.resolver_comentario_moderacion(uuid, text)
  from public, anon;
grant execute on function public.resolver_comentario_moderacion(uuid, text)
  to authenticated;