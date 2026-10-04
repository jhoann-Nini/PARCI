-- B5.2.2: eliminar policy obsoleta de subida anónima
-- La API /api/documentos requiere usuario autenticado.

drop policy if exists "Documentos: subida anónima permitida"
on public.documentos;