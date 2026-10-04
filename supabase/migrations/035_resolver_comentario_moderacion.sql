-- ============================================================
-- resolver_comentario_moderacion(): un moderador resuelve un
-- comentario REPORTADO, ya sea mantenerlo (reportado -> activo)
-- o eliminarlo (reportado -> eliminado).
--
-- Contrato:
--   * Exito  -> devuelve EXACTAMENTE una fila (id, estado).
--   * Fallo  -> lanza una excepcion con un codigo estable en el
--               mensaje; nunca devuelve 0 filas. Asi la ruta de
--               Next.js puede distinguir los casos y .single()
--               nunca recibe un resultado vacio.
--
--   NO_AUTORIZADO            quien llama no es supervisor/administrador
--   ESTADO_INVALIDO          p_estado no es 'activo' ni 'eliminado'
--   COMENTARIO_NO_ENCONTRADO el id no existe
--   COMENTARIO_NO_REPORTADO  existe pero ya no esta 'reportado'
--                            (otro moderador lo resolvio, doble clic,
--                            o se intento actuar sobre uno activo)
--
-- Notas de diseno:
--   * El UPDATE condicionado a estado = 'reportado' es una operacion
--     atomica de "comparar y cambiar": si dos moderadores resuelven
--     a la vez, uno gana y el otro recibe COMENTARIO_NO_REPORTADO.
--   * Las columnas de salida (id, estado) son variables dentro de
--     plpgsql; por eso todas las referencias a columnas van
--     calificadas con alias. Sin eso, "where id = ..." falla con
--     "column reference "id" is ambiguous".
--   * Al MANTENER se borran los reportes del comentario: el contador
--     de registrar_reporte() cuenta todas las filas de reportes, asi
--     que si quedaran, el siguiente reporte lo volveria a marcar
--     'reportado' de inmediato. (Es el mismo criterio que usa la
--     moderacion de documentos.) Al ELIMINAR se conservan como
--     historial.
--   * No se toca updated_at: esa columna significa "el autor edito
--     su comentario" (la actualiza comentar_documento).
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
     and c.estado = 'reportado'
  returning c.id, c.estado into v_id, v_estado;

  if not found then
    if exists (select 1 from public.comentarios as c where c.id = p_comentario_id) then
      raise exception 'COMENTARIO_NO_REPORTADO';
    end if;
    raise exception 'COMENTARIO_NO_ENCONTRADO';
  end if;

  if p_estado = 'activo' then
    delete from public.reportes as r
     where r.comentario_id = p_comentario_id;
  end if;

  return query select v_id, v_estado;
end;
$$;

-- Solo usuarios con sesion pueden ejecutarla (y dentro se exige rol
-- de moderador). Mismo patron que las funciones de 028.
revoke execute on function public.resolver_comentario_moderacion(uuid, text)
  from public, anon;
grant execute on function public.resolver_comentario_moderacion(uuid, text)
  to authenticated;