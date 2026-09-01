import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TIPOS_ARCHIVO_PERMITIDOS, MAX_ARCHIVO_MB, STORAGE_BUCKET, MAX_TEMAS } from '@/lib/constants'

// GET /api/documentos — buscar documentos con filtros
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const params = {
    p_query:       searchParams.get('q')           || undefined,
    p_carrera_id:  searchParams.get('carrera_id')  || undefined,
    p_materia_id:  searchParams.get('materia_id')  || undefined,
    p_semestre:    searchParams.get('semestre')    || undefined,
    p_corte:       searchParams.get('corte')       || undefined,
    p_limit:       Number(searchParams.get('limit')  ?? 20),
    p_offset:      Number(searchParams.get('offset') ?? 0),
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc('buscar_documentos', params)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// POST /api/documentos — subir un nuevo documento
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const formData = await request.formData()

  const archivo    = formData.get('archivo')    as File | null
  const ofertaId   = formData.get('oferta_id')  as string | null
  const tipo       = (formData.get('tipo')       as string) || 'parcial'
  const corte      = formData.get('corte')       as string | null
  const temasList  = formData.getAll('temas').map((t) => String(t).trim()).filter(Boolean)
  const temasUnicos = [...new Set(temasList.map((t) => t.toLowerCase()))]
    .map((low) => temasList.find((t) => t.toLowerCase() === low)!)
    .slice(0, MAX_TEMAS)
  const temas = temasUnicos.length ? temasUnicos : null

  // Validaciones
  if (!archivo || !ofertaId || !corte) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: archivo, oferta_id, corte' },
      { status: 400 }
    )
  }

  if (!TIPOS_ARCHIVO_PERMITIDOS.includes(archivo.type)) {
    return NextResponse.json({ error: 'Solo se permiten archivos PDF' }, { status: 400 })
  }

  if (archivo.size > MAX_ARCHIVO_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `El archivo no puede superar ${MAX_ARCHIVO_MB}MB` },
      { status: 400 }
    )
  }

  const { data: { user } } = await supabase.auth.getUser()

  // Subir archivo a Supabase Storage
  const ext      = archivo.name.split('.').pop()
  const fileName = `${ofertaId}/${Date.now()}-${corte}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, archivo, { contentType: archivo.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Nota: el bucket es privado desde la migración 021, así que
  // getPublicUrl() ya no es un link funcional para el público — se
  // conserva solo como referencia histórica visible para
  // moderadores. El acceso real de descarga usa archivo_path +
  // una signed URL de corta duración emitida por /api/descargas.
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName)

  // Insertar registro en la base de datos
  const { data, error } = await supabase
    .from('documentos')
    .insert({
      oferta_id:    ofertaId,
      tipo,
      corte,
      archivo_url:  urlData.publicUrl,
      archivo_path: fileName,
      subido_por:   user?.id ?? null,
      temas,
    })
    .select('id, tipo, corte, fecha_subida, temas')
    .single()

  if (error) {
    // Rollback: eliminar archivo subido
    await supabase.storage.from(STORAGE_BUCKET).remove([fileName])
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
