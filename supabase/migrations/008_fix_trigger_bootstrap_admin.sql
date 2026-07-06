-- ============================================================
-- FIX: el trigger anti-autoascenso (evitar_autoascenso_rol, de
-- 006_roles.sql) bloqueaba también las ediciones legítimas hechas
-- fuera de la app (Table Editor, SQL Editor, service_role,
-- migraciones): en esos contextos auth.uid() es null, igual que
-- para un usuario sin sesión, y is_admin() con auth.uid() null
-- siempre da false. Resultado: no había forma de asignar el
-- primer rol de administrador del sistema.
--
-- Fix: el guardado solo debe aplicar cuando SÍ hay una sesión real
-- de Supabase Auth (auth.uid() no nulo) — es decir, cuando el
-- cambio viene de la app, a través de PostgREST, con un usuario
-- autenticado editando su propia fila. Fuera de ese contexto
-- (dashboard, SQL directo, service_role) no hace falta el
-- guardado: esos accesos ya bypassean RLS o son de por sí
-- administrativos y confiables.
-- ============================================================

create or replace function public.evitar_autoascenso_rol()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.rol is distinct from old.rol
     and auth.uid() is not null
     and not public.is_admin() then
    new.rol := old.rol;
  end if;
  return new;
end;
$$;
