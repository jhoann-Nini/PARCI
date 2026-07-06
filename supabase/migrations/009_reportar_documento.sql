-- ============================================================
-- REPORTAR DOCUMENTO — habilita el botón "Reportar" de la UI.
--
-- 1) Reporte anónimo permitido, igual que la subida anónima de
--    documentos: usuario_id queda en null cuando no hay sesión.
--
-- 2) registrar_reporte(): antes, /api/reportes hacía el insert y
--    luego un `select count(*) from reportes` para decidir si el
--    documento pasa a 'reportado' con 3+ reportes. Ese count corre
--    bajo RLS, y no existe (ni existía) ninguna policy de select en
--    reportes para un usuario normal — solo para moderadores. El
--    conteo devolvía 0 siempre y el auto-flag nunca se disparaba.
--    Esta función, security definer, hace insert + conteo + flag en
--    una sola operación atómica que no depende de RLS para leer.
-- ============================================================

create policy "Reportes: reporte anónimo permitido"
  on public.reportes for insert
  with check (auth.uid() is null and usuario_id is null);

create or replace function public.registrar_reporte(
  p_documento_id uuid,
  p_motivo text
)
returns table (id uuid, ya_reportado boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    uuid;
  v_count int;
begin
  begin
    insert into public.reportes (documento_id, usuario_id, motivo)
    values (p_documento_id, auth.uid(), p_motivo)
    returning reportes.id into v_id;
  exception when unique_violation then
    return query select null::uuid, true;
    return;
  end;

  select count(*) into v_count
  from public.reportes
  where documento_id = p_documento_id;

  if v_count >= 3 then
    update public.documentos set estado = 'reportado' where documentos.id = p_documento_id;
  end if;

  return query select v_id, false;
end;
$$;
