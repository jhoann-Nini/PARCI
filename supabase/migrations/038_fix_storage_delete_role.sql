-- B4: unificar permisos de eliminación de Storage
-- Usa la misma regla que comentarios y moderación:
-- administrador y supervisor pueden gestionar archivos.

drop policy if exists "Storage documentos: solo admin elimina"
on storage.objects;

create policy "Storage documentos: solo moderadores eliminan"
on storage.objects
for delete
to public
using (
  bucket_id = 'documentos'
  and public.is_moderador()
);