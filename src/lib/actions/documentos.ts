'use server'

import { createClient } from '@/lib/supabase/server'
import { TIPOS_ARCHIVO_PERMITIDOS, MAX_ARCHIVO_MB, STORAGE_BUCKET, CORTES, SEMESTRES } from '@/lib/constants'
import type { CorteDocumento } from '@/types'

type SubirDocumentoInput = {
  carrera_id:  string
  materia_id:  string
  profesor_id: string
  semestre:    string
  corte:       CorteDocumento
  archivo:     File
}

export async function subirDocumento(input: SubirDocumentoInput) {
  const { materia_id, profesor_id, semestre, corte, archivo } = input

  // Validaciones básicas
  if (!materia_id || !profesor_id || !semestre || !corte || !archivo) {
    return { error: 'Todos los campos son requeridos' }
  }

  const corteValido = CORTES.map((c) => c.value).includes(corte)
  const semestreValido = (SEMESTRES as readonly string[]).includes(semestre)

  if (!corteValido || !semestreValido) {
    return { error: 'Semestre o corte inválido' }
  }

  if (!TIPOS_ARCHIVO_PERMITIDOS.includes(archivo.type)) {
    return { error: 'Solo se permiten archivos PDF' }
  }

  if (archivo.size > MAX_ARCHIVO_MB * 1024 * 1024) {
    return { error: `El archivo no puede superar ${MAX_ARCHIVO_MB}MB` }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Obtener o crear la oferta (materia × profesor × semestre)
  const { data: ofertaExistente } = await supabase
    .from('ofertas')
    .select('id')
    .eq('materia_id', materia_id)
    .eq('profesor_id', profesor_id)
    .eq('semestre', semestre)
    .maybeSingle()

  let ofertaId: string

  if (ofertaExistente) {
    ofertaId = ofertaExistente.id
  } else {
    const { data: nuevaOferta, error: ofertaError } = await supabase
      .from('ofertas')
      .insert({ materia_id, profesor_id, semestre })
      .select('id')
      .single()

    if (ofertaError) return { error: 'No se pudo registrar la oferta' }
    ofertaId = nuevaOferta.id
  }

  // Subir archivo
  const ext      = archivo.name.split('.').pop() ?? 'pdf'
  const fileName = `${materia_id}/${profesor_id}/${semestre}/${Date.now()}-${corte}.${ext}`

  const arrayBuffer = await archivo.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, buffer, { contentType: archivo.type, upsert: false })

  if (uploadError) return { error: 'Error al subir el archivo: ' + uploadError.message }

  const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName)

  // Registrar en base de datos
  const { data, error } = await supabase
    .from('documentos')
    .insert({
      oferta_id:   ofertaId,
      tipo:        'parcial',
      corte,
      archivo_url: urlData.publicUrl,
      subido_por:  user?.id ?? null,
    })
    .select('id')
    .single()

  if (error) {
    await supabase.storage.from(STORAGE_BUCKET).remove([fileName])
    return { error: 'Error al registrar el documento' }
  }

  return { success: true, id: data.id }
}
