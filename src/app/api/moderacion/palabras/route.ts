import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('listar_palabras_prohibidas')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const palabra = body.palabra

  if (typeof palabra !== 'string' || !palabra.trim()) {
    return NextResponse.json(
      { error: 'La palabra es obligatoria' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .rpc('agregar_palabra_prohibida', {
      p_palabra: palabra,
    })
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const palabra = body.palabra
  const activa = body.activa

  if (
    typeof palabra !== 'string' ||
    !palabra.trim() ||
    typeof activa !== 'boolean'
  ) {
    return NextResponse.json(
      { error: 'Faltan palabra o un estado válido' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .rpc('cambiar_estado_palabra_prohibida', {
      p_palabra: palabra,
      p_activa: activa,
    })
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }

  if (!data) {
    return NextResponse.json(
      { error: 'La palabra no existe' },
      { status: 404 }
    )
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const palabra = body.palabra

  if (typeof palabra !== 'string' || !palabra.trim()) {
    return NextResponse.json(
      { error: 'La palabra es obligatoria' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .rpc('eliminar_palabra_prohibida', {
      p_palabra: palabra,
    })
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }

  if (!data) {
    return NextResponse.json(
      { error: 'La palabra no existe' },
      { status: 404 }
    )
  }

  return NextResponse.json(data)
}
