import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MAX_COMENTARIO_CHARS,
  validarComentario,
  obtenerExtension,
  esTipoArchivoPermitido,
  contenidoCoincideConExtension,
} from '../src/lib/validaciones.ts'

test('comentarios: rechaza contenido vacío o solo espacios', () => {
  assert.equal(validarComentario('').valido, false)
  assert.equal(validarComentario('   ').valido, false)
  assert.equal(validarComentario(null).valido, false)
})

test('comentarios: acepta exactamente 500 caracteres', () => {
  assert.equal(validarComentario('a'.repeat(MAX_COMENTARIO_CHARS)).valido, true)
})

test('comentarios: rechaza 501 caracteres aunque tengan espacios al final', () => {
  assert.equal(validarComentario(`${'a'.repeat(MAX_COMENTARIO_CHARS)} `).valido, false)
})

test('archivos: normaliza extensiones en mayúsculas', () => {
  assert.equal(obtenerExtension('Parcial.PDF'), '.pdf')
  assert.equal(obtenerExtension('examen.DOCX'), '.docx')
})

test('archivos: exige coincidencia entre extensión y MIME', () => {
  assert.equal(esTipoArchivoPermitido('parcial.pdf', 'application/pdf'), true)
  assert.equal(esTipoArchivoPermitido('parcial.pdf', 'image/png'), false)
  assert.equal(esTipoArchivoPermitido('parcial.exe', 'application/pdf'), false)
})

test('archivos: reconoce firmas válidas', () => {
  assert.equal(contenidoCoincideConExtension(Uint8Array.from([0x25, 0x50, 0x44, 0x46]), '.pdf'), true)
  assert.equal(contenidoCoincideConExtension(Uint8Array.from([0xff, 0xd8, 0xff]), '.jpg'), true)
  assert.equal(contenidoCoincideConExtension(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), '.png'), true)
  assert.equal(contenidoCoincideConExtension(Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]), '.webp'), true)
  assert.equal(contenidoCoincideConExtension(Uint8Array.from([0x50, 0x4b, 0x03, 0x04]), '.docx'), true)
})

test('archivos: rechaza una firma que no corresponde a la extensión', () => {
  assert.equal(contenidoCoincideConExtension(Uint8Array.from([0x25, 0x50, 0x44, 0x46]), '.png'), false)
  assert.equal(contenidoCoincideConExtension(Uint8Array.from([0x50, 0x4b, 0x03, 0x04]), '.pdf'), false)
  assert.equal(contenidoCoincideConExtension(new Uint8Array(0), '.pdf'), false)
})

test('archivos: no acepta extensión desconocida', () => {
  assert.equal(contenidoCoincideConExtension(Uint8Array.from([0x25, 0x50, 0x44, 0x46]), '.txt'), false)
})

// ── Casos límite adicionales ─────────────────────────────────────

test('comentarios: exactamente 500 y 501 caracteres son la frontera real', () => {
  assert.equal(validarComentario('a'.repeat(500)).valido, true)
  assert.equal(validarComentario('a'.repeat(501)).valido, false)
})

test('comentarios: emojis cuentan como 2 unidades UTF-16, no como 1 carácter visual', () => {
  // 250 emojis "😀" = 500 code units (cada emoji es un par
  // subrogado) -> .length da 500, no 250. Si alguien esperara que
  // esto se rechace por "solo 250 caracteres visibles", el límite
  // real es más estricto de lo que parece a simple vista.
  const contenido = '😀'.repeat(250)
  assert.equal(contenido.length, 500)
  assert.equal(validarComentario(contenido).valido, true)
  assert.equal(validarComentario(contenido + '😀').valido, false)
})

test('comentarios: número o array en vez de string no revienta', () => {
  assert.equal(validarComentario(42).valido, false)
  assert.equal(validarComentario(['hola']).valido, false)
  assert.equal(validarComentario(undefined).valido, false)
})

test('archivos: nombre sin extensión no inventa una', () => {
  assert.equal(obtenerExtension('archivo-sin-extension'), '')
})

test('archivos: archivo oculto tipo ".pdf" se lee como extensión .pdf', () => {
  assert.equal(obtenerExtension('.pdf'), '.pdf')
})

test('archivos: extensión y MIME deben corresponder, no solo estar cada uno permitido', () => {
  // Antes del fix de esta sesión, esto pasaba como válido: ".pdf"
  // estaba en la lista de extensiones Y "image/png" estaba en la
  // lista de MIMEs, cada uno por su cuenta, sin exigir que fueran
  // del MISMO archivo.
  assert.equal(esTipoArchivoPermitido('parcial.pdf', 'image/png'), false)
  assert.equal(esTipoArchivoPermitido('foto.png', 'application/pdf'), false)
})

test('archivos: extensión en mayúsculas igual encuentra su MIME correcto', () => {
  assert.equal(esTipoArchivoPermitido('PARCIAL.PDF', 'application/pdf'), true)
})
