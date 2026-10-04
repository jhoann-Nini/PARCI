# Autorización y permisos

## Modelo de autorización

PARCI utiliza una combinación de:

- Row Level Security (RLS)
- funciones PostgreSQL RPC
- validaciones en Route Handlers


## Roles

| Rol | Permisos |
|---|---|
| Visitante | Consultar contenido público |
| Usuario | Subir documentos, comentar, votar, guardar favoritos |
| Supervisor | Moderación de contenido reportado |
| Administrador | Gestión administrativa |


## Seguridad mediante RLS

Las tablas sensibles utilizan políticas RLS.

Ejemplos:

- usuarios solo pueden modificar sus propios documentos;
- usuarios solo pueden eliminar sus propios comentarios;
- favoritos pertenecen únicamente al usuario propietario.


## Funciones de autorización

Funciones principales:

is_admin()

is_moderador()


Estas funciones son utilizadas para validar permisos dentro de operaciones críticas.


## Operaciones protegidas

Ejemplos:

- moderación;
- eliminación de contenido;
- gestión de palabras prohibidas;
- generación de URLs firmadas.