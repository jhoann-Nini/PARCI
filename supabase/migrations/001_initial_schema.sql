-- Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- SEDES
-- ============================================================
create table public.sedes (
  id   uuid primary key default uuid_generate_v4(),
  nombre   text not null,
  ciudad   text not null,
  direccion text not null
);

-- ============================================================
-- CARRERAS
-- ============================================================
create table public.carreras (
  id      uuid primary key default uuid_generate_v4(),
  nombre  text not null,
  sede_id uuid not null references public.sedes (id) on delete cascade,
  color   text not null default 'aula'
    check (color in ('aula', 'musgo', 'ocre', 'ciruela'))
);

-- ============================================================
-- PERFILES DE USUARIO
-- La tabla auth.users la gestiona Supabase; esta extiende el perfil.
-- ============================================================
create table public.perfiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  correo_institucional  text unique not null,
  nombre                text not null,
  carrera_id            uuid references public.carreras (id) on delete set null,
  rol                   text not null default 'estudiante'
    check (rol in ('estudiante', 'egresado', 'admin')),
  created_at            timestamptz not null default now()
);

-- ============================================================
-- MATERIAS
-- ============================================================
create table public.materias (
  id         uuid primary key default uuid_generate_v4(),
  nombre     text not null,
  carrera_id uuid not null references public.carreras (id) on delete cascade
);

-- ============================================================
-- PROFESORES
-- ============================================================
create table public.profesores (
  id     uuid primary key default uuid_generate_v4(),
  nombre text not null
);

-- ============================================================
-- OFERTAS  (materia × profesor × semestre)
-- ============================================================
create table public.ofertas (
  id          uuid primary key default uuid_generate_v4(),
  materia_id  uuid not null references public.materias (id) on delete cascade,
  profesor_id uuid not null references public.profesores (id) on delete cascade,
  semestre    text not null,  -- ej. "2025-2"
  unique (materia_id, profesor_id, semestre)
);

-- ============================================================
-- DOCUMENTOS
-- ============================================================
create table public.documentos (
  id           uuid primary key default uuid_generate_v4(),
  oferta_id    uuid not null references public.ofertas (id) on delete cascade,
  tipo         text not null default 'parcial'
    check (tipo in ('parcial', 'taller', 'apunte', 'nota')),
  corte        text not null
    check (corte in ('quiz', 'parcial_1', 'parcial_2', 'final')),
  archivo_url  text not null,
  subido_por   uuid references public.perfiles (id) on delete set null,
  estado       text not null default 'activo'
    check (estado in ('activo', 'reportado', 'eliminado')),
  fecha_subida date not null default current_date
);

-- ============================================================
-- INFO DE SEDE  (contenido estático administrado por el equipo)
-- ============================================================
create table public.info_sede (
  id        uuid primary key default uuid_generate_v4(),
  sede_id   uuid not null references public.sedes (id) on delete cascade,
  categoria text not null
    check (categoria in ('biblioteca', 'bienestar', 'admisiones', 'contacto', 'mapa')),
  titulo    text not null,
  contenido text not null
);

-- ============================================================
-- REPORTES
-- ============================================================
create table public.reportes (
  id            uuid primary key default uuid_generate_v4(),
  documento_id  uuid not null references public.documentos (id) on delete cascade,
  usuario_id    uuid not null references public.perfiles (id) on delete cascade,
  motivo        text not null,
  fecha         date not null default current_date,
  unique (documento_id, usuario_id)   -- un usuario no puede reportar el mismo doc dos veces
);

-- ============================================================
-- ÍNDICES para búsqueda frecuente
-- ============================================================
create index on public.materias (carrera_id);
create index on public.ofertas (materia_id);
create index on public.ofertas (profesor_id);
create index on public.documentos (oferta_id);
create index on public.documentos (estado);
create index on public.documentos (fecha_subida desc);
create index on public.info_sede (sede_id, categoria);

-- Búsqueda de texto en nombre de materia y profesor
create index on public.materias using gin (to_tsvector('spanish', nombre));
create index on public.profesores using gin (to_tsvector('spanish', nombre));
