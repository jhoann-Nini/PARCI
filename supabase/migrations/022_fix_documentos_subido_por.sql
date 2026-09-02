drop policy if exists "Documentos: usuario autenticado puede subir" on public.documentos;

create policy "Documentos: usuario autenticado puede subir"
  on public.documentos for insert
  with check (auth.uid() is not null and subido_por = auth.uid());