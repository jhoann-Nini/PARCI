# Documentación técnica — Parci
Versión del documento: 1.0.0  
Última actualización: 04/10/2026  
Rama de referencia: main

Parci es un banco de parciales para estudiantes de la Universidad del Valle, sede Tuluá. La aplicación permite explorar documentos académicos, subir material, votar, comentar, reportar contenido, guardar favoritos y realizar moderación.

> **Fuente de verdad:** esta documentación describe el código y las migraciones versionadas en `main`. No se afirma que el proyecto Supabase remoto tenga exactamente el mismo estado si existen cambios manuales o migraciones que no hayan sido aplicadas allí.

## 1. Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.3.4, App Router |
| UI | React 19.2.4, Tailwind CSS 4 |
| Lenguaje | TypeScript 5.x |
| Backend/BaaS | Supabase |
| Base de datos | PostgreSQL |
| Autenticación | Supabase Auth |
| Archivos | Supabase Storage |
| Autorización | PostgreSQL RLS + funciones RPC |
| Producción | Vercel |
| Pruebas | Vitest 5 |
| Contenedores | Docker, Node.js 22 Alpine |

No existe un backend Node/Express separado. Las rutas de `src/app/api` son Route Handlers de Next.js.

## 2. Estructura

```
src/
  app/
    (auth)/                 # login, registro, recuperación y reset
    (main)/                 # explorar, subir, perfil y moderación
    api/                    # Route Handlers
    auth/confirm/           # confirmación de Supabase Auth
    privacidad/             # información de privacidad
  components/
    explorar/
    layout/
    moderacion/
    parciales/
    ui/
  lib/
    actions/
    supabase/
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

## 3. Modelo de datos

Las migraciones actuales definen estas tablas principales:

- `sedes`: sedes académicas.
- `carreras`: carreras asociadas a una sede.
- `perfiles`: extensión de `auth.users`, con nombre, carrera, semestre y rol.
- `materias`: materias pertenecientes a una carrera.
- `ofertas`: relación materia + semestre.
- `documentos`: material académico y sus metadatos.
- `votos`: valoración "me sirvió".
- `comentarios`: comentarios de usuarios autenticados o visitantes identificados por `anon_id`.
- `reportes`: reportes de documentos o comentarios.
- `descargas`: registro de documentos distintos descargados.
- `favoritos`: documentos guardados por usuarios.
- `palabras_prohibidas_comentarios`: reglas configurables de moderación.

### Relación principal

```
sedes
  └── carreras
        └── materias
              └── ofertas (materia + semestre)
                    └── documentos
                          ├── votos
                          ├── comentarios
                          ├── reportes
                          ├── descargas
                          └── favoritos

perfiles ── auth.users
```

La entidad `profesores` ya no forma parte del modelo actual. La migración `016_quitar_profesores.sql` eliminó la tabla y `ofertas.profesor_id).

## 4. Roles

| Rol | Alcance |
|---|---|
| Visitante | Explorar contenido activo y usar operaciones anónimas compatibles con `anon_id`. |
| `usuario` | Funciones de visitante + subida y gestión de contenido propio + favoritos. |
| `supervisor` | Funciones de usuario + moderación. |
| `administrador` | Funciones de supervisor + gestión administrativa y roles. |

La autorización de datos se aplica principalmente mediante RLS y funciones SQL. Los helpers principales son `is_admin()` e `is_moderador()`.

## 5. Autenticación

Supabase Auth gestiona:

- registro institucional;
- confirmación de correo;
- inicio y cierre de sesión;
- recuperación de contraseña;
- restablecimiento de contraseña.

El registro restringe el dominio configurado por `NEXT_PUBLIC_DOMINIO_CORREO`; si no se define, el código usa `correounivalle.edu.co).

El perfil se crea mediante un trigger de base de datos.

La confirmación se gestiona mediante `src/app/auth/confirm/route.ts`.

## 6. Identificador anónimo

`src/lib/anonId.ts` genera un UUID llamado `parci_anon_id` y lo conserva mediante cookie y localStorage.

Se utiliza para identificar de forma básica a visitantes sin cuenta en operaciones como votos, comentarios, reportes y descargas.

No debe considerarse un mecanismo antifraude fuerte.

## 7. Documentos y Storage

La interfaz de subida está en `/subir` y requiere sesión.

El flujo es:

1. Resolver o crear una oferta mediante `POST /api/ofertas`.
2. Enviar el archivo mediante `POST /api/documentos`.
3. Validar extensión, MIME, tamaño y firma binaria.
4. Subir el objeto a Supabase Storage.
5. Crear el registro correspondiente en `documentos`.

Tipos admitidos:

- PDF
- JPG/JPEG
- PNG
- WEBP
- DOC/DOCX
- XLS/XLSX
- PPT/PPTX

Límite: 15 MB.

El bucket de documentos es privado. El acceso al archivo se realiza mediante URLs firmadas de corta duración.

El modelo conserva `archivo_path` como referencia al objeto de Storage. `archivo_url` forma parte del modelo histórico y no debe tratarse como un enlace público de acceso.

## 8. Descargas

`POST /api/descargas` utiliza `registrar_descarga()` para controlar el límite de descargas.

Regla actual:

- hasta 2 documentos distintos para un autor que no haya subido material;
- un usuario autenticado que ya haya subido un documento puede continuar descargando;
- volver a descargar el mismo documento no consume otro cupo.

Una vez autorizado el acceso, el servidor genera una signed URL de 60 segundos mediante el cliente con service role.

La ruta de moderación genera signed URLs de 120 segundos.

## 9. Votos, comentarios y reportes

### Votos

`POST /api/votos` utiliza `votar_documento()` y evita duplicados por usuario o `anon_id`.

### Comentarios

Se pueden crear, consultar, editar y eliminar comentarios propios.

`comentar_documento()` realiza un upsert por autor + documento.

Los comentarios tienen estados `activo`, `reportado` y `eliminado`, y existen reglas de moderación para palabras prohibidas y spam por enlaces.

### Reportes

`POST /api/reportes` permite reportar documentos o comentarios.

`registrar_reporte()` controla duplicados y el umbral de reportes que activa la moderación.

## 10. Moderación

La sección `/moderacion` está restringida a supervisores y administradores.

Incluye:

- documentos reportados;
- comentarios reportados;
- resolución de comentarios;
- gestión de palabras prohibidas;
- generación de URLs firmadas para revisar archivos.

## 11. RPC principales

Las migraciones versionadas contienen, entre otras, estas funciones:

```
buscar_documentos
contar_documentos
sugerencias_temas
votar_documento
comentar_documento
obtener_comentarios
eliminar_comentario
registrar_reporte
registrar_descarga
resolver_comentario_moderacion
listar_palabras_prohibidas
agregar_palabra_prohibida
cambiar_estado_palabra_prohibida
eliminar_palabra_prohibida
is_admin
is_moderador
```

La función `buscar_documentos()` actual ya no recibe ni consulta información de profesores.

## 12. API

El inventario completo de Route Handlers está en [`API.md`](../API.md).

Incluye rutas para:

- carreras;
- materias;
- ofertas;
- documentos;
- temas;
- votos;
- comentarios;
- reportes;
- descargas;
- moderación de documentos;
- moderación de comentarios;
- palabras prohibidas.

## 13. Variables de entorno

Las variables utilizadas actualmente por la aplicación son:

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Operaciones server-side que requieren privilegios, como signed URLs |
| `NEXT_PUBLIC_DOMINIO_CORREO` | Dominio institucional permitido |

No se requiere `NEXT_PUBLIC_APP_URL` para el flujo actual de autenticación.

No existe integración SMTP/Resend en el código de la aplicación.

## 14. Pruebas

El repositorio contiene:

- `tests/constants.test.ts`
- `tests/utils.test.ts`
- `tests/validaciones.test.ts`

Estas son pruebas unitarias. El repositorio no debe presentarse como si tuviera cobertura integral de RLS, Storage o pruebas end-to-end.

## 15. Despliegue

La aplicación está preparada para:

- desarrollo local con Node.js;
- ejecución con Docker;
- despliegue en Vercel.

Las migraciones de Supabase se versionan en Git, pero el repositorio no contiene Supabase CLI ni `config.toml`, por lo que no se debe afirmar que GitHub aplique automáticamente las migraciones al proyecto remoto.

## 16. Decisiones arquitectónicas

Las decisiones importantes del proyecto se documentan en:

docs/ADRs.md

Incluyen:

- elección de Supabase como plataforma backend;
- uso de Next.js App Router;
- almacenamiento privado de archivos;
- autorización mediante funciones PostgreSQL;
- estrategia de moderación.

## 17. Alcance de esta documentación

Esta documentación reemplaza descripciones históricas que todavía mencionaban profesores, Storage público o una versión anterior del esquema.

Los ADR de `docs/ADRs.md` conservan decisiones históricas y las decisiones que fueron superadas, por lo que no deben interpretarse como una descripción literal del estado actual.

Cuando exista una diferencia entre documentación y código, la fuente de verdad para el comportamiento actual es el código TypeScript y las migraciones SQL de `main`.
