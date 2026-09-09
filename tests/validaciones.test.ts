import { describe, expect, it } from 'vitest'
import {
  MAX_COMENTARIO_CHARS,
  validarComentario,
  obtenerExtension,
  esTipoArchivoPermitido,
  contenidoCoincideConExtension,
} from '../src/lib/validaciones'

describe('validarComentario', () => {
  it('rechaza contenido vacío o solo espacios', () => {
    expect(validarComentario('').valido).toBe(false)
    expect(validarComentario('   ').valido).toBe(false)
    expect(validarComentario(null).valido).toBe(false)
  })

  it('acepta exactamente 500 caracteres', () => {
    expect(validarComentario('a'.repeat(MAX_COMENTARIO_CHARS)).valido).toBe(true)
  })

  it('rechaza 501 caracteres aunque tengan espacios al final', () => {
    expect(validarComentario(`${'a'.repeat(MAX_COMENTARIO_CHARS)} `).valido).toBe(false)
  })

  it('exactamente 500 y 501 caracteres son la frontera real', () => {
    expect(validarComentario('a'.repeat(500)).valido).toBe(true)
    expect(validarComentario('a'.repeat(501)).valido).toBe(false)
  })

  it('emojis cuentan como 2 unidades UTF-16, no como 1 carácter visual', () => {
    // 250 emojis "😀" = 500 code units (cada emoji es un par
    // subrogado) -> .length da 500, no 250. Si alguien esperara que
    // esto se rechace por "solo 250 caracteres visibles", el límite
    // real es más estricto de lo que parece a simple vista.
    const contenido = '😀'.repeat(250)
    expect(contenido.length).toBe(500)
    expect(validarComentario(contenido).valido).toBe(true)
    expect(validarComentario(contenido + '😀').valido).toBe(false)
  })

  it('número o array en vez de string no revienta', () => {
    expect(validarComentario(42).valido).toBe(false)
    expect(validarComentario(['hola']).valido).toBe(false)
    expect(validarComentario(undefined).valido).toBe(false)
  })
})

describe('obtenerExtension', () => {
  it('normaliza extensiones en mayúsculas', () => {
    expect(obtenerExtension('Parcial.PDF')).toBe('.pdf')
    expect(obtenerExtension('examen.DOCX')).toBe('.docx')
  })

  it('nombre sin extensión no inventa una', () => {
    expect(obtenerExtension('archivo-sin-extension')).toBe('')
  })

  it('archivo oculto tipo ".pdf" se lee como extensión .pdf', () => {
    expect(obtenerExtension('.pdf')).toBe('.pdf')
  })
})

describe('esTipoArchivoPermitido', () => {
  it('exige coincidencia entre extensión y MIME', () => {
    expect(esTipoArchivoPermitido('parcial.pdf', 'application/pdf')).toBe(true)
    expect(esTipoArchivoPermitido('parcial.pdf', 'image/png')).toBe(false)
    expect(esTipoArchivoPermitido('parcial.exe', 'application/pdf')).toBe(false)
  })

  it('extensión y MIME deben corresponder, no solo estar cada uno permitido', () => {
    // Antes del fix de esta sesión, esto pasaba como válido: ".pdf"
    // estaba en la lista de extensiones Y "image/png" estaba en la
    // lista de MIMEs, cada uno por su cuenta, sin exigir que fueran
    // del MISMO archivo.
    expect(esTipoArchivoPermitido('parcial.pdf', 'image/png')).toBe(false)
    expect(esTipoArchivoPermitido('foto.png', 'application/pdf')).toBe(false)
  })

  it('extensión en mayúsculas igual encuentra su MIME correcto', () => {
    expect(esTipoArchivoPermitido('PARCIAL.PDF', 'application/pdf')).toBe(true)
  })
})

describe('contenidoCoincideConExtension', () => {
  it('reconoce firmas válidas', () => {
    expect(contenidoCoincideConExtension(Uint8Array.from([0x25, 0x50, 0x44, 0x46]), '.pdf')).toBe(true)
    expect(contenidoCoincideConExtension(Uint8Array.from([0xff, 0xd8, 0xff]), '.jpg')).toBe(true)
    expect(contenidoCoincideConExtension(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), '.png')).toBe(true)
    expect(contenidoCoincideConExtension(Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]), '.webp')).toBe(true)
    expect(contenidoCoincideConExtension(Uint8Array.from([0x50, 0x4b, 0x03, 0x04]), '.docx')).toBe(true)
  })

  it('rechaza una firma que no corresponde a la extensión', () => {
    expect(contenidoCoincideConExtension(Uint8Array.from([0x25, 0x50, 0x44, 0x46]), '.png')).toBe(false)
    expect(contenidoCoincideConExtension(Uint8Array.from([0x50, 0x4b, 0x03, 0x04]), '.pdf')).toBe(false)
    expect(contenidoCoincideConExtension(new Uint8Array(0), '.pdf')).toBe(false)
  })

  it('no acepta extensión desconocida', () => {
    expect(contenidoCoincideConExtension(Uint8Array.from([0x25, 0x50, 0x44, 0x46]), '.txt')).toBe(false)
  })
})
