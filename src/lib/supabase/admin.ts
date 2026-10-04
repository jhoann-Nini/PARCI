import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente con la service_role key — bypassea RLS por completo.
 *
 * SOLO se usa en código server-side (API routes), NUNCA en un
 * componente 'use client' ni en nada que llegue al bundle del
 * navegador. La variable de entorno NO lleva prefijo NEXT_PUBLIC_
 * a propósito: Next.js solo expone al cliente las variables que
 * empiezan con ese prefijo, así que SUPABASE_SERVICE_ROLE_KEY queda
 * fuera del bundle mientras nadie la renombre.
 *
 * Uso actual: emitir signed URLs de corta duración para el bucket
 * privado 'documentos', solo después de que registrar_descarga()
 * confirmó que la descarga está permitida (ver /api/descargas).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno'
    )
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
