# Changelog

## 0.1.0 — estado actual de `main`

Versión documental basada en las funcionalidades presentes en el código actual.

### Aplicación
- Next.js 16.3.4 + App Router.
- React 19.2.4.
- TypeScript.
- Tailwind CSS 4.
- UI reutilizable y orientación mobile-first.

### Catálogo
- Carreras y materias.
- Ofertas materia + semestre.
- Búsqueda y filtros por carrera, materia, semestre y corte.
- Temas de documentos y sugerencias por materia.
- Conteo de documentos.

### Documentos
- Subida desde `/subir`.
- Formulario en tres pasos.
- PDF, imágenes y Office.
- Máximo 15 MB.
- Validación de extensión, MIME y firma binaria.
- Rollback de Storage si falla el insert.
- Estado de documento: activo/reportado/eliminado.
- Eliminación lógica del propio documento.

### Votos
- "Me sirvió".
- Usuario autenticado o visitante anónimo.
- Deduplicación por documento y autor.

### Comentarios
- Crear, listar, editar y eliminar el propio comentario.
- Upsert por autor + documento.
- Máximo 500 caracteres.
- Estados activo/reportado/eliminado.
- Moderación automática de palabras prohibidas y spam por enlaces.
- Gestión de palabras prohibidas.

### Reportes y moderación
- Reportar documentos.
- Reportar comentarios.
- Reportes anónimos mediante `anon_id`.
- Prevención de reportes duplicados.
- Auto-marcado con 3 o más reportes.
- Cola de moderación de comentarios y documentos.
- Resolución de comentarios reportados.
- Roles `usuario`, `supervisor` y `administrador`.

### Favoritos
- Tabla `favoritos`.
- Acceso restringido al usuario propietario.

### Descargas
- Registro de documentos distintos descargados.
- Límite inicial de dos documentos para usuarios que no han subido material.
- Desbloqueo tras subir material para usuarios autenticados.
- Bucket privado.
- Signed URL de 60 s para descarga.
- Signed URL de 120 s para revisión de moderación.

### Autenticación
- Registro institucional.
- Carrera y semestre en el perfil.
- Trigger de creación de perfil.
- Confirmación de correo.
- Login/logout.
- Recuperación y restablecimiento de contraseña.
- Restricción de dominio institucional mediante formulario + hook SQL.

### Seguridad
- RLS.
- Clientes Supabase browser/server separados.
- Service role solo server-side.
- Validación binaria de archivos.
- Identificador anónimo para deduplicación básica.
- Bucket privado.
- Funciones `security definer` para operaciones controladas.
- Protección contra autoascenso de rol.

### Infraestructura
- Docker multi-stage con Node 22 Alpine.
- Docker Compose.
- Configuración Vercel.
- Build standalone fuera de Vercel.

### Tests
- `tests/constants.test.ts`
- `tests/utils.test.ts`
- `tests/validaciones.test.ts`

### Problemas/inconsistencias detectados
- `030_seguridad_buscar_documentos.sql` referencia `profesores` después de que 016 elimina esa tabla.
- `docs/DOCUMENTACION.md` está desactualizado en bucket, profesores y alcance de migraciones.
- `POST /api/documentos` todavía genera `archivo_url` con `getPublicUrl()` aunque el bucket es privado; el flujo seguro usa `archivo_path` y signed URLs.
- No hay evidencia de tests de integración completos para RLS, Storage y endpoints.
- No hay SMTP/Resend implementado en el código de la aplicación.
