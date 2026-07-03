import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const materiaId = searchParams.get('materia_id')

  const supabase = await createClient()

  if (materiaId) {
    // Profesores que han dictado esta materia (via ofertas)
    const { data, error } = await supabase
      .from('ofertas')
      .select('profesor:profesores(id, nombre)')
      .eq('materia_id', materiaId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const profesores = Array.from(
      new Map(
        data
          .map((o) => o.profesor as unknown as { id: string; nombre: string } | null)
          .filter((p): p is { id: string; nombre: string } => p !== null)
          .map((p) => [p.id, p])
      ).values()
    ).sort((a, b) => a.nombre.localeCompare(b.nombre))

    return NextResponse.json(profesores)
  }

  let query = supabase.from('profesores').select('id, nombre').order('nombre')

  if (q) query = query.ilike('nombre', `%${q}%`)

  const { data, error } = await query.limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// Crear profesor nuevo (para el formulario de subida)
export async function POST(request: NextRequest) {
  const body = await request.json()
  const nombre = (body.nombre as string)?.trim()

  if (!nombre || nombre.length < 3) {
    return NextResponse.json({ error: 'Nombre inválido' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('profesores')
    .select('id, nombre')
    .ilike('nombre', nombre)
    .limit(1)
    .maybeSingle()

  if (existing) return NextResponse.json(existing)

  const { data, error } = await supabase
    .from('profesores')
    .insert({ nombre })
    .select('id, nombre')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
