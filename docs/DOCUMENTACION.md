# Documentación técnica — Parci

Banco de parciales de la Universidad del Valle, sede Tuluá. Permite buscar, subir, votar, comentar y reportar exámenes anteriores organizados por carrera, materia, semestre y corte.

Para el *porqué* de cada decisión de arquitectura, ver [`docs/ADRs.md`](./ADRs.md). Este documento describe el *cómo* está construido hoy.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Server Components) |
| UI | React 19, Tailwind CSS v4 (`@theme inline`, sin `tailwind.config.ts`) |
| Backend | Supabase (Postgres + Auth + Storage + RLS) |
| Hosting | Vercel (deploy automático al hacer push a `main`) |
| Correo transaccional | Mailer por defecto de Supabase Auth (ver [Correo y autenticación](#correo-y-autenticación)) |

No hay backend propio: las rutas en `src/app/api/*` son delgadas — validan input y llaman a Supabase (tablas o funciones RPC) usando RLS como capa de autorización real.

## Estructura del proyecto

```
src/
  app/
    (auth)/login/            Login (LoginForm.tsx, client)
    (auth)/registro/         Registro (client)
    (main)/explorar/         Home — búsqueda y listado de parciales
    (main)/subir/            Formulario de subida (requiere sesión)
    (main)/moderacion/       Cola de moderación (supervisor/administrador)
    (main)/layout.tsx        Navbar + footer compartidos
    api/                     Route handlers (carreras, materias, ofertas,
                              documentos, votos, comentarios, reportes)
    auth/confirm/route.ts    Verifica el token_hash del correo de confirmación
    proxy.ts                 Middleware de Next 16 — refresca la sesión de
                              Supabase en cada request (reemplaza middleware.ts)
  components/
    layout/Navbar.tsx
    parciales/                ExamenCard, ModeracionCard, VotoButton,
                               ComentariosPanel, ReportarButton,
                               EliminarPropioButton
    ui/                        Button, Card, Input, Modal, Badge, Logo, ...
  lib/
    supabase/{client,server,middleware}.ts   Clientes Supabase (browser/server/proxy)
    actions/auth.ts           Server actions: login, logout
    anonId.ts                 Identificador anónimo (cookie + localStorage)
    constants.ts               DOMINIO_CORREO, SEMESTRES, CORTES, límites de archivo
  types/index.ts               Tipos compartidos (reflejan el esquema de Postgres)
supabase/
  migrations/                  001..016, aplicadas en orden
  seed.sql
```

## Modelo de datos

Todas las tablas viven en el esquema `public` y tienen RLS habilitado. Relación de alto nivel:

```
sedes ← carreras ← materias ← ofertas (materia × semestre) ← documentos
                                                                  ├─ votos
                                                                  ├─ comentarios
                                                                  └─ reportes (doc o comentario)
perfiles (1:1 con auth.users)
```

- **`sedes`** — hoy solo existe la sede de Tuluá. `carreras.sede_id` apunta acá; se dejó por si la app se expande a otra sede.
- **`carreras`** — `nombre`, `color` (`aula` | `musgo` | `ocre` | `ciruela`, usado para las etiquetas visuales).
- **`materias`** — pertenecen a una carrera.
- **`ofertas`** — la oferta de una materia en un semestre (`materia_id`, `semestre`, unique). Hasta la migración `016` incluía `profesor_id`; se quitó por completo (ver [ADR-011](./ADRs.md#adr-011-eliminación-del-profesor-de-toda-la-app)) — ya no existe tabla `profesores`.
- **`documentos`** — el archivo subido. `tipo` (`parcial`/`taller`/`apunte`/`nota`), `corte` (`quiz`/`parcial_1`/`parcial_2`/`final`), `estado` (`activo`/`reportado`/`eliminado`), `subido_por` nullable (subida anónima permitida).
- **`perfiles`** — extiende `auth.users` 1:1, se crea automáticamente por trigger (`handle_new_user`) al registrarse. `rol`: `usuario` | `supervisor` | `administrador`.
- **`votos`** — "me sirvió" por documento. Autor es `usuario_id` (logueado) *o* `anon_id` (visitante sin cuenta) — nunca ambos (`votos_autor_check`). Un voto por autor por documento.
- **`comentarios`** — mismo patrón logueado/anónimo que votos. Un comentario por autor por documento (el segundo POST hace *upsert*, no crea uno nuevo — así se implementa "editar mi comentario").
- **`reportes`** — referencia `documento_id` *o* `comentario_id` (nunca ambos), autor logueado o anónimo. Con **3+ reportes** sobre el mismo documento, `registrar_reporte()` lo pasa automáticamente a `estado = 'reportado'`.

`info_sede` existió (biblioteca, bienestar, admisiones...) y se eliminó en la migración `012`: quedó fuera de alcance del MVP.

### Funciones RPC (Postgres)

Encapsulan lógica que necesita `security definer` (saltar RLS de forma controlada) o evitar joins repetidos desde el cliente:

- **`buscar_documentos(...)`** — el endpoint de búsqueda real. Filtra por carrera/materia/semestre/corte/texto libre, ordena por `recientes` o `utiles` (votos), y devuelve `votos_count`, `comentarios_count` y `ya_voto` ya resueltos.
- **`votar_documento(p_documento_id, p_anon_id)`** — inserta el voto (usuario o anónimo) y devuelve el conteo actualizado + si ya existía.
- **`comentar_documento(p_documento_id, p_contenido, p_anon_id)`** — upsert del comentario propio.
- **`obtener_comentarios(p_documento_id, p_anon_id)`** — lista comentarios con el nombre del autor resuelto (necesario porque RLS de `perfiles` solo deja ver el propio perfil) y `es_propio` calculado server-side.
- **`registrar_reporte(p_documento_id | p_comentario_id, p_motivo)`** — insert + conteo + auto-flag en una operación atómica.
- **`handle_new_user()`** (trigger) — crea la fila en `perfiles` cuando Supabase Auth crea el usuario.
- **`is_admin()` / `is_moderador()`** — helpers `security definer` usados en las policies de RLS.
- **`evitar_autoascenso_rol()`** (trigger) — si alguien intenta cambiar su propio `rol` sin ser administrador, el trigger revierte el cambio silenciosamente.

## Roles y permisos

| Rol | Puede |
|---|---|
| Visitante (sin cuenta) | Ver y buscar documentos activos, votar, comentar y reportar (vía `anon_id`) |
| `usuario` | Todo lo anterior + subir documentos, eliminar los propios (`estado = 'eliminado'`, no borra la fila), editar sus comentarios |
| `supervisor` | Todo lo de `usuario` + ver/moderar la cola de reportes, cambiar `estado` de cualquier documento |
| `administrador` | Todo lo anterior + gestionar carreras/materias/sedes, cambiar el rol de otros usuarios |

La autorización real vive en las políticas RLS de Postgres (`supabase/migrations/002_rls_policies.sql` y siguientes), no en el código de Next.js — las API routes confían en que RLS rechazará lo que no corresponda.

## Flujos principales

**Registro** (`/registro`, cliente) → `supabase.auth.signUp()` con `emailRedirectTo` apuntando a `/auth/confirm`. Solo se aceptan correos `@correounivalle.edu.co` (`DOMINIO_CORREO`, validación client-side). Si el correo ya existe, Supabase responde 200 sin error (anti-enumeración) pero con `identities: []` — el cliente detecta eso y muestra "ese correo ya está registrado" en vez de la pantalla de éxito.

**Confirmación** (`src/app/auth/confirm/route.ts`) → recibe `token_hash` + `type` en la URL (no `code`, no el `{{ .ConfirmationURL }}` genérico de Supabase) y llama `supabase.auth.verifyOtp()` server-side. La plantilla de correo en Supabase Dashboard debe construir el link como `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/explorar` — usar `{{ .ConfirmationURL }}` rompe este flujo.

**Login/Logout** — server actions en `src/lib/actions/auth.ts`; `LoginForm.tsx` también llama `signInWithPassword` directo desde el cliente para poder mostrar el error sin recargar.

**Sesión en cada request** — `src/proxy.ts` (Next.js 16 renombró `middleware.ts` → `proxy.ts`) llama `updateSession()` en cada navegación para refrescar el JWT de Supabase en las cookies.

**Explorar** (`/explorar`, server component) — carga carreras para el filtro y llama `buscar_documentos` vía RPC con los `searchParams` de la URL. El identificador anónimo (`parci_anon_id`, cookie) se lee server-side para resolver `ya_voto` en el primer render sin parpadeo.

**Subir** (`/subir`, requiere sesión) — `SubirForm.tsx` primero resuelve/crea la `oferta` (`POST /api/ofertas`, materia × semestre) y luego sube el archivo (`POST /api/documentos`, multipart). El archivo va a Supabase Storage (bucket público `documentos`), y si el insert en `documentos` falla, se hace rollback borrando el archivo ya subido.

**Votar/Comentar/Reportar sin cuenta** — `src/lib/anonId.ts` genera un UUID la primera vez (cookie + localStorage como respaldo) y lo manda en cada request. No es un mecanismo de seguridad, solo evita doble voto/spam básico desde el mismo navegador.

**Moderación** (`/moderacion`, requiere `supervisor` o `administrador`, chequeado server-side con `redirect()` si no aplica) — lista documentos `reportado` y `activo` con sus reportes, y permite cambiar el `estado`.

**Eliminar documento propio** (`EliminarPropioButton.tsx`) — el dueño puede pasar su propio documento a `estado = 'eliminado'` directamente desde el cliente (RLS permite `update` cuando `subido_por = auth.uid()`), sin pasar por un reporte.

## Correo y autenticación

Estado actual (2026-08): Supabase Auth usa su **mailer por defecto** (no SMTP custom) — límite de **2 correos/hora**, sin SLA, pensado solo para desarrollo/bajo volumen. La plantilla de "Confirm signup" en el Dashboard de Supabase ya está personalizada con el branding de Parci y el link correcto (`token_hash`/`type`, ver arriba).

Hay una integración de Resend instalada a nivel de equipo en Vercel, pero **desactivada**: solo se provisionó en modo prueba (sin dominio propio), lo que hace fallar `signUp` con 500 para cualquier correo que no sea el del dueño de la cuenta de Resend. Retomar Resend en producción requiere verificar un dominio propio primero.

## Variables de entorno

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente Supabase (browser y server) |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo para scripts/admin (no se usa en rutas de la app) |
| `NEXT_PUBLIC_DOMINIO_CORREO` | Dominio institucional aceptado en el registro (default `correounivalle.edu.co`) |
| `NEXT_PUBLIC_APP_URL` | URL base de la app |

Se gestionan en Vercel (`vercel env pull` para desarrollo local) y se despliegan automáticamente con cada push a `main`.

## Despliegue

Push a `main` en [jhoann-Nini/PARCI](https://github.com/jhoann-Nini/PARCI) dispara un deploy automático en Vercel. No hay ambiente de staging separado — las migraciones de `supabase/migrations/` se aplican a mano contra el proyecto de Supabase (no hay CLI de Supabase ni `config.toml` en el repo todavía).
