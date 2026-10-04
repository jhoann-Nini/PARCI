import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ESTADOS_RESOLUCION = ['activo', 'eliminado'] as const
type EstadoResolucion = (typeof ESTADOS_RESOLUCION)[number]

type ComentarioResuelto = { id: string; estado: EstadoResolucion }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

// PATCH /api/moderacion/comentarios
// Body: { comentario_id: uuid, estado: 'activo' | 'eliminado' }
// Mantener (reportado -> activo) o eliminar (reportado|activo -> eliminado).
//
// La decision de negocio vive en resolver_comentario_moderacion()
// (migracion 032): devuelve siempre exactamente una fila { id, estado }
// o lanza una excepcion con un codigo estable. Esta ruta solo valida la
// forma de la peticion y traduce esos codigos a codigos HTTP.
export async function PATCH(request: NextRequest) {
  let body: { comentario_id?: unknown; estado?: unknown } | null = null

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'El cuerpo debe ser JSON válido' }, { status: 400 })
  }

  const comentarioId = body?.comentario_id
  const estado = body?.estado

  if (
    typeof comentarioId !== 'string' ||
    !UUID_RE.test(comentarioId) ||
    typeof estado !== 'string' ||
    !(ESTADOS_RESOLUCION as readonly string[]).includes(estado)
  ) {
    return NextResponse.json(
      { error: "Se requiere un comentario_id (uuid) y un estado: 'activo' o 'eliminado'" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('resolver_comentario_moderacion', {
      p_comentario_id: comentarioId,
      p_estado: estado as EstadoResolucion,
    })
    .single<ComentarioResuelto>()

  if (error) {
    const mensaje = error.message ?? ''

    // 42501 = permission denied for function: el rol anon no tiene EXECUTE.
    if (mensaje.includes('NO_AUTORIZADO') || error.code === '42501') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (mensaje.includes('COMENTARIO_NO_ENCONTRADO')) {
      return NextResponse.json({ error: 'El comentario no existe' }, { status: 404 })
    }

    // El comentario existe pero su estado actual no admite esa accion: otro
    // moderador ya lo resolvio, hubo un doble clic, o ya estaba eliminado.
    if (mensaje.includes('COMENTARIO_TRANSICION_INVALIDA')) {
      return NextResponse.json(
        {
          error: 'Este comentario cambió de estado y ya no admite esa acción. Actualizamos la lista.',
          codigo: 'COMENTARIO_TRANSICION_INVALIDA',
        },
        { status: 409 }
      )
    }

    if (mensaje.includes('ESTADO_INVALIDO')) {
      return NextResponse.json({ error: 'Estado de resolución inválido' }, { status: 400 })
    }

    console.error('[PATCH /api/moderacion/comentarios]', error)
    return NextResponse.json(
      { error: 'No se pudo resolver el comentario. Inténtalo de nuevo.' },
      { status: 500 }
    )
  }

  // { id, estado }
  return NextResponse.json(data)
}