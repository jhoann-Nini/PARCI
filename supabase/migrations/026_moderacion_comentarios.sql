alter table public.comentarios
add column estado text not null default 'activo'
check (
 estado in (
 'activo',
 'reportado',
 'oculto',
 'eliminado'
 )
);