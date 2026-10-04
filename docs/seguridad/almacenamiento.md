# Seguridad de almacenamiento

## Supabase Storage

Los documentos académicos se almacenan en un bucket privado.


Los archivos no tienen URL pública permanente.


## Flujo de acceso

Usuario
 |
Solicitud descarga
 |
Validación permisos
 |
Generación URL firmada
 |
Acceso temporal


## Archivos permitidos

Extensiones:

- PDF
- JPG
- JPEG
- PNG
- WEBP
- DOC
- DOCX
- XLS
- XLSX
- PPT
- PPTX


Tamaño máximo:

15 MB


## Validación de archivos

Antes de almacenar un documento se valida:

- extensión;
- tipo MIME;
- tamaño;
- firma binaria.


## Referencia en base de datos

La tabla documentos almacena:

archivo_path


No se utiliza archivo_url como enlace público.


## URLs firmadas

Descargas normales:

60 segundos


Revisión de moderación:

120 segundos