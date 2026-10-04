# Autenticación en PARCI

## Descripción

PARCI utiliza Supabase Auth como sistema de autenticación.

La autenticación permite gestionar:

- registro de usuarios;
- confirmación de correo institucional;
- inicio de sesión;
- cierre de sesión;
- recuperación de contraseña;
- restablecimiento de contraseña.


## Registro

El registro está restringido a correos institucionales.

Variable utilizada:

NEXT_PUBLIC_DOMINIO_CORREO


Si la variable no está definida, el sistema utiliza:

correounivalle.edu.co


## Flujo de autenticación

Usuario
 |
 | Registro
 ↓
Supabase Auth
 |
 | Confirmación correo
 ↓
Creación de perfil
 |
 ↓
Acceso a la aplicación


## Gestión del perfil

La tabla perfiles extiende la información del usuario autenticado:

- nombre
- carrera
- semestre
- rol


La relación principal es:

auth.users
      |
      |
 perfiles


## Sesiones

Las sesiones son administradas por Supabase Auth.

El cliente servidor utiliza:

src/lib/supabase/server.ts

El cliente navegador utiliza:

src/lib/supabase/client.ts