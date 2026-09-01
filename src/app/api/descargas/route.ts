import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { STORAGE_BUCKET } from '@/lib/constants'

// Vigencia corta a propósito: la URL firmada solo debe servir para
// abrir el archivo en el momento; no debe quedar utilizable si se
// copia o queda cacheada en el historial del navegador.
const SIGNED_URL_TTL_SEGUNDOS = 60

// POST /api/descargas — valida el límite de descargas gratuitas
// (2 documentos distintos sin subir nada) y, solo si está permitido,
// emite una signed URL de corta duración para el archivo real.
// El bucket es privado (migración 021): sin pasar por aquí no hay
// forma de llegar al PDF, a diferencia del esquema anterior donde
// archivo_url ya venía en la búsqueda pública.
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const body = await request.json()
  const { documento_id, anon_id } = body

  if (!documento_id) {
    return NextResponse.json({ error: 'Falta documento_id' }, { status: 400 })
  }

  const { data, error } = await supabase
    .rpc('registrar_descarga', { p_documento_id: documento_id, p_anon_id: anon_id ?? null })
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { permitido } = data as { permitido: boolean }

  if (!permitido) {
    return NextResponse.json({ permitido: false })
  }

  // Documento activo: la misma condición que ya exige la policy
  // pública de RLS, así que esto no abre nada que no estuviera
  // disponible antes vía el buscador.
  const { data: doc, error: docError } = await supabase
    .from('documentos')
    .select('archivo_path')
    .eq('id', documento_id)
    .eq('estado', 'activo')
    .single()

  if (docError || !doc) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
  }

  const admin = createAdminClient()
  const { data: signed, error: signError } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(doc.archivo_path, SIGNED_URL_TTL_SEGUNDOS)

  if (signError || !signed) {
    return NextResponse.json({ error: 'No se pudo generar el enlace de descarga' }, { status: 500 })
  }

  return NextResponse.json({ permitido: true, url: signed.signedUrl })
}
