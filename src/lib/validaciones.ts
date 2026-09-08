import {
  EXTENSIONES_ARCHIVO_PERMITIDAS,
  MIME_POR_EXTENSION,
} from './constants.ts'

export const MAX_COMENTARIO_CHARS = 500

export function validarComentario(contenido: unknown) {
  if (typeof contenido !== 'string' || !contenido.trim()) {
    return { valido: false, error: 'Faltan campos requeridos: documento_id, contenido' }
  }

  if (contenido.length > MAX_COMENTARIO_CHARS) {
    return {
      valido: false,
      error: `El comentario no puede superar ${MAX_COMENTARIO_CHARS} caracteres`,
    }
  }

  return { valido: true, error: null }
}

export function obtenerExtension(nombre: string) {
  const idx = nombre.lastIndexOf('.')
  return idx === -1 ? '' : nombre.slice(idx).toLowerCase()
}

export function esTipoArchivoPermitido(nombre: string, mime: string) {
  const extension = obtenerExtension(nombre)

  if (!EXTENSIONES_ARCHIVO_PERMITIDAS.includes(
    extension as (typeof EXTENSIONES_ARCHIVO_PERMITIDAS)[number]
  )) {
    return false
  }

  const mimesEsperados = MIME_POR_EXTENSION[
    extension as (typeof EXTENSIONES_ARCHIVO_PERMITIDAS)[number]
  ]

  return (mimesEsperados as readonly string[]).includes(mime)
}

export function bytesEmpiezanCon(bytes: Uint8Array, firma: number[]) {
  return firma.every((byte, index) => bytes[index] === byte)
}

export function contenidoCoincideConExtension(buffer: Uint8Array, extension: string) {
  if (extension === '.pdf') {
    return bytesEmpiezanCon(buffer, [0x25, 0x50, 0x44, 0x46])
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

  if (extension === '.doc' || extension === '.xls' || extension === '.ppt') {
    return bytesEmpiezanCon(buffer, [
      0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1,
    ])
  }

  if (extension === '.docx' || extension === '.xlsx' || extension === '.pptx') {
    return bytesEmpiezanCon(buffer, [0x50, 0x4b, 0x03, 0x04])
  }

  return false
}
