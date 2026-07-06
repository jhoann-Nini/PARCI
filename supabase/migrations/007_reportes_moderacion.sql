-- ============================================================
-- REPORTES — permitir que un moderador (supervisor/administrador)
-- limpie la cola de reportes una vez que revisó un documento
-- (lo aprueba o lo elimina). Antes no existía ninguna policy de
-- delete sobre reportes, así que la interfaz de moderación no
-- podía descartar reportes ya atendidos.
-- ============================================================

create policy "Reportes: moderadores eliminan"
  on public.reportes for delete
  using (public.is_moderador());
