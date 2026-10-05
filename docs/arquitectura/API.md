# API de Parci

Documentación de los *route handlers* que existen hoy en `src/app/api/**` y de `src/app/auth/confirm/route.ts`, escrita leyendo el código de cada archivo. Para cada endpoint: método, ruta, autenticación, parámetros, cuerpo, respuesta y códigos de error. Lo que no se pudo confirmar está marcado como **(no verificado)**.

Cómo se probó: lectura de código, `tsc --noEmit` sin errores y migraciones SQL ejecutadas en PostgreSQL 16 local con stubs. **Los endpoints no se ejecutaron contra Supabase real.**

## Convenciones generales

- **Formato:** JSON (`Content-Type: application/json`), salvo `POST /api/documentos` (`multipart/form-data`).
- **Errores:** casi todos devuelven `{ "error": "<mensaje>" }`. Los errores de base de datos se devuelven tal cual, con `error.message` de Postgres/PostgREST, y casi siempre con **500** (no se distingue 401/404/409 salvo donde se indica).
- **Cuerpo JSON inválido:** en los handlers que hacen `await request.json()` sin `try/catch`, un cuerpo malformado lanza una excepción no capturada → respuesta 500 genérica de Next.js (sin el formato `{error}`).
- **Autenticación:** no hay un guard central. Cada handler crea un cliente Supabase con las cookies de la sesión (`src/lib/supabase/server.ts`); la autorización la deciden las políticas RLS y las funciones SQL. Los endpoints "públicos" funcionan sin sesión.
- **Visitante anónimo (`anon_id`):** votos, comentarios, reportes y descargas aceptan un `anon_id` (UUID) en el cuerpo/query cuando **no hay sesión**. Lo genera el navegador (`src/lib/anonId.ts`, cookie `parci_anon_id` + `localStorage`) y el servidor **confía en el valor que llega**. Con sesión, el servidor ignora `anon_id` y usa `auth.uid()`. No es un mecanismo de seguridad: cualquiera puede enviar UUID nuevos (esto relativiza el límite de descargas y de reportes; ver `ARCHITECTURE.md`).
- **Sin límite de tasa (rate limit)** en ningún endpoint.
- **Roles:** `usuario` · `supervisor` · `administrador`. "Moderador" = supervisor o administrador (`is_moderador()` en Postgres).

## Resumen

| Método | Ruta | Auth | Función |
|---|---|---|---|
| GET | `/api/carreras` | pública | Lista de carreras |
| GET | `/api/materias` | pública | Lista de materias (filtrable por carrera) |
| POST | `/api/ofertas` | sesión (por RLS) | Obtiene o crea la oferta materia × semestre |
| GET | `/api/documentos` | pública | Búsqueda de documentos |
| POST | `/api/documentos` | sesión en la UI; opcional en la API | Sube un documento |
| GET | `/api/documentos/temas` | pública | Sugerencias de temas por materia |
| POST | `/api/votos` | pública (sesión o `anon_id`) | Voto "me sirvió" |
| GET | `/api/comentarios` | pública | Comentarios activos de un documento |
| POST | `/api/comentarios` | pública (sesión o `anon_id`) | Crea o edita el comentario propio |
| DELETE | `/api/comentarios` | dueño del comentario | Borra el comentario propio |
| POST | `/api/reportes` | pública (sesión o `anon_id`) | Reporta un documento o un comentario |
| POST | `/api/descargas` | pública (sesión o `anon_id`) | Valida el límite y entrega URL firmada |
| GET | `/api/moderacion/archivo` | moderador | URL firmada para revisar un documento |
| GET | `/api/moderacion/comentarios` | moderador | Comentarios reportados |
| PATCH | `/api/moderacion/comentarios` | moderador | Resuelve un comentario reportado |
| GET · POST · PATCH · DELETE | `/api/moderacion/palabras` | moderador | Gestión de palabras prohibidas |
| GET | `/auth/confirm` | pública | Cierra la confirmación por correo (redirige) |

---

## Catálogo

### `GET /api/carreras`

- **Auth:** ninguna.
- **Respuesta 200:** `[{ "id": "uuid", "nombre": "string", "color": "aula|musgo|ocre|ciruela" }]`, ordenado por `nombre`.
- **Errores:** `500 { error }`.

### `GET /api/materias`

- **Auth:** ninguna.
- **Query:** `carrera_id` (opcional, uuid). Sin él devuelve todas las materias.
- **Respuesta 200:** `[{ "id", "nombre", "carrera_id" }]`, ordenado por `nombre`.
- **Errores:** `500 { error }` (por ejemplo, `carrera_id` que no es un UUID válido).

### `POST /api/ofertas`

Obtiene la oferta (materia × semestre) o la crea. La usa `SubirForm` antes de subir el archivo.

- **Auth:** el handler no la exige, pero la política RLS de inserción en `ofertas` pide `auth.uid() is not null`. Sin sesión, solo "funciona" si la oferta ya existe.
- **Body:** `{ "materia_id": "uuid", "semestre": "string" }` (ej. `"2026-1"`). El formato del semestre **no se valida** en el servidor.
- **Respuesta:**
  - `200 { "id" }` si la oferta ya existía.
  - `201 { "id" }` si se creó.
- **Errores:** `400 { error: "Faltan campos requeridos" }` · `500 { error }` (incluye la violación de RLS sin sesión: **responde 500, no 401**).

---

## Documentos

### `GET /api/documentos`

Búsqueda. Llama a la función SQL `buscar_documentos(...)`.

- **Auth:** ninguna (RLS: lectura pública de documentos `activo`).
- **Query (todos opcionales):**

| Parámetro | Tipo | Notas |
|---|---|---|
| `q` | string | Búsqueda libre (`ilike`) sobre nombre de materia, nombre de carrera y temas. |
| `carrera_id` | uuid | |
| `materia_id` | uuid | |
| `semestre` | string | Coincidencia exacta, ej. `2025-2`. |
| `corte` | string | `quiz`, `parcial_1`, `parcial_2`, `final`. |
| `limit` | int | Default 20. **Sin tope máximo ni validación**: un valor no numérico llega como `null` a SQL (`LIMIT NULL` = sin límite). |
| `offset` | int | Default 0. |

- **Respuesta 200:** arreglo de objetos con estos campos (según `buscar_documentos` tras la migración `021`; **ya no incluye `archivo_url`**):
  `id, tipo, corte, subido_por, fecha_subida, temas (string[]|null), semestre, materia_id, materia_nombre, carrera_id, carrera_nombre, carrera_color, votos_count, comentarios_count, ya_voto`.
- **Errores:** `500 { error }`.
- **Limitaciones reales del handler:**
  - **No reenvía `orden` ni `anon_id`** a la función, aunque la función los soporta. Consecuencias: este endpoint siempre ordena por más recientes, y `ya_voto` es siempre `false` para visitantes anónimos. La página `/explorar` **no usa este endpoint**: llama a `buscar_documentos` directamente (vía RPC, con `orden` y `anon_id`).
  - Devuelve solo documentos con `estado = 'activo'`.

### `POST /api/documentos`

Sube un archivo y crea el registro.

- **Auth:** el handler no exige sesión. `subido_por` se llena con el usuario si existe, o `null`. La UI (`/subir`) **solo permite subir con sesión**; la subida anónima existe solo a nivel de API (y, para que funcione, la oferta debe existir ya porque `POST /api/ofertas` exige sesión).
- **Body (`multipart/form-data`):**

| Campo | Obligatorio | Detalle |
|---|---|---|
| `archivo` | Sí | Ver validaciones abajo. |
| `oferta_id` | Sí | uuid de una oferta existente. |
| `corte` | Sí | `quiz` \| `parcial_1` \| `parcial_2` \| `final`. El handler no lo valida; lo rechaza el `check` de la base. |
| `tipo` | No | Default `parcial`. Valores válidos en BD: `parcial`, `taller`, `apunte`, `nota`. El handler no lo valida; la UI siempre envía `parcial`. |
| `temas` | No | Campo repetible. Se recortan espacios, se descartan vacíos y duplicados (sin distinguir mayúsculas) y **se truncan en silencio a 8** (`MAX_TEMAS`). |

- **Validaciones sobre `archivo` (en este orden):**
  1. Extensión en la lista: `.pdf .jpg .jpeg .png .webp .doc .docx .xls .xlsx .ppt .pptx` **y** MIME en la lista blanca (cada uno por separado; el handler **no** exige que correspondan entre sí).
  2. No vacío.
  3. Máximo **15 MB** (`MAX_ARCHIVO_MB`).
  4. Los primeros bytes (firma "magic bytes") coinciden con la extensión (PDF, JPEG, PNG, WEBP, OLE para `.doc/.xls/.ppt`, ZIP para `.docx/.xlsx/.pptx`).
- **Proceso:** sube a Storage (bucket `documentos`) en la ruta `<oferta_id>/<timestamp>-<corte><extensión>`; inserta en `documentos` (`estado` queda en `activo`, es decir, **visible de inmediato, sin cola de aprobación**); si el insert falla, borra el archivo recién subido.
- **Respuesta 201:** `{ "id", "tipo", "corte", "fecha_subida", "temas" }`.
- **Errores:**

| Código | Mensaje |
|---|---|
| 400 | `Faltan campos requeridos: archivo, oferta_id, corte` |
| 400 | `Tipo de archivo no permitido. Usa PDF, imágenes JPG/PNG/WEBP o documentos Office.` |
| 400 | `El archivo está vacío.` |
| 400 | `El archivo no puede superar 15MB` |
| 400 | `El contenido del archivo no coincide con su extensión.` |
| 500 | Error de Storage (`uploadError.message`) |
| 500 | Error del insert (por ejemplo `corte`/`tipo` inválido, `oferta_id` inexistente, o RLS); el archivo subido se elimina. |

- **Notas:**
  - `archivo_url` se guarda con la URL pública de Storage, pero **el bucket es privado** (migración `021`): esa URL no sirve para descargar; el acceso real es por URL firmada (`POST /api/descargas`).
  - En Vercel las funciones tienen un límite de tamaño de cuerpo de petición (documentado por Vercel en torno a 4,5 MB; **no verificado** para tu plan/versión). El código permite 15 MB, así que podrían rechazarse archivos grandes antes de llegar al handler. No se probó.

### `GET /api/documentos/temas`

Sugerencias para el autocompletado de temas al subir. Llama a `sugerencias_temas(p_materia_id)`.

- **Auth:** ninguna.
- **Query:** `materia_id` (obligatorio, uuid).
- **Respuesta 200:** `["tema", ...]` — temas distintos usados en documentos `activo` de esa materia, ordenados alfabéticamente.
- **Errores:** `400 { error: "Falta materia_id" }` · `500 { error }`.

---

## Votos

### `POST /api/votos`

Marca "me sirvió". Llama a `votar_documento`.

- **Auth:** sesión, o `anon_id` si no hay sesión.
- **Body:** `{ "documento_id": "uuid", "anon_id": "uuid (solo sin sesión)" }`.
- **Respuesta 200:** `{ "votos_count": number, "ya_voto": boolean }`. Un voto repetido **no es un error**: devuelve el conteo actual con `ya_voto: true`.
- **Errores:** `400 { error: "Falta documento_id" }` · `500 { error }` (incluye `anon_id requerido para votar sin sesión`, `documento_id` inexistente o `anon_id` que no es UUID).
- Un voto por usuario (o por `anon_id`) por documento. No se puede quitar el voto (no hay endpoint).

---

## Comentarios

Regla de negocio: **un comentario por autor por documento**. Un segundo `POST` del mismo autor **actualiza** el existente (upsert).

### `GET /api/comentarios`

- **Auth:** ninguna.
- **Query:** `documento_id` (obligatorio) · `anon_id` (opcional; sirve para calcular `es_propio`).
- **Respuesta 200:** `[{ "id", "contenido", "created_at", "updated_at", "nombre_autor": "string|null", "es_propio": boolean }]`, orden ascendente por fecha. Solo comentarios con `estado = 'activo'`. `nombre_autor` es `null` para comentarios anónimos.
- **Errores:** `400 { error: "Falta documento_id" }` · `500 { error }`.

### `POST /api/comentarios`

- **Auth:** sesión, o `anon_id` si no hay sesión.
- **Body:** `{ "documento_id": "uuid", "contenido": "string", "anon_id": "uuid (solo sin sesión)" }`.
- **Validación:** `contenido` no vacío tras `trim`, máximo **500** caracteres.
- **Moderación automática (en la base, `comentar_documento`):** rechaza si contiene una palabra/frase de la tabla `palabras_prohibidas_comentarios` con `activa = true` (comparación sobre texto en minúsculas con signos reemplazados por espacios; **no normaliza tildes**), o si trae **2 o más** enlaces `http(s)://`.
- **Respuesta 201:** la fila completa que devuelve `comentar_documento` (`id, documento_id, usuario_id, anon_id, contenido, created_at, updated_at, estado`) más `"moderado": boolean`. Con el esquema actual `estado` siempre es `activo`, así que `moderado` es siempre `false`. (El tipo TypeScript del handler declara `nombre_autor` y `es_propio`, pero la función **no** los devuelve.)
- **Errores:**

| Código | Mensaje |
|---|---|
| 400 | `Faltan campos requeridos: documento_id, contenido` |
| 400 | `El comentario no puede superar 500 caracteres` |
| 422 | `El comentario contiene contenido no permitido.` (palabra prohibida) |
| 422 | `El comentario contiene demasiado spam o enlaces.` |
| 500 | Otro error de base (incluye `anon_id requerido para comentar sin sesión`) |

### `DELETE /api/comentarios`

Borra **físicamente** el comentario propio (distinto de la "eliminación" por moderación, que solo cambia `estado`).

- **Auth:** el dueño: con sesión, `usuario_id = auth.uid()`; sin sesión, el `anon_id` debe coincidir con el del comentario.
- **Body:** `{ "comentario_id": "uuid", "anon_id": "uuid (solo sin sesión)" }`.
- **Respuesta 200:** `{ "eliminado": true }`.
- **Errores:** `400 { error: "Falta comentario_id" }` · `403 { error }` — se usa 403 tanto para "no es tuyo" (`No tienes permiso para eliminar este comentario`) como para cualquier error de la base.

---

## Reportes

### `POST /api/reportes`

Llama a `registrar_reporte`.

- **Auth:** sesión, o `anon_id` si no hay sesión.
- **Body:** `{ "documento_id": "uuid" | "comentario_id": "uuid", "motivo": "string", "anon_id": "uuid (solo sin sesión)" }`. Debe venir **exactamente uno** de `documento_id` o `comentario_id`. `motivo` no vacío (sin límite de longitud en el handler).
- **Efecto secundario:** al llegar a **3 reportes** sobre el mismo documento, su `estado` pasa a `reportado` (sale de las búsquedas y entra a la cola de moderación). Igual para comentarios (`comentarios.estado = 'reportado'`, desaparece del listado público).
- **Respuesta 201:** `{ "id": "uuid" }`.
- **Errores:**

| Código | Mensaje |
|---|---|
| 400 | `Debes indicar exactamente uno: documento_id o comentario_id, y un motivo` |
| 409 | `Ya reportaste este documento` (el mismo mensaje se usa también para comentarios) |
| 500 | Otro error de base (incluye `anon_id requerido para reportar sin sesión`) |

- Los reportes de un mismo `anon_id` se deduplican, pero como el `anon_id` lo manda el cliente, quien genere UUID nuevos puede acumular 3 reportes y ocultar un documento (riesgo conocido; la migración `020` lo reconoce como protección "no fuerte").

---

## Descargas

### `POST /api/descargas`

Valida el límite de descargas gratuitas y, si procede, devuelve una **URL firmada de 60 segundos** del archivo (el bucket es privado).

- **Auth:** sesión, o `anon_id` si no hay sesión. **Requiere `SUPABASE_SERVICE_ROLE_KEY`** en el servidor.
- **Body:** `{ "documento_id": "uuid", "anon_id": "uuid (solo sin sesión)" }`.
- **Regla (`registrar_descarga`):** se permiten **2 documentos distintos** gratis; para el tercero hace falta haber subido al menos un documento (cuenta cualquier documento propio, sin filtrar por `estado`). Con sesión y un documento subido, las descargas son ilimitadas. Volver a pedir un documento ya descargado siempre se permite. Un visitante anónimo no puede desbloquear el límite.
- **Respuesta 200:**
  - `{ "permitido": true, "url": "<signed url>" }`
  - `{ "permitido": false }` — límite alcanzado (**no** es un error HTTP).
- **Errores:**

| Código | Mensaje |
|---|---|
| 400 | `Falta documento_id` |
| 404 | `Documento no encontrado` (el documento no existe o no está `activo`) |
| 500 | Error de base / `No se pudo generar el enlace de descarga` |

- **Detalle:** la descarga se registra **antes** de comprobar que el documento está `activo`; un documento no activo puede consumir una de las 2 descargas gratuitas y aun así responder 404.
- Si falta `SUPABASE_SERVICE_ROLE_KEY`, `createAdminClient()` lanza un `Error` no capturado → 500 genérico.

---

## Moderación

Todos requieren rol **supervisor** o **administrador**, comprobado con `is_moderador()` (en la base).

### `GET /api/moderacion/archivo`

- **Query:** `documento_id` (obligatorio).
- **Respuesta 200:** `{ "url": "<signed url>" }` (válida **120 s**). No pasa por el límite de descargas y funciona con documentos de cualquier `estado`.
- **Errores:** `400 { error: "Falta documento_id" }` · `403 { error: "No autorizado" }` · `404 { error: "Documento no encontrado" }` · `500 { error: "No se pudo generar el enlace" }`. Requiere `SUPABASE_SERVICE_ROLE_KEY`.

### `GET /api/moderacion/comentarios`

- **Respuesta 200:** arreglo de comentarios con `estado = 'reportado'` (más antiguos primero), cada uno con `id, contenido, created_at, updated_at, estado, perfiles{nombre}, documentos{id, corte, oferta{semestre, materia{nombre, carrera{nombre, color}}}}, reportes[{id, motivo, fecha}]`.
- **Errores:** `403 { error: "No autorizado" }` · `500 { error }`.
- **Sin uso en la UI:** la página `/moderacion` consulta Supabase directamente y no llama a este `GET`.

### `PATCH /api/moderacion/comentarios`

Resuelve un comentario reportado. Llama a `resolver_comentario_moderacion`.

- **Body:** `{ "comentario_id": "uuid", "estado": "activo" | "eliminado" }`.
- **Respuesta 200:** lo que devuelva la función SQL **(forma no verificada)**.
- **Errores:** `400 { error: "Faltan comentario_id o un estado de resolución válido" }` · `404 { error: "El comentario ya no está reportado o no existe" }` · `500 { error }`. El handler usa `.single()` y tiene una rama 404 para "sin resultado"; como `.single()` suele devolver un *error* (PGRST116) cuando no hay filas, es probable que ese caso llegue como 500 y no como 404 **(no verificado)**.
- **⚠ La función `resolver_comentario_moderacion` no está definida en ninguna migración del repo.** Si no existe en tu proyecto de Supabase, este endpoint responde 500 siempre. No se pudo comprobar si existe en producción.

### `/api/moderacion/palabras`

Gestiona la tabla `palabras_prohibidas_comentarios`. Las funciones SQL (`security definer`) verifican `is_moderador()` y lanzan `No autorizado`; **todos los errores de base se devuelven como 403** (también los que no son de permisos).

| Método | Body | Respuesta 200/201 | Errores |
|---|---|---|---|
| `GET` | — | `200 [{ "palabra", "activa" }]` ordenado por palabra | `403 { error }` |
| `POST` | `{ "palabra": "string" }` | `201 { "palabra", "activa": true }` (si ya existía, la reactiva) | `400 La palabra es obligatoria` · `403` |
| `PATCH` | `{ "palabra": "string", "activa": boolean }` | `200 { "palabra", "activa" }` | `400 Faltan palabra o un estado válido` · `404 La palabra no existe` · `403` |
| `DELETE` | `{ "palabra": "string" }` | `200 { "palabra" }` | `400 La palabra es obligatoria` · `404 La palabra no existe` · `403` |

La palabra se guarda en minúsculas y sin espacios en los extremos.

> **Sobre los 404 de `PATCH`/`DELETE`:** el handler tiene una rama 404 (`La palabra no existe`) basada en `if (!data)`, pero usa `.single()`, que normalmente devuelve un *error* (PGRST116) cuando la función no devuelve filas. Por eso, para una palabra inexistente es probable que la respuesta real sea **403** con el mensaje de PostgREST y no 404. No se ejecutó contra Supabase, así que queda **sin verificar**.

---

## Autenticación

### `GET /auth/confirm`

Cierra el flujo de confirmación de registro y de recuperación de contraseña. **No es JSON**: siempre responde con una redirección.

- **Query:**
  - `code` (flujo PKCE) → `exchangeCodeForSession(code)`; **o**
  - `token_hash` + `type` (tipo OTP de Supabase, p. ej. `signup`, `recovery`) → `verifyOtp({ type, token_hash })`.
  - `next` (opcional): ruta destino. Solo se acepta si empieza con `/` y no con `//` (evita redirecciones abiertas); si no, `/explorar`.
- **Respuesta:** redirección (307) a `next` si la verificación funciona; en cualquier otro caso a `/login?error=confirmacion`.
- Si `code` falla y también viene `token_hash`+`type`, intenta ese segundo camino antes de rendirse.

### Server actions (no son endpoints HTTP públicos)

- `logout()` — `src/lib/actions/auth.ts`: cierra sesión y redirige a `/`. Se usa en la Navbar y en el perfil.
- `login(formData)` — mismo archivo: **existe pero ninguna página lo importa**; el login real es `LoginForm.tsx`, que llama `signInWithPassword` desde el navegador.
- `actualizarPerfil(formData)` — `src/lib/actions/perfil.ts`: actualiza `nombre`, `carrera_id` y `semestre` (entero 1–10) del perfil propio.

El registro, la recuperación (`resetPasswordForEmail`) y el restablecimiento (`updateUser`) se hacen **directo contra Supabase Auth desde el navegador**, sin pasar por `/api`.

---

## Operaciones que NO pasan por `/api` (el cliente habla directo con Supabase)

Estas acciones no tienen endpoint; dependen únicamente de RLS:

| Acción | Dónde | Tabla/operación |
|---|---|---|
| Aprobar ("Mantener") o eliminar un documento reportado | `ModeracionCard.tsx` | `update documentos set estado` + `delete from reportes` |
| Eliminar un documento propio | `EliminarPropioButton.tsx` | `update documentos set estado = 'eliminado'` (**borrado lógico**; no borra el archivo de Storage) |
| Guardar / quitar favorito | `FavoritoButton.tsx` | `insert/delete favoritos` |
| Listar carreras en el registro | `registro/page.tsx` | `select carreras` |

---

## Pendiente / no existe todavía

No tengo acceso a conversaciones anteriores, así que no puedo saber qué se mencionó en ellas. Lo que sí comprobé: **los cuatro endpoints que mencionas — reportes, comentarios, votos y descargas — existen y están implementados** (`/api/reportes`, `/api/comentarios` con GET/POST/DELETE, `/api/votos`, `/api/descargas`).

Lo que **no existe** (no hay ruta, ni UI) y que otros documentos del repo sugieren o dan a entender:

- **Gestión de carreras, materias y sedes** por parte del administrador. `docs/DOCUMENTACION.md` lo lista como permiso del rol; en el código solo existen las políticas RLS (`for all using (is_admin())`); no hay endpoint ni pantalla.
- **Cambiar el rol de otro usuario** (asignar supervisores). Solo es posible por SQL (política "Perfiles: admin actualiza cualquiera"); no hay endpoint ni pantalla.
- **Endpoints para editar o eliminar documentos** (`PATCH/DELETE /api/documentos`): la eliminación y la moderación de documentos se hacen directo desde el cliente.
- **Quitar un voto** y **listar votos propios**.
- **Subida anónima desde la interfaz** (la API la tolera, la UI no la expone).
- **Elegir el `tipo` de documento** (`taller`, `apunte`, `nota`) en la UI: existen en el esquema y en la API, pero el formulario siempre envía `parcial`.
- **Paginación en la interfaz**: `/explorar` pide como máximo 24 resultados (búsqueda) o 3/6 (portada) sin botón de "ver más". Además, el enlace "Ver todos →" de la portada apunta a `/explorar?orden=recientes`, que `/explorar` **no trata como filtro** (solo `orden=utiles` lo hace), así que vuelve a mostrar la portada en lugar de un listado completo.
- **Limpieza de archivos** en Storage cuando un documento pasa a `eliminado`.

# Pruebas relacionadas

Se agregaron pruebas para verificar:

Votos API

Archivo:

tests/votos-api.test.ts

Casos:

Caso	      | Resultado
Sin         | documento_id	400
Voto        | correcto	200
Error RPC	  | 500

## Comentarios API
Archivo:

tests/comentarios-api.test.ts

Casos:

Caso	     | Resultado
Campos     | faltantes	400
Comentario | válido	201
Comentario | prohibido	422

## Documentos API

Archivo:

tests/documentos-api.test.ts

Casos:

Caso	                 |Resultado
Datos incompletos      |	400
Usuario no autenticado |	401
Documento válido	     | 201