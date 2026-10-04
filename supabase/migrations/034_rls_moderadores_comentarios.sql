-- ============================================================
-- RLS DE LECTURA PARA MODERACION DE COMENTARIOS
-- Permite a supervisores y administradores consultar todos los
-- comentarios desde el panel de moderacion.
-- ============================================================

create policy "Comentarios: moderadores ven todos"
  on public.comentarios
  for select
  using (public.is_moderador());
