-- ============================================================
-- FIX: reportes.usuario_id era NOT NULL, a diferencia de
-- documentos.subido_por (que sí es nullable para subida anónima).
-- Esto bloqueaba cualquier reporte anónimo con un error de
-- constraint, aunque la policy de RLS ya lo permitía desde
-- 009_reportar_documento.sql.
-- ============================================================

alter table public.reportes alter column usuario_id drop not null;
