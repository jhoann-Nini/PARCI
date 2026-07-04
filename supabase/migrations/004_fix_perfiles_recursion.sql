-- ============================================================
-- FIX: recursión infinita en políticas RLS que consultan perfiles
-- para saber si el usuario es admin.
--
-- Causa: la policy "Perfiles: ver el propio" consulta la propia
-- tabla perfiles para chequear rol = 'admin'. Cuando otra tabla
-- (carreras, materias, documentos, etc.) evalúa su policy de admin
-- haciendo `select ... from perfiles`, Postgres vuelve a evaluar
-- las policies de perfiles, que a su vez vuelven a consultar
-- perfiles → recursión infinita.
--
-- Solución: función security definer que consulta perfiles con
-- los privilegios del dueño de la función (bypassea RLS), evitando
-- el ciclo.
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

-- Perfiles
drop policy if exists "Perfiles: ver el propio" on public.perfiles;
create policy "Perfiles: ver el propio"
  on public.perfiles for select
  using (id = auth.uid() or public.is_admin());

-- Sedes
drop policy if exists "Sedes: solo admin puede modificar" on public.sedes;
create policy "Sedes: solo admin puede modificar"
  on public.sedes for all
  using (public.is_admin());

-- Carreras
drop policy if exists "Carreras: solo admin puede modificar" on public.carreras;
create policy "Carreras: solo admin puede modificar"
  on public.carreras for all
  using (public.is_admin());

-- Materias
drop policy if exists "Materias: solo admin puede modificar" on public.materias;
create policy "Materias: solo admin puede modificar"
  on public.materias for all
  using (public.is_admin());

-- Profesores
drop policy if exists "Profesores: solo admin puede modificar o eliminar" on public.profesores;
create policy "Profesores: solo admin puede modificar o eliminar"
  on public.profesores for update using (public.is_admin());

drop policy if exists "Profesores: solo admin puede eliminar" on public.profesores;
create policy "Profesores: solo admin puede eliminar"
  on public.profesores for delete using (public.is_admin());

-- Documentos
drop policy if exists "Documentos: admin ve todos" on public.documentos;
create policy "Documentos: admin ve todos"
  on public.documentos for select
  using (public.is_admin());

drop policy if exists "Documentos: admin puede actualizar estado" on public.documentos;
create policy "Documentos: admin puede actualizar estado"
  on public.documentos for update
  using (public.is_admin());

-- InfoSede
drop policy if exists "InfoSede: solo admin puede modificar" on public.info_sede;
create policy "InfoSede: solo admin puede modificar"
  on public.info_sede for all
  using (public.is_admin());

-- Reportes
drop policy if exists "Reportes: admin ve todos" on public.reportes;
create policy "Reportes: admin ve todos"
  on public.reportes for select
  using (public.is_admin());
