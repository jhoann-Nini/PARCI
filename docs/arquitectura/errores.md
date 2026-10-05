# Sistema centralizado de manejo de errores API
### Objetivo

Implementar un sistema uniforme para manejar errores en los endpoints API de PARCI, evitando respuestas inconsistentes y facilitando la depuración, mantenimiento y escalabilidad del proyecto.

Antes de esta implementación cada endpoint manejaba errores directamente:

´´´
return NextResponse.json(
  { error: error.message },
  { status: 500 }
)
´´´

Esto generaba respuestas diferentes entre rutas y dificultaba identificar el tipo de error.

Ahora todas las APIs pueden utilizar una estructura común.

# Arquitectura implementada
La solución está dividida en tres componentes:
src/
 └── lib/
     └── errors/
         ├── ApiError.ts
         ├── errorCodes.ts
         └── handleApiError.ts

### 1. Códigos de error

## Archivo:
src/lib/errors/errorCodes.ts

## Propósito
Centraliza los códigos utilizados por la API.

Ejemplo:
export const ERROR_CODES = {
  MISSING_FIELDS: "MISSING_FIELDS",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  DATABASE_ERROR: "DATABASE_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
}

## Ventajas
Evita escribir códigos manualmente.
Permite identificar errores desde frontend.
Facilita integración futura con monitoreo.
Mantiene consistencia entre endpoints.

### 2. Clase ApiError

Archivo:

src/lib/errors/ApiError.ts
Propósito

Crear errores controlados dentro de la aplicación.

Ejemplo:

throw new ApiError(
  "MISSING_FIELDS",
  "Falta documento_id",
  400
)

## Estructura

Un error contiene:

Propiedad   | Descripción
code	    | Identificador del error
message	    | Mensaje para el cliente
status	    | Código HTTP

Ejemplo de respuesta:

{
  "success": false,
  "error": {
    "code": "MISSING_FIELDS",
    "message": "Falta documento_id"
  }
}

### 3. Handler global de errores

Archivo:

src/lib/errors/handleApiError.ts
Propósito

Convertir cualquier error ocurrido en una respuesta HTTP estándar.

Ejemplo:

try {

  // lógica del endpoint

}

catch(error){

  return handleApiError(error)

}
Respuestas generadas
Error de validación

HTTP:

400 Bad Request

Respuesta:

{
 "success":false,
 "error":{
   "code":"MISSING_FIELDS",
   "message":"Falta documento_id"
 }
}
Error de autenticación

HTTP:

401 Unauthorized

Respuesta:

{
 "success":false,
 "error":{
   "code":"UNAUTHORIZED",
   "message":"Debes iniciar sesión"
 }
}
Error interno

HTTP:

500 Internal Server Error

Respuesta:

{
 "success":false,
 "error":{
   "code":"INTERNAL_ERROR",
   "message":"Error interno del servidor"
 }
}

## Uso en endpoints API

Ejemplo:

Archivo:

src/app/api/votos/route.ts

Antes:

if(!documento_id){

 return NextResponse.json(
 {
  error:"Falta documento_id"
 },
 {
  status:400
 }
 )

}

Después:

if(!documento_id){

 throw new ApiError(
   "MISSING_FIELDS",
   "Falta documento_id",
   400
 )

}

## Flujo del manejo de errores
Cliente
  |
  |
  v
API Route
  |
  |
  +---- Validación
  |
  +---- Supabase
  |
  +---- Lógica negocio
  |
  v
ApiError
  |
  v
handleApiError()
  |
  v
Respuesta JSON estándar

## Beneficios obtenidos
Desarrollo

✅ Menos código repetido
✅ Errores más fáciles de rastrear
✅ Endpoints más limpios
✅ Mejor mantenimiento

## Frontend

Ahora el cliente puede trabajar con códigos:

Ejemplo:

if(error.code === "MISSING_FIELDS"){
   mostrarFormulario();
}

En lugar de comparar textos:

if(error.message === "Falta documento_id")

## Seguridad

Permite ocultar información sensible.

Antes:

{
 "error":"relation usuarios.password does not exist"
}

Ahora:

{
 "error":{
   "code":"DATABASE_ERROR",
   "message":"Error interno del servidor"
 }
}