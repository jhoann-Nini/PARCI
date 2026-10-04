# Parci

Parci es un banco de parciales para estudiantes de la Universidad del Valle, sede Tuluá. Permite explorar documentos por carrera, materia, semestre y corte; subir material; votar; comentar; reportar; guardar favoritos y moderar contenido.

> Esta documentación fue generada a partir del código y SQL versionados en `main`. Cuando GitHub no permite verificar el proyecto Supabase remoto, se indica explícitamente.

## Stack

- Next.js 16.3.4, App Router y Server Components.
- React 19.2.4.
- TypeScript 5.x.
- Tailwind CSS 4.
- Supabase JS 2.110.x y `@supabase/ssr` 0.12.x.
- PostgreSQL, Supabase Auth, Storage y RLS.
- Vercel para producción.
- Vitest 5.
- Node.js 22.x; Docker usa `node:22-alpine`.

## Requisitos previos

- Node.js 22.x y npm.
- Proyecto/cuenta Supabase.
- Git.
- Cuenta Vercel para producción.

Las migraciones están en `supabase/migrations/`. El repo no contiene `config.toml` ni Supabase CLI, por lo que no se asume aplicación automática de migraciones.
# Recuperación PARCI

# Recuperación PARCI

## Backup disponible

Fecha:
2026-10-03

Ubicación:
backups/2026-10-03/


## 1. Restaurar base de datos

Backup:
backups/2026-10-03/database/parci.dump


Comando:

```bash
pg_restore \
  --dbname=postgres \
  backups/2026-10-03/database/parci.dump
```
### 2. Restaurar Storage

# Archivos:

backups/2026-10-03/storage/documentos/

Restaurar en el bucket:

documentos

### 3. Verificar
tablas creadas
RLS activo
funciones existentes
documentos visibles
descargas funcionando

## Instalación

### 1. Clonar

```bash
git clone https://github.com/jhoann-Nini/PARCI.git
cd PARCI
```

### 2. Dependencias

```bash
npm ci
```

### 3. Supabase

Configura el proyecto usando las migraciones versionadas y crea/configura el bucket privado `documentos` según el estado definido por las migraciones.

Las migraciones de `supabase/migrations/` son la fuente versionada del esquema. El repositorio no contiene Supabase CLI ni `config.toml`, por lo que su aplicación al proyecto remoto no se asume automática.

### 4. Variables

```bash
cp .env.example .env.local
```

Variables reales usadas por el código:

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente público Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Signed URLs server-side |
| `NEXT_PUBLIC_DOMINIO_CORREO` | Dominio permitido; default `correounivalle.edu.co` |

No se documenta `NEXT_PUBLIC_APP_URL` como requerida: el código actual construye callbacks con `window.location.origin`. Tampoco hay variable SMTP: los correos usan Supabase Auth.

### 5. Desarrollo

```bash
npm run dev
```

Por defecto: `http://localhost:3000`.

### 6. Tests y build

```bash
npm run test
npm run build
npm run start
```

### 7. Docker

```bash
docker compose up --build
```

El compose expone 3000 y carga `.env.local`.

## Producción

El repo está preparado para Vercel. `main` es la rama principal y `vercel.json` contiene el `ignoreCommand` de despliegue.

Las variables deben configurarse en Vercel. Las migraciones de Supabase no se ejecutan automáticamente desde este repo.

`next.config.ts` usa `output: "standalone"` cuando no está en Vercel; el Dockerfile genera una imagen Node 22 Alpine usando ese artefacto.

## Estructura

```
src/
  app/
    (auth)/             # login, registro, recuperación, restablecimiento
    (main)/             # explorar, subir, perfil, moderación
    api/                # Route Handlers HTTP
    auth/confirm/       # callback Supabase Auth
    privacidad/
  components/
    explorar/
    layout/
    moderacion/
    parciales/
    ui/
  lib/
    actions/            # Server Actions
    supabase/           # clientes browser/server/admin
    anonId.ts
    constants.ts
    utils.ts
    validaciones.ts
  types/
  proxy.ts
supabase/
  migrations/
  seed.sql
tests/
docs/
Dockerfile
docker-compose.yml
vercel.json
package.json
```

Componentes clave: `ExamenCard`, `ComentariosPanel`, `VotoButton`, `ReportarButton`, `FavoritoButton`, `DescargarButton`, `ModeracionCard`, `ModeracionComentarioCard`, `PalabrasProhibidasPanel`.

## Autenticación

Supabase Auth gestiona las cuentas. El registro valida `@correounivalle.edu.co` en cliente y existe además un hook SQL para reforzar el dominio. El perfil se crea por trigger y guarda carrera/semestre.

Existe flujo de confirmación, login/logout, recuperación y restablecimiento de contraseña.

## Anonimato

`src/lib/anonId.ts` genera `parci_anon_id` como UUID y lo guarda en cookie + localStorage. Sirve para deduplicar votos, comentarios/reportes y registrar descargas sin obligar al visitante a tener cuenta. **No es un mecanismo antifraude fuerte.**

## Subidas

`/subir` exige sesión en la UI. `SubirForm` primero crea/resuelve una oferta materia+semestre y luego llama a `POST /api/documentos`.

El endpoint valida extensión, MIME, tamaño y firma binaria. Acepta PDF, JPG/JPEG, PNG, WEBP, DOC/DOCX, XLS/XLSX y PPT/PPTX, hasta 15 MB.

Si falla el insert de `documentos` después del upload, intenta eliminar el archivo de Storage.

## Descargas

El bucket `documentos` es privado. `POST /api/descargas` registra el acceso y genera una signed URL de 60 segundos usando `archivo_path` y el cliente server-side con service role.

La descarga repetida del mismo documento no consume otro cupo. La regla de límite inicial es de dos documentos distintos para autores que no hayan subido material; los usuarios autenticados que ya hayan subido un documento no quedan limitados.

## Tests

El repo contiene:

- `tests/constants.test.ts`
- `tests/utils.test.ts`
- `tests/validaciones.test.ts`

Son pruebas unitarias; no hay evidencia de cobertura integral de RLS, Storage o endpoints.

## Documentación

- [docs/ARCHITECTURE.md](./ARCHITECTURE.md)
- [docs/API.md](./API.md)
- [docs/CHANGELOG.md](./CHANGELOG.md)
- [docs/ADRs.md](./docs/ADRs.md)
- [docs/DOCUMENTACION.md](./docs/DOCUMENTACION.md)

## Documentación

- [docs/ARCHITECTURE.md](./ARCHITECTURE.md)
- [docs/API.md](./API.md)
- [docs/CHANGELOG.md](./CHANGELOG.md)
- [docs/DOCUMENTACION.md](./docs/DOCUMENTACION.md)
- [docs/ADRs.md](./docs/ADRs.md)

La documentación describe el estado versionado en `main`. No se afirma que el proyecto Supabase remoto sea idéntico si contiene cambios manuales o migraciones no aplicadas.

## Estado del proyecto

Última revisión de seguridad:
- Storage privado
- RLS activo
- Signed URLs
- Backups verificados
- Validación de archivos