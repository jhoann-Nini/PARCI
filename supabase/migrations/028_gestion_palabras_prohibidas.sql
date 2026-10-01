-- Gestion de palabras prohibidas y normalizacion de reglas de moderacion.
-- Esta migracion complementa 027 y deja en GitHub el estado actual de Supabase.

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
  v_contenido_normalizado text;
begin
  v_contenido_normalizado :=
    lower(
      regexp_replace(
        p_contenido,
        '[^[:alnum:]_]+',
        ' ',
        'g'
      )
    );

  for v_palabra in
    select p.palabra
    from public.palabras_prohibidas_comentarios as p
    where p.activa = true
  loop
    if position(
      ' ' || lower(v_palabra) || ' '
      in ' ' || v_contenido_normalizado || ' '
    ) > 0 then
      return true;
    end if;
  end loop;

  return false;
end;
$$;

grant execute on function public.comentario_contiene_palabra_prohibida(text)
to anon, authenticated;

create or replace function public.listar_palabras_prohibidas()
returns table (
  palabra text,
  activa boolean
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_moderador() then
    raise exception 'No autorizado';
  end if;

  return query
  select p.palabra, p.activa
  from public.palabras_prohibidas_comentarios as p
  order by p.palabra asc;
end;
$$;

create or replace function public.agregar_palabra_prohibida(
  p_palabra text
)
returns table (
  palabra text,
  activa boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_palabra text;
begin
  if not public.is_moderador() then
    raise exception 'No autorizado';
  end if;

  v_palabra := lower(trim(p_palabra));

  if v_palabra = '' then
    raise exception 'La palabra no puede estar vacía';
  end if;

  if exists (
    select 1
    from public.palabras_prohibidas_comentarios as p
    where p.palabra = v_palabra
  ) then
    update public.palabras_prohibidas_comentarios as p
    set activa = true
    where p.palabra = v_palabra;
  else
    insert into public.palabras_prohibidas_comentarios (palabra, activa)
    values (v_palabra, true);
  end if;

  return query
  select p.palabra, p.activa
  from public.palabras_prohibidas_comentarios as p
  where p.palabra = v_palabra;
end;
$$;

create or replace function public.cambiar_estado_palabra_prohibida(
  p_palabra text,
  p_activa boolean
)
returns table (
  palabra text,
  activa boolean
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_moderador() then
    raise exception 'No autorizado';
  end if;

  return query
  update public.palabras_prohibidas_comentarios as p
  set activa = p_activa
  where p.palabra = lower(trim(p_palabra))
  returning p.palabra, p.activa;
end;
$$;

create or replace function public.eliminar_palabra_prohibida(
  p_palabra text
)
returns table (
  palabra text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_moderador() then
    raise exception 'No autorizado';
  end if;

  return query
  delete from public.palabras_prohibidas_comentarios as p
  where p.palabra = lower(trim(p_palabra))
  returning p.palabra;
end;
$$;

revoke execute on function public.listar_palabras_prohibidas()
from public, anon;
revoke execute on function public.agregar_palabra_prohibida(text)
from public, anon;
revoke execute on function public.cambiar_estado_palabra_prohibida(text, boolean)
from public, anon;
revoke execute on function public.eliminar_palabra_prohibida(text)
from public, anon;

grant execute on function public.listar_palabras_prohibidas()
to authenticated;
grant execute on function public.agregar_palabra_prohibida(text)
to authenticated;
grant execute on function public.cambiar_estado_palabra_prohibida(text, boolean)
to authenticated;
grant execute on function public.eliminar_palabra_prohibida(text)
to authenticated;
