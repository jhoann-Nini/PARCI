import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/votos — marcar "me sirvió" en un documento
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const body = await request.json()
  const { documento_id, anon_id } = body

  if (!documento_id) {
    return NextResponse.json({ error: 'Falta documento_id' }, { status: 400 })
  }

  const { data, error } = await supabase
    .rpc('votar_documento', { p_documento_id: documento_id, p_anon_id: anon_id ?? null })
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
