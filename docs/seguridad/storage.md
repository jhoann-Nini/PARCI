# Seguridad Storage PARCI

## Bucket documentos

- Bucket: documentos
- Visibilidad: privado

## Subida

Política:
- Storage documentos: subida autenticada

Regla:
- Solo usuarios autenticados pueden insertar archivos.

## Eliminación

Política:
- Storage documentos: solo admin elimina

Regla:
- Solo usuarios con rol admin pueden eliminar.

## Descargas

Los archivos no usan URLs públicas.

Flujo:

Usuario → API → createSignedUrl() → URL temporal

TTL:

- Usuarios: 60 segundos
- Moderación: 120 segundos

## Formatos

Archivos permitidos:

- PDF
- JPG/JPEG
- PNG
- WEBP
- DOCX
- XLSX
