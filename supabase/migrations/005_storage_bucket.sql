-- ============================================================
-- STORAGE BUCKET — bucket público 'documentos' para los PDFs
-- subidos desde /api/documentos (POST). Ya ejecutado a mano en el
-- panel de Supabase; este archivo lo deja versionado en el repo.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', true)
on conflict (id) do nothing;

create policy "Storage documentos: lectura pública"
  on storage.objects for select using (bucket_id = 'documentos');

create policy "Storage documentos: subida autenticada"
  on storage.objects for insert
  with check (bucket_id = 'documentos' and auth.uid() is not null);

create policy "Storage documentos: subida anónima"
  on storage.objects for insert
  with check (bucket_id = 'documentos');

create policy "Storage documentos: solo admin elimina"
  on storage.objects for delete
  using (bucket_id = 'documentos' and public.is_admin());
