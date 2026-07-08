import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_COMENTARIO_CHARS = 500

// GET /api/comentarios?documento_id=...&anon_id=... — listado plano
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const documento_id = searchParams.get('documento_id')
  const anon_id = searchParams.get('anon_id')

  if (!documento_id) {
    return NextResponse.json({ error: 'Falta documento_id' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc('obtener_comentarios', {
    p_documento_id: documento_id,
    p_anon_id: anon_id || null,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/comentarios — crear o editar (upsert) el comentario propio
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const body = await request.json()
  const { documento_id, contenido, anon_id } = body

  if (!documento_id || !contenido?.trim()) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: documento_id, contenido' },
      { status: 400 }
    )
  }

  if (contenido.trim().length > MAX_COMENTARIO_CHARS) {
    return NextResponse.json(
      { error: `El comentario no puede superar ${MAX_COMENTARIO_CHARS} caracteres` },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .rpc('comentar_documento', {
      p_documento_id: documento_id,
      p_contenido: contenido.trim(),
      p_anon_id: anon_id ?? null,
    })
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
