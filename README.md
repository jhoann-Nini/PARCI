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

Configura el proyecto usando las migraciones versionadas y el bucket `documentos`.

**Advertencia:** `030_seguridad_buscar_documentos.sql` es incompatible con `016_quitar_profesores.sql`: vuelve a referenciar la tabla `profesores`, que 016 elimina. Antes de aplicar todas las migraciones a una instancia nueva, revisa esa migración. Ver [ARCHITECTURE.md](./ARCHITECTURE.md).

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

La migración 021 convierte `documentos` en bucket privado. `POST /api/descargas` registra la descarga y genera una signed URL de 60 segundos con `SUPABASE_SERVICE_ROLE_KEY`. Moderación usa URLs de 120 segundos.

**Inconsistencia actual:** `POST /api/documentos` todavía calcula `archivo_url` mediante `getPublicUrl()`, aunque el bucket es privado. El flujo efectivo de descarga usa `archivo_path` + signed URL.

## Tests

El repo contiene:

- `tests/constants.test.ts`
- `tests/utils.test.ts`
- `tests/validaciones.test.ts`

Son pruebas unitarias; no hay evidencia de cobertura integral de RLS, Storage o endpoints.

## Documentación

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [API.md](./API.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [docs/ADRs.md](./docs/ADRs.md)
- [docs/DOCUMENTACION.md](./docs/DOCUMENTACION.md)

## Inconsistencias conocidas

1. El repositorio no permite verificar el catálogo/esquema live del proyecto Supabase ni saber qué migraciones remotas se aplicaron.
2. `030_seguridad_buscar_documentos.sql` contradice 016 y referencia `profesores` eliminado.
3. `docs/DOCUMENTACION.md` describe un estado histórico: bucket público, profesores y migraciones hasta 016.
4. `archivo_url` sigue siendo generado aunque el bucket es privado.
5. No hay integración SMTP/Resend en el código de la aplicación.
