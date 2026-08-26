import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/documentos/temas?materia_id=... — temas ya usados en otros
// documentos de la misma materia, para autocompletar al subir un parcial
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const materiaId = searchParams.get('materia_id')

  if (!materiaId) {
    return NextResponse.json({ error: 'Falta materia_id' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc('sugerencias_temas', { p_materia_id: materiaId })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json((data as { tema: string }[]).map((row) => row.tema))
}
