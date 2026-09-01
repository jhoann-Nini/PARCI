import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { STORAGE_BUCKET } from '@/lib/constants'

const SIGNED_URL_TTL_SEGUNDOS = 120

// GET /api/moderacion/archivo?documento_id=... — signed URL para que
// un moderador revise un documento reportado, sin pasar por el
// límite de "2 descargas gratis" (eso es para el público, no para
// quien está moderando). Requiere ser supervisor/administrador:
// is_moderador() ya vive en la base y es la misma función que usan
// las policies de RLS, así que el criterio queda en un solo lugar.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const documentoId = searchParams.get('documento_id')

  if (!documentoId) {
    return NextResponse.json({ error: 'Falta documento_id' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: esModerador, error: rolError } = await supabase.rpc('is_moderador')

  if (rolError || !esModerador) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data: doc, error: docError } = await supabase
    .from('documentos')
    .select('archivo_path')
    .eq('id', documentoId)
    .single()

  if (docError || !doc) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
  }

  const admin = createAdminClient()
  const { data: signed, error: signError } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(doc.archivo_path, SIGNED_URL_TTL_SEGUNDOS)

  if (signError || !signed) {
    return NextResponse.json({ error: 'No se pudo generar el enlace' }, { status: 500 })
  }

  return NextResponse.json({ url: signed.signedUrl })
}
