-- ============================================================
-- ROW LEVEL SECURITY — Parci
-- Principio: lectura pública para contenido activo,
--            escritura restringida al dueño o admin.
-- ============================================================

-- Habilitar RLS en todas las tablas
alter table public.sedes        enable row level security;
alter table public.carreras     enable row level security;
alter table public.perfiles     enable row level security;
alter table public.materias     enable row level security;
alter table public.profesores   enable row level security;
alter table public.ofertas      enable row level security;
alter table public.documentos   enable row level security;
alter table public.info_sede    enable row level security;
alter table public.reportes     enable row level security;

-- ────────────────────────────────────────────────────────────
-- SEDES — lectura pública, escritura solo admin
-- ────────────────────────────────────────────────────────────
create policy "Sedes: lectura pública"
  on public.sedes for select using (true);

create policy "Sedes: solo admin puede modificar"
  on public.sedes for all
  using (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────
-- CARRERAS — lectura pública, escritura solo admin
-- ────────────────────────────────────────────────────────────
create policy "Carreras: lectura pública"
  on public.carreras for select using (true);

create policy "Carreras: solo admin puede modificar"
  on public.carreras for all
  using (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────
-- PERFILES — cada usuario ve y edita solo el suyo; admin ve todos
-- ────────────────────────────────────────────────────────────
create policy "Perfiles: ver el propio"
  on public.perfiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from public.perfiles p
      where p.id = auth.uid() and p.rol = 'admin'
    )
  );

create policy "Perfiles: insertar el propio"
  on public.perfiles for insert
  with check (id = auth.uid());

create policy "Perfiles: actualizar el propio"
  on public.perfiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- MATERIAS — lectura pública, escritura solo admin
-- ────────────────────────────────────────────────────────────
create policy "Materias: lectura pública"
  on public.materias for select using (true);

create policy "Materias: solo admin puede modificar"
  on public.materias for all
  using (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────
-- PROFESORES — lectura pública, cualquier usuario autenticado puede crear
-- (para agregar un profesor nuevo al subir un documento)
-- ────────────────────────────────────────────────────────────
create policy "Profesores: lectura pública"
  on public.profesores for select using (true);

create policy "Profesores: usuario autenticado puede crear"
  on public.profesores for insert
  with check (auth.uid() is not null);

create policy "Profesores: solo admin puede modificar o eliminar"
  on public.profesores for update using (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );

create policy "Profesores: solo admin puede eliminar"
  on public.profesores for delete using (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────
-- OFERTAS — lectura pública, usuario autenticado puede crear
-- ────────────────────────────────────────────────────────────
create policy "Ofertas: lectura pública"
  on public.ofertas for select using (true);

create policy "Ofertas: usuario autenticado puede crear"
  on public.ofertas for insert
  with check (auth.uid() is not null);

-- ────────────────────────────────────────────────────────────
-- DOCUMENTOS — lectura pública si estado = 'activo'
--              inserción: usuarios autenticados o anónimos con token especial
--              eliminación/cambio de estado: propio usuario o admin
-- ────────────────────────────────────────────────────────────
create policy "Documentos: lectura pública de activos"
  on public.documentos for select
  using (estado = 'activo');

create policy "Documentos: admin ve todos"
  on public.documentos for select
  using (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );

create policy "Documentos: usuario autenticado puede subir"
  on public.documentos for insert
  with check (auth.uid() is not null);

-- Subida anónima: subido_por debe ser null y auth.uid() es null
create policy "Documentos: subida anónima permitida"
  on public.documentos for insert
  with check (auth.uid() is null and subido_por is null);

create policy "Documentos: dueño puede eliminar el suyo"
  on public.documentos for update
  using (subido_por = auth.uid())
  with check (subido_por = auth.uid());

create policy "Documentos: admin puede actualizar estado"
  on public.documentos for update
  using (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────
-- INFO_SEDE — lectura pública, escritura solo admin
-- ────────────────────────────────────────────────────────────
create policy "InfoSede: lectura pública"
  on public.info_sede for select using (true);

create policy "InfoSede: solo admin puede modificar"
  on public.info_sede for all
  using (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────
-- REPORTES — usuario autenticado puede crear el suyo; admin ve todos
-- ────────────────────────────────────────────────────────────
create policy "Reportes: usuario autenticado puede crear"
  on public.reportes for insert
  with check (
    auth.uid() is not null
    and usuario_id = auth.uid()
  );

create policy "Reportes: admin ve todos"
  on public.reportes for select
  using (
    exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────
-- STORAGE BUCKET — Política para el bucket 'documentos'
-- (ejecutar después de crear el bucket en el panel de Supabase)
-- ────────────────────────────────────────────────────────────
-- Lectura pública de los archivos
-- insert into storage.buckets (id, name, public) values ('documentos', 'documentos', true);

-- Cualquiera puede leer (bucket público)
-- create policy "Storage documentos: lectura pública"
--   on storage.objects for select using (bucket_id = 'documentos');

-- Solo usuarios autenticados pueden subir
-- create policy "Storage documentos: subida autenticada"
--   on storage.objects for insert
--   with check (bucket_id = 'documentos' and auth.uid() is not null);

-- Anónimos también pueden subir (subida anónima)
-- create policy "Storage documentos: subida anónima"
--   on storage.objects for insert
--   with check (bucket_id = 'documentos');

-- Solo admin puede borrar
-- create policy "Storage documentos: solo admin elimina"
--   on storage.objects for delete
--   using (
--     bucket_id = 'documentos'
--     and exists (
--       select 1 from public.perfiles
--       where id = auth.uid() and rol = 'admin'
--     )
--   );
