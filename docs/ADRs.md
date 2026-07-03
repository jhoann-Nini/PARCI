# Architecture Decision Records — Parci

## ADR-001: Next.js 16 App Router
**Decisión:** App Router (no Pages Router)
**Razón:** Server Components reducen el JS enviado al cliente — crítico para móvil con conexión limitada. Permite hacer queries a Supabase en el servidor sin exponer claves al cliente.

## ADR-002: Supabase como backend completo
**Decisión:** Supabase (no backend Node/Express propio)
**Razón:** Auth con restricción por dominio de correo, RLS a nivel de fila, Storage para PDFs, y Postgres real — todo en uno. Evita semanas de infraestructura que no aportan valor al MVP.

## ADR-003: Mobile-first
**Decisión:** Diseño y desarrollo priorizando pantalla de celular
**Razón:** El canal de distribución principal es WhatsApp/Telegram. Un link compartido en un grupo se abre en el teléfono, no en desktop.

## ADR-004: Lectura pública sin registro
**Decisión:** Ver y buscar parciales no requiere crear cuenta
**Razón:** Un visitante que llega desde un link en WhatsApp no debe encontrar una pantalla de login. El registro se pide solo al intentar subir contenido.

## ADR-005: Correo institucional como filtro de registro
**Decisión:** Solo @correounivalle.edu.co puede registrarse
**Razón:** Es el filtro anti-spam más simple disponible sin construir un sistema de moderación complejo desde el inicio.

## ADR-006: Catálogo cerrado de profesores con autocomplete + creación
**Decisión:** Profesores viven en tabla `profesores`; se seleccionan con autocomplete y se puede crear uno nuevo si no existe
**Razón:** Evita duplicados fragmentados ("J. Peña" vs "Julián Peña") que romperían la búsqueda por profesor.

## ADR-007: Tabla OFERTAS como entidad central
**Decisión:** La relación materia × profesor × semestre se guarda como una entidad propia (no como columnas repetidas en DOCUMENTOS)
**Razón:** Un profesor puede dictar la misma materia en distintos semestres, y una materia puede tener distintos profesores. Normalizar esto evita inconsistencias y facilita filtros combinados.

## ADR-008: Moderación liviana desde el inicio
**Decisión:** Tabla REPORTES y campo `estado` en DOCUMENTOS incluidos en MVP
**Razón:** En cuanto se sube contenido con nombres de profesores reales, se necesita poder retirar algo de circulación rápido. Es más barato construirlo ahora que agregarlo bajo presión después.

## ADR-009: Tailwind CSS v4 (CSS-based theme)
**Decisión:** Colores y tokens de diseño definidos en CSS con `@theme inline`, no en `tailwind.config.ts`
**Razón:** Next.js 16 viene con Tailwind v4 por defecto, que eliminó el archivo de configuración JS en favor de directivas CSS nativas.

## ADR-010: Función SQL `buscar_documentos` para búsqueda
**Decisión:** La búsqueda de documentos con joins completos se encapsula en una función PostgreSQL llamada via `supabase.rpc()`
**Razón:** Evita repetir joins anidados de 4 tablas (documentos → ofertas → materias/profesores → carreras) en múltiples rutas. La función vive en la migración y es versionable.
