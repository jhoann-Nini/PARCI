import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Debes iniciar sesión para reportar un documento' },
      { status: 401 }
    )
  }

  const body = await request.json()
  const { documento_id, motivo } = body

  if (!documento_id || !motivo?.trim()) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: documento_id, motivo' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('reportes')
    .insert({ documento_id, usuario_id: user.id, motivo: motivo.trim() })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Ya reportaste este documento' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Si hay 3+ reportes, marcar el documento como reportado automáticamente
  const { count } = await supabase
    .from('reportes')
    .select('*', { count: 'exact', head: true })
    .eq('documento_id', documento_id)

  if ((count ?? 0) >= 3) {
    await supabase
      .from('documentos')
      .update({ estado: 'reportado' })
      .eq('id', documento_id)
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
