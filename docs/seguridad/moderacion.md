# Seguridad de moderación

## Objetivo

Evitar contenido inapropiado mediante reportes y reglas automáticas.


## Reportes

Los usuarios pueden reportar:

- documentos;
- comentarios.


La función:

registrar_reporte()


controla:

- duplicados;
- cantidad de reportes;
- cambio automático a estado reportado.


## Estados de contenido

Comentarios:

activo
 |
reportado
 |
eliminado


Documentos:

activo
 |
reportado
 |
eliminado


## Moderadores

Solo usuarios con permisos:

- supervisor
- administrador


pueden acceder a:

/moderacion


## Resolución de comentarios

La función:

resolver_comentario_moderacion()


permite:

- mantener comentario;
- eliminar comentario.


La operación es atómica para evitar conflictos entre moderadores.