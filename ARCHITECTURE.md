# Architecture — Parci

## Fuente de verdad

Describe el código y SQL presentes en `main`. El repositorio no contiene una instantánea del catálogo PostgreSQL remoto ni estado de migraciones aplicadas en Supabase, por lo que la base de datos descrita aquí es la **reconstruible desde las migraciones**, no una afirmación de que el proyecto remoto sea idéntico.

## Diagrama

`@mermaid
flowchart LR
 U[Usuario / navegador] --> N[Next.js 16 App Router]
 N --> P[proxy.ts + sesión]
 N --> UI[Server/Client Components]
 UI --> API[Route Handlers /api]
 UI --> SA[Server Actions]
 API --> S[Supabase SSR client]
 SA --> S
 S --> A[Supabase Auth]
 S --> DB[(PostgreSQL)]
 DB --> RLS[RLS + RPC security definer]
 S --> ST[Supabase Storage]
 API --> ADM[Supabase admin client]
 ADM --> ST
 A --> MAIL[Mailer de Supabase Auth]
 V[Vercel] --> N
 D[Docker Node 22] --> N
`@

No existe backend Node/Express separado.

## Decisiones

### Next.js App Router

Se usa App Router, Server Components y Route Handlers. Las consultas a Supabase pueden ejecutarse en servidor y se reduce JS enviado al cliente.

### Supabase como backend

Supabase concentra Postgres, Auth, Storage y RLS. Esto evita mantener un backend separado para el MVP. Está registrado como ADR-002.

### RLS como autorización

Las API routes validan entrada y delegan autorización de datos a RLS/RPC. Los helpers SQL `is_admin()` e `is_moderador()` centralizan roles.

### Votos/comentarios anónimos

`parci_anon_id` es un UUID persistido en cookie + localStorage. Permite leer/escribir sin cuenta y deduplicar por navegador. No es seguridad fuerte.

### Bucket privado

La migración 021 convierte el bucket `documentos` en privado porque una URL pública permitía saltarse el límite de descargas. Ahora `/api/descargas` genera URLs firmadas.

## Flujo de subida

`@mermaid
sequenceDiagram
 participant U as Usuario
 participant F as SubirForm
 participant O as /api/ofertas
 participant D as /api/documentos
 participant DB as PostgreSQL
 participant ST as Storage
 U->>F: carrera, materia, semestre, corte, archivo
 F->>O: materia_id + semestre
 O->>DB: busca/crea oferta
 DB-->>O: oferta_id
 O-->>F: oferta_id
 F->>D: multipart/form-data
 D->>D: valida extensión/MIME/tamaño/firma
 D->>ST: upload
 ST-->>D: objeto
 D->>DB: INSERT documentos
 DB-->>D: documento
 D-->>F: 201
 F-->>U: éxito
`@

La UI requiere sesión. El endpoint SQL/RLS conserva soporte de inserción anónima en el esquema histórico, pero no está expuesto por la interfaz de subida.

## Flujo de descarga

`@mermaid
sequenceDiagram
 participant U as Usuario
 participant A as /api/descargas
 participant DB as registrar_descarga()
 participant ADM as service-role client
 participant ST as Storage privado
 U->>A: documento_id + anon_id
 A->>DB: validar límite
 DB-->>A: permitido
 alt permitido
  A->>DB: documento activo + archivo_path
  A->>ADM: createSignedUrl(path, 60s)
  ADM->>ST: URL firmada
  ST-->>A: signed URL
  A-->>U: URL
 else bloqueado
  A-->>U: permitido=false
 end
`@

Regla de `018_limite_descargas.sql`: 2 documentos distintos gratis; un usuario autenticado que ya subió un documento no queda limitado; volver a descargar el mismo documento no consume otro cupo.

## Modelo de datos reproducible

### Tablas

| Tabla | Propósito |
|---|---|
| `sedes` | Sedes; `carreras.sede_id` mantiene la relación |
| `carreras` | Carreras y color |
| `perfiles` | Extensión de `auth.users`, rol y datos académicos |
| `materias` | Materias por carrera |
| `ofertas` | materia + semestre |
| `documentos` | Material académico |
| `votos` | "me sirvió" por usuario/anónimo |
| `comentarios` | Comentarios por usuario/anónimo |
| `reportes` | Reportes de documentos/comentarios |
| `descargas` | Documentos distintos descargados |
| `favoritos` | Documentos guardados |
| `palabras_prohibidas_comentarios` | Reglas de moderación |

### Relaciones

`@mermaid
erDiagram
 SEDES ||--o{ CARRERAS : contiene
 CARRERAS ||--o{ MATERIAS : tiene
 MATERIAS ||--o{ OFERTAS : ofrece
 OFERTAS ||--o{ DOCUMENTOS : agrupa
 PERFILES ||--o{ DOCUMENTOS : sube
 PERFILES ||--o{ VOTOS : emite
 PERFILES ||--o{ COMENTARIOS : escribe
 PERFILES ||--o{ REPORTES : crea
 PERFILES ||--o{ DESCARGAS : registra
 PERFILES ||--o{ FAVORITOS : guarda
 DOCUMENTOS ||--o{ VOTOS : recibe
 DOCUMENTOS ||--o{ COMENTARIOS : recibe
 DOCUMENTOS ||--o{ REPORTES : recibe
 DOCUMENTOS ||--o{ DESCARGAS : registra
 DOCUMENTOS ||--o{ FAVORITOS : guarda
 COMENTARIOS ||--o{ REPORTES : recibe
`@

### Esquema

**sedes**
- `id uuid PK`
- `nombre text`
- `ciudad text`
- `direccion text`

**carreras**
- `id uuid PK`
- `nombre text`
- `sede_id uuid FK sedes`
- `color text`: `aula | musgo | ocre | ciruela`

**perfiles**
- `id uuid PK/FK auth.users`
- `correo_institucional text unique`
- `nombre text`
- `carrera_id uuid nullable FK carreras`
- `rol text`: `usuario | supervisor | administrador`
- `created_at timestamptz`
- `semestre smallint`, 1..10

**materias**
- `id uuid PK`
- `nombre text`
- `carrera_id uuid FK carreras`

**ofertas**
- `id uuid PK`
- `materia_id uuid FK materias`
- `semestre text`
- unique(`materia_id`, `semestre`)
- No tiene profesor después de 016.

**documentos**
- `id uuid PK`
- `oferta_id uuid FK ofertas`
- `tipo`: parcial/taller/apunte/nota
- `corte`: quiz/parcial_1/parcial_2/final
- `archivo_url text`
- `archivo_path text`
- `subido_por uuid nullable FK perfiles`
- `estado`: activo/reportado/eliminado
- `fecha_subida date`
- `temas text[]`, máximo 8

**votos**
- `id uuid PK`
- `documento_id uuid`
- `usuario_id uuid nullable`
- `anon_id uuid nullable`
- `created_at timestamptz`
- exactamente un autor
- unique parcial por documento+usuario y documento+anon

**comentarios**
- `id uuid PK`
- `documento_id uuid`
- `usuario_id uuid nullable`
- `anon_id uuid nullable`
- `contenido text`, 1..500
- `created_at`, `updated_at`
- `estado`: activo/reportado/eliminado
- unique parcial por documento+usuario y documento+anon

**reportes**
- `id uuid PK`
- `documento_id uuid nullable`
- `comentario_id uuid nullable`
- `usuario_id uuid nullable`
- `anon_id uuid nullable`
- `motivo text`
- `fecha date`
- constraint: un objetivo y un autor

**descargas**
- `id uuid PK`
- `documento_id uuid`
- `usuario_id/anon_id` mutuamente excluyentes
- `created_at`
- unique parcial por documento+autor

**favoritos**
- PK `(usuario_id, documento_id)`
- `created_at`

**palabras_prohibidas_comentarios**
- `palabra text PK`
- `activa boolean`

## RLS y permisos

Las migraciones habilitan RLS y evolucionan las policies.

| Recurso | Regla observable |
|---|---|
| carreras/materias/sedes | lectura pública; cambios administrativos |
| perfiles | propietario; administrador puede gestionar otros |
| documentos | activos públicos; moderadores ven/modifican estado; propietario puede gestionar el suyo |
| votos | inserción separada usuario/anónimo; deduplicación por índices |
| comentarios | escritura por autor; edición propia; listado público vía RPC |
| reportes | creación autenticada o anónima con `anon_id`; lectura de moderadores |
| favoritos | solo propietario |
| descargas | acceso por RPC, sin policies de cliente |
| palabras prohibidas | gestión por RPC y solo moderadores |

Roles: `usuario`, `supervisor`, `administrador`.

## RPC

`buscar_documentos`, `contar_documentos`, `sugerencias_temas`, `votar_documento`, `comentar_documento`, `obtener_comentarios`, `eliminar_comentario`, `registrar_reporte`, `registrar_descarga`, `resolver_comentario_moderacion`, `listar_palabras_prohibidas`, `agregar_palabra_prohibida`, `cambiar_estado_palabra_prohibida`, `eliminar_palabra_prohibida`, `is_admin` y `is_moderador`.

## Comparación con documentación previa

No existe un archivo llamado `documentacion_fase1.md` en el repositorio actual; la búsqueda por ese nombre no encontró coincidencias. El documento disponible es `docs/DOCUMENTACION.md`.

Diferencias verificables:

1. Profesores: la documentación anterior describe `profesores`; 016 elimina la tabla y `ofertas.profesor_id`.
2. Bucket: la documentación anterior describe Storage público; 021 lo convierte en privado.
3. Descargas: el modelo actual usa `descargas`, `registrar_descarga()`, `archivo_path` y signed URLs.
4. Temas: 017 crea texto; 019 lo convierte en `text[]`.
5. Comentarios: ahora tienen `estado` y moderación.
6. Palabras prohibidas: ahora son configurables.
7. Perfil: ahora incluye `semestre`.
8. Favoritos: existe tabla `favoritos`.
9. 030 es inconsistente: vuelve a referenciar `profesores` después de que 016 lo elimina.

## Código vs Storage

`POST /api/documentos` calcula `archivo_url` mediante `getPublicUrl()`, pero 021 hace privado el bucket. La descarga real usa `archivo_path` + signed URL. Esto debe limpiarse en una futura revisión.

## Correo

No hay SMTP ni Resend implementado en el código. Supabase Auth gestiona confirmación y recuperación. `/auth/confirm` soporta `code` y `token_hash + type`.

## Límite de verificación del esquema live

GitHub no permite comprobar desde este repo:

- migraciones realmente aplicadas;
- cambios manuales en Dashboard;
- policies/functions adicionales fuera de Git;
- si 030 llegó a ejecutarse.

Por eso este documento no inventa un "estado live".
