-- ============================================================
-- FAVORITOS
-- Permite a cada usuario guardar parciales para consultarlos después.
-- ============================================================
create table public.favoritos (
  usuario_id   uuid not null references public.perfiles (id) on delete cascade,
  documento_id uuid not null references public.documentos (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (usuario_id, documento_id)
);

create index favoritos_usuario_idx on public.favoritos (usuario_id, created_at desc);
create index favoritos_documento_idx on public.favoritos (documento_id);

alter table public.favoritos enable row level security;

create policy "favoritos_select_propios"
on public.favoritos for select
using (auth.uid() = usuario_id);

create policy "favoritos_insert_propios"
on public.favoritos for insert
with check (auth.uid() = usuario_id);

create policy "favoritos_delete_propios"
on public.favoritos for delete
using (auth.uid() = usuario_id);
