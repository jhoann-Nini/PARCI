-- ============================================================
-- RESTRINGIR UPDATE DIRECTO DE COMENTARIOS
-- Las modificaciones deben pasar por funciones controladas:
--   - comentar_documento() para el autor
--   - resolver_comentario_moderacion() para moderadores
-- Esto evita que un cliente modifique directamente el estado.
-- ============================================================

revoke update on table public.comentarios from anon, authenticated;
