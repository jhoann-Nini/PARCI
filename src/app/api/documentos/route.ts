import { NextRequest, NextResponse } from 'next/server'
import {
  TIPOS_ARCHIVO_PERMITIDOS,
  EXTENSIONES_ARCHIVO_PERMITIDAS,
  MAX_ARCHIVO_MB,
  STORAGE_BUCKET,
  MAX_TEMAS,
} from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'

function bytesEmpiezanCon(bytes: Uint8Array, firma: number[]) {
  return firma.every((byte, index) => bytes[index] === byte)
}

async function archivoCoincideConTipo(archivo: File, extension: string) {
  const buffer = new Uint8Array(await archivo.slice(0, 16).arrayBuffer())

  if (extension === '.pdf') {
    return bytesEmpiezanCon(buffer, [0x25, 0x50, 0x44, 0x46]) // %PDF
  }

  if (extension === '.jpg' || extension === '.jpeg') {
    return bytesEmpiezanCon(buffer, [0xff, 0xd8, 0xff])
  }

  if (extension === '.png') {
    return bytesEmpiezanCon(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  }

  if (extension === '.webp') {
    const texto = new TextDecoder().decode(buffer)
    return texto.slice(0, 4) === 'RIFF' && texto.slice(8, 12) === 'WEBP'
  }

  // DOC/XLS/PPT antiguos usan el formato OLE Compound File.
  if (extension === '.doc' || extension === '.xls' || extension === '.ppt') {
    return bytesEmpiezanCon(buffer, [
      0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1,
    ])
  }

  // DOCX/XLSX/PPTX son contenedores ZIP.
  if (extension === '.docx' || extension === '.xlsx' || extension === '.pptx') {
    return bytesEmpiezanCon(buffer, [0x50, 0x4b, 0x03, 0x04])
  }

  return false
}

// GET /api/documentos — buscar documentos con filtros
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const params = {
    p_query: searchParams.get('q') || undefined,
    p_carrera_id: searchParams.get('carrera_id') || undefined,
    p_materia_id: searchParams.get('materia_id') || undefined,
    p_semestre: searchParams.get('semestre') || undefined,
    p_corte: searchParams.get('corte') || undefined,
    p_limit: Number(searchParams.get('limit') ?? 20),
    p_offset: Number(searchParams.get('offset') ?? 0),
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

  const archivo = formData.get('archivo') as File | null
  const ofertaId = formData.get('oferta_id') as string | null
  const tipo = (formData.get('tipo') as string) || 'parcial'
  const corte = formData.get('corte') as string | null
  const temasList = formData.getAll('temas').map((t) => String(t).trim()).filter(Boolean)
  const temasUnicos = [...new Set(temasList.map((t) => t.toLowerCase()))]
    .map((low) => temasList.find((t) => t.toLowerCase() === low)!)
    .slice(0, MAX_TEMAS)
  const temas = temasUnicos.length ? temasUnicos : null

  if (!archivo || !ofertaId || !corte) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: archivo, oferta_id, corte' },
      { status: 400 }
    )
  }

  const extension = `.${archivo.name.split('.').pop()?.toLowerCase() ?? ''}`
  const extensionPermitida = EXTENSIONES_ARCHIVO_PERMITIDAS.includes(
    extension as (typeof EXTENSIONES_ARCHIVO_PERMITIDAS)[number]
  )
  const mimePermitido = TIPOS_ARCHIVO_PERMITIDOS.includes(
    archivo.type as (typeof TIPOS_ARCHIVO_PERMITIDOS)[number]
  )

  if (!extensionPermitida || !mimePermitido) {
    return NextResponse.json(
      { error: 'Tipo de archivo no permitido. Usa PDF, imágenes JPG/PNG/WEBP o documentos Office.' },
      { status: 400 }
    )
  }

  if (archivo.size === 0) {
    return NextResponse.json({ error: 'El archivo está vacío.' }, { status: 400 })
  }

  if (archivo.size > MAX_ARCHIVO_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `El archivo no puede superar ${MAX_ARCHIVO_MB}MB` },
      { status: 400 }
    )
  }

  if (!(await archivoCoincideConTipo(archivo, extension))) {
    return NextResponse.json(
      { error: 'El contenido del archivo no coincide con su extensión.' },
      { status: 400 }
    )
  }

  const { data: { user } } = await supabase.auth.getUser()

  const fileName = `${ofertaId}/${Date.now()}-${corte}${extension}`

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, archivo, { contentType: archivo.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName)

  const { data, error } = await supabase
    .from('documentos')
    .insert({
      oferta_id: ofertaId,
      tipo,
      corte,
      archivo_url: urlData.publicUrl,
      archivo_path: fileName,
      subido_por: user?.id ?? null,
      temas,
    })
    .select('id, tipo, corte, fecha_subida, temas')
    .single()

  if (error) {
    await supabase.storage.from(STORAGE_BUCKET).remove([fileName])
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
