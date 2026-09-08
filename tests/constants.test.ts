import { describe, expect, it, test } from 'vitest'
import {
  EXTENSIONES_ARCHIVO_PERMITIDAS,
  TIPOS_ARCHIVO_PERMITIDOS,
  MIME_POR_EXTENSION,
} from '../src/lib/constants.ts'

// Este test no prueba lógica de negocio — prueba que las 3 listas
// relacionadas con validación de archivos no se desincronicen entre
// sí. Es exactamente el tipo de bug que ya existía antes de este
// PR (esTipoArchivoPermitido validaba extensión y MIME por
// separado, sin este mapeo): si alguien agrega una extensión nueva
// a EXTENSIONES_ARCHIVO_PERMITIDAS y se olvida de MIME_POR_EXTENSION,
// este test lo va a atrapar en vez de dejar que se cuele en
// producción.

describe('constants', () => {
  test('toda extensión permitida tiene su mapeo de MIME', () => {
    for (const ext of EXTENSIONES_ARCHIVO_PERMITIDAS) {
      expect(ext in MIME_POR_EXTENSION).toBe(true)
    }
  })
})

test('constants: todo MIME referenciado en el mapeo está en la lista blanca', () => {
  for (const [ext, mimes] of Object.entries(MIME_POR_EXTENSION)) {
    for (const mime of mimes) {
      expect((TIPOS_ARCHIVO_PERMITIDOS as readonly string[]).includes(mime)).toBe(true)

    }
  }
})

test('constants: no hay extensiones duplicadas', () => {
  const unicas = new Set(EXTENSIONES_ARCHIVO_PERMITIDAS)
  expect(unicas.size).toBe(EXTENSIONES_ARCHIVO_PERMITIDAS.length)
})
