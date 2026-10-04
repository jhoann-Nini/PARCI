-- Permitir que un usuario vea sus propios documentos pendientes
-- Necesario para retornar el registro después del insert

create policy "Documentos: dueño puede ver el suyo"
on public.documentos
for select
using (
  subido_por = auth.uid()
);