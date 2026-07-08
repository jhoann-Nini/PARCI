import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const body = await request.json()
  const { documento_id, comentario_id, motivo } = body

  if ((!documento_id && !comentario_id) || (documento_id && comentario_id) || !motivo?.trim()) {
    return NextResponse.json(
      { error: 'Debes indicar exactamente uno: documento_id o comentario_id, y un motivo' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .rpc('registrar_reporte', {
      p_documento_id: documento_id ?? null,
      p_motivo: motivo.trim(),
      p_comentario_id: comentario_id ?? null,
    })
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { id, ya_reportado } = data as { id: string | null; ya_reportado: boolean }

  if (ya_reportado) {
    return NextResponse.json({ error: 'Ya reportaste este documento' }, { status: 409 })
  }

  return NextResponse.json({ id }, { status: 201 })
}
