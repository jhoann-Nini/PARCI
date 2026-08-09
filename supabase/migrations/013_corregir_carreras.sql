-- ============================================================
-- Corrige el catálogo de carreras de la sede Tuluá. El seed original
-- traía carreras que no se dictan en esta sede (Ingeniería Industrial)
-- o con nombres distintos a los oficiales (Tecnología en Sistemas de
-- Información / Tecnología en Administración de Empresas), y le
-- faltaban varias que sí se dictan.
--
-- 'Ingeniería de Sistemas', 'Contaduría Pública' y 'Administración de
-- Empresas' ya tenían datos reales (materias, ofertas y, en el caso
-- de Sistemas, un documento subido) — se dejan intactas.
--
-- 'Ingeniería Industrial' no tiene ninguna oferta ni documento
-- asociado, así que se elimina (el cascade se lleva sus materias).
--
-- Las dos tecnologías existentes no tenían materias cargadas todavía,
-- así que se renombran en lugar de borrarlas y recrearlas.
--
-- Las materias de las carreras nuevas se cargan en una migración
-- aparte.
-- ============================================================

delete from public.carreras
  where id = '10000000-0000-0000-0000-000000000002'; -- Ingeniería Industrial

update public.carreras set nombre = 'Tecnología en Desarrollo de Software'
  where id = '10000000-0000-0000-0000-000000000005'; -- antes: Tecnología en Sistemas de Información

update public.carreras set nombre = 'Tecnología en Electrónica'
  where id = '10000000-0000-0000-0000-000000000006'; -- antes: Tecnología en Administración de Empresas

insert into public.carreras (id, nombre, sede_id, color) values
  ('10000000-0000-0000-0000-000000000007', 'Ingeniería de Alimentos',   '00000000-0000-0000-0000-000000000001', 'ocre'),
  ('10000000-0000-0000-0000-000000000008', 'Construcción',              '00000000-0000-0000-0000-000000000001', 'ciruela'),
  ('10000000-0000-0000-0000-000000000009', 'Trabajo Social',            '00000000-0000-0000-0000-000000000001', 'aula'),
  ('10000000-0000-0000-0000-000000000010', 'Nutrición y Dietética',     '00000000-0000-0000-0000-000000000001', 'musgo'),
  ('10000000-0000-0000-0000-000000000011', 'Agroindustria',             '00000000-0000-0000-0000-000000000001', 'ocre');
