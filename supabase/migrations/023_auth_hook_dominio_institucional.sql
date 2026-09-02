create or replace function public.hook_verificar_dominio_institucional(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  v_email  text;
  v_dominio text := 'correounivalle.edu.co';
begin
  v_email := event->'user'->>'email';

  if v_email is null then
    return '{}'::jsonb;
  end if;

  if lower(split_part(v_email, '@', 2)) <> v_dominio then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 400,
        'message', format('Solo se aceptan correos @%s', v_dominio)
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

grant execute on function public.hook_verificar_dominio_institucional to supabase_auth_admin;
revoke execute on function public.hook_verificar_dominio_institucional from authenticated, anon, public;