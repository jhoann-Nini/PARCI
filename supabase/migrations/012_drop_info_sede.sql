-- ============================================================
-- Se saca del alcance la funcionalidad de "info de sede"
-- (biblioteca, bienestar, admisiones, contacto, mapa) — no se va a
-- construir en esta fase. Se elimina la tabla info_sede junto con
-- sus políticas RLS e índice (caen automáticamente al hacer drop
-- de la tabla).
--
-- sedes se deja intacta: carreras.sede_id sigue colgando de ahí y
-- se necesita si en el futuro se expande a otras sedes.
-- ============================================================

drop table if exists public.info_sede;
