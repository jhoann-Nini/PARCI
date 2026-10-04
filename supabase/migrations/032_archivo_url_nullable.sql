-- ============================================================
-- MIGRACIÓN: archivo_url deja de ser obligatorio
-- ============================================================
--
-- Los documentos usan Storage privado y archivo_path como referencia
-- interna. archivo_url queda como columna histórica/legacy y ya no
-- debe contener una URL pública.
-- ============================================================

alter table public.documentos
  alter column archivo_url drop not null;
