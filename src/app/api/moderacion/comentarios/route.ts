import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ESTADOS_RESOLUCION = ['activo', 'eliminado'] as const
type EstadoResolucion = (typeof ESTADOS_RESOLUCION)[number]

export async function GET() {
  const supabase = await createClient()

  const { data: esModerador, error: rolError } = await supabase.rpc('is_moderador')

  if (rolError || !esModerador) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('comentarios')
    .select(`
      id,
      contenido,
      created_at,
      updated_at,
      estado,
      perfiles:usuario_id (
        nombre
      ),
      documentos:documento_id (
        id,
        corte,
        oferta:ofertas (
          semestre,
          materia:materias (
            nombre,
            carrera:carreras (
              nombre,
              color
            )
          )
        )
      ),
      reportes (
        id,
        motivo,
        fecha
      )
    `)
    .eq('estado', 'reportado')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()

  const body = await request.json()
  const comentarioId = body.comentario_id
  const estado = body.estado as EstadoResolucion

  if (!comentarioId || !ESTADOS_RESOLUCION.includes(estado)) {
    return NextResponse.json(
      { error: 'Faltan comentario_id o un estado de resolución válido' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .rpc('resolver_comentario_moderacion', {
      p_comentario_id: comentarioId,
      p_estado: estado,
    })
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json(
      { error: 'El comentario ya fue resuelto o no existe' },
      { status: 404 }
    )
  }

  return NextResponse.json(data)
}
