-- ============================================================
-- SEGURIDAD: cerrar subida anónima al Storage de documentos
-- ============================================================
--
-- El bucket "documentos" es privado desde 021_bucket_privado_descargas.sql.
-- La política histórica "subida anónima" permitía crear objetos en
-- Storage aunque el usuario no estuviera autenticado.
--
-- La tabla public.documentos ya exige autenticación mediante
-- 022_fix_documentos_subido_por.sql. Esta migración alinea Storage
-- con esa misma regla para evitar archivos huérfanos.
-- ============================================================

drop policy if exists "Storage documentos: subida anónima"
on storage.objects;

drop policy if exists "Storage documentos: subida autenticada"
on storage.objects;

create policy "Storage documentos: subida autenticada"
  on storage.objects for insert
  with check (
    bucket_id = 'documentos'
    and auth.uid() is not null
  );
