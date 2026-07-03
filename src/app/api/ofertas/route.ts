import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const { materia_id, profesor_id, semestre } = body

  if (!materia_id || !profesor_id || !semestre) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Buscar oferta existente primero
  const { data: existing } = await supabase
    .from('ofertas')
    .select('id')
    .eq('materia_id', materia_id)
    .eq('profesor_id', profesor_id)
    .eq('semestre', semestre)
    .maybeSingle()

  if (existing) return NextResponse.json(existing)

  const { data, error } = await supabase
    .from('ofertas')
    .insert({ materia_id, profesor_id, semestre })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
