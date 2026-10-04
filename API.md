# API — Parci

Base local: `http://localhost:3000`.

Todas las rutas son Route Handlers de Next.js en `src/app/api`. No existe un backend separado.

## Endpoints existentes

| Método | Ruta |
|---|---|
| GET | `/api/carreras` |
| GET | `/api/materias` |
| POST | `/api/ofertas` |
| GET | `/api/documentos` |
| POST | `/api/documentos` |
| GET | `/api/documentos/temas` |
| POST | `/api/votos` |
| GET | `/api/comentarios` |
| POST | `/api/comentarios` |
| DELETE | `/api/comentarios` |
| POST | `/api/reportes` |
| POST | `/api/descargas` |
| GET | `/api/moderacion/archivo` |
| GET | `/api/moderacion/comentarios` |
| PATCH | `/api/moderacion/comentarios` |
| GET | `/api/moderacion/palabras` |
| POST | `/api/moderacion/palabras` |
| PATCH | `/api/moderacion/palabras` |
| DELETE | `/api/moderacion/palabras` |

## GET /api/carreras

Sin parámetros.

**200**
`@json
[
  {"id":"uuid","nombre":"Nombre","color":"aula"}
]
`@

**500** error de Supabase.

## GET /api/materias

Query opcional:

- `carrera_id`: UUID.

**200**
`@json
[
  {"id":"uuid","nombre":"Materia","carrera_id":"uuid"}
]
`@

**500** error de Supabase.

## POST /api/ofertas

Body:
`@json
{"materia_id":"uuid","semestre":"2026-1"}
`@

Busca primero una oferta existente por materia+semestre.

- **200** si ya existe.
- **201** si se crea.
- **400** campos faltantes.
- **500** error de consulta/inserción/RLS.

Respuesta exitosa:
`@json
{"id":"uuid"}
`@

## GET /api/documentos

Busca documentos activos mediante RPC `buscar_documentos`.

Query:

| Parámetro | Tipo | Default |
|---|---|---|
| `q` | string | null |
| `carrera_id` | UUID | null |
| `materia_id` | UUID | null |
| `semestre` | string | null |
| `corte` | string | null |
| `limit` | number | 20 |
| `offset` | number | 0 |

**Importante:** el Route Handler actual no expone `orden` como query parameter, aunque algunas versiones del RPC soportan ordenamiento por utilidad. No se debe documentar `orden=utiles` como endpoint HTTP actual.

**200:** array devuelto por el RPC, con datos del documento, carrera, materia, semestre, temas y contadores como `votos_count`, `comentarios_count` y `ya_voto` según la función desplegada.

**500:** error RPC.

## POST /api/documentos

Content-Type: `multipart/form-data`.

Campos:

| Campo | Requerido | Descripción |
|---|---|---|
| `archivo` | Sí | Archivo |
| `oferta_id` | Sí | UUID |
| `tipo` | No | Default `parcial` |
| `corte` | Sí | quiz/parcial_1/parcial_2/final |
| `temas` | No | Campo repetible; máximo 8 |

Tipos permitidos: PDF, JPG/JPEG, PNG, WEBP, DOC, DOCX, XLS, XLSX, PPT, PPTX. Máximo 15 MB.

El endpoint valida extensión, MIME, tamaño, archivo vacío y firma binaria.

**201**
`@json
{
  "id":"uuid",
  "tipo":"parcial",
  "corte":"parcial_1",
  "fecha_subida":"2026-10-03",
  "temas":["grafos"]
}
`@

Errores:

- **400** campos faltantes.
- **400** extensión/MIME no permitidos.
- **400** archivo vacío.
- **400** mayor a 15 MB.
- **400** firma incompatible.
- **500** Storage.
- **500** insert en DB.

Si el insert falla después del upload, intenta eliminar el objeto de Storage.

## GET /api/documentos/temas

Query obligatorio:

- `materia_id`.

**200:** array de strings con sugerencias.

**400:** falta materia_id.  
**500:** error RPC.

## POST /api/votos

Body:
`@json
{"documento_id":"uuid","anon_id":"uuid-opcional"}
`@

Si hay sesión se usa `auth.uid()`; sin sesión se necesita `anon_id`.

**200**
`@json
{"votos_count":3,"ya_voto":false}
`@

**400:** falta documento_id.  
**500:** error RPC.

## GET /api/comentarios

Query:

- `documento_id` obligatorio.
- `anon_id` opcional.

Usa `obtener_comentarios`.

**200:** objetos con `id`, `contenido`, `created_at`, `updated_at`, `nombre_autor` y `es_propio`.

**400:** falta documento_id.  
**500:** error RPC.

## POST /api/comentarios

Body:
`@json
{
  "documento_id":"uuid",
  "contenido":"Comentario",
  "anon_id":"uuid-opcional"
}
`@

Máximo 500 caracteres. `comentar_documento` hace upsert por autor+documento, por lo que editar el propio comentario no crea otra fila.

**201:** comentario creado/actualizado y campo adicional `moderado`.

Errores:

- **400** documento/contenido faltante.
- **400** >500 caracteres.
- **422** palabra/contenido prohibido.
- **422** spam o demasiados enlaces.
- **500** otro error RPC.

## DELETE /api/comentarios

Body:
`@json
{"comentario_id":"uuid","anon_id":"uuid-opcional"}
`@

**200**
`@json
{"eliminado":true}
`@

**400:** falta comentario_id.  
**403:** no es propietario/no autorizado.

La propiedad se valida en `eliminar_comentario`.

## POST /api/reportes

Body: exactamente uno de `documento_id` o `comentario_id`.

`@json
{
  "documento_id":"uuid",
  "motivo":"Motivo",
  "anon_id":"uuid-opcional"
}
`@

**201**
`@json
{"id":"uuid"}
`@

**400:** objetivo inválido o motivo ausente.  
**409:** el autor ya reportó el objetivo.  
**500:** error RPC.

Con 3+ reportes, la función SQL marca el documento/comentario como `reportado`.

## POST /api/descargas

Body:
`@json
{"documento_id":"uuid","anon_id":"uuid-opcional"}
`@

**200 permitido**
`@json
{"permitido":true,"url":"signed-url"}
`@

**200 bloqueado**
`@json
{"permitido":false}
`@

**400:** falta documento_id.  
**404:** documento no encontrado/activo.  
**500:** error RPC o Storage.

La URL pública dura 60 segundos. El bucket es privado.

## GET /api/moderacion/archivo

Query:

- `documento_id` obligatorio.

La ruta llama a `is_moderador()`.

**200**
`@json
{"url":"signed-url"}
`@

**400:** falta ID.  
**403:** no autorizado.  
**404:** documento inexistente.  
**500:** Storage.

La signed URL de moderación dura 120 segundos.

## GET /api/moderacion/comentarios

Sin parámetros.

Solo supervisor/administrador.

**200:** lista de comentarios reportados con perfil, documento, materia, carrera y reportes.

**403:** no autorizado.  
**500:** error Supabase.

## PATCH /api/moderacion/comentarios

Body:
`@json
{"comentario_id":"uuid","estado":"activo"}
`@

Estados aceptados por la ruta: `activo` y `eliminado`.

**200:** resultado de `resolver_comentario_moderacion`.  
**400:** body inválido.  
**404:** comentario inexistente/no reportado.  
**500:** error RPC.

## GET /api/moderacion/palabras

Sin parámetros. La autorización está dentro de `listar_palabras_prohibidas`.

**200**
`@json
[
  {"palabra":"ejemplo","activa":true}
]
`@

**403:** no autorizado/error RPC.

## POST /api/moderacion/palabras

Body:
`@json
{"palabra":"ejemplo"}
`@

**201:** palabra y estado.  
**400:** palabra vacía/no string.  
**403:** no autorizado.

## PATCH /api/moderacion/palabras

Body:
`@json
{"palabra":"ejemplo","activa":false}
`@

**200:** palabra actualizada.  
**400:** body inválido.  
**403:** no autorizado.  
**404:** palabra inexistente.

## DELETE /api/moderacion/palabras

Body:
`@json
{"palabra":"ejemplo"}
`@

**200:** palabra eliminada.  
**400:** palabra inválida.  
**403:** no autorizado.  
**404:** palabra inexistente.

## Rutas que NO deben marcarse como pendientes

Reportes, comentarios, votos y descargas **sí existen actualmente**: cada uno tiene Route Handler real.

No existe una ruta `/api/auth`: autenticación y recuperación usan Supabase Auth, Server Actions y `/auth/confirm`.

No existe actualmente búsqueda por profesor: la tabla `profesores` fue eliminada por 016.

## Nota sobre el esquema y respuestas

La migración `030_seguridad_buscar_documentos.sql` es inconsistente con 016 porque vuelve a referenciar `profesores`. Por eso este documento describe los endpoints a partir del código TypeScript actual, no a partir de una migración histórica incompatible.
