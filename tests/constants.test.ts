import { describe, expect, it } from 'vitest'
import {
  EXTENSIONES_ARCHIVO_PERMITIDAS,
  TIPOS_ARCHIVO_PERMITIDOS,
} from '../src/lib/constants'

describe('constants de archivos', () => {
  it('debe tener extensiones permitidas', () => {
    expect(EXTENSIONES_ARCHIVO_PERMITIDAS.length).toBeGreaterThan(0)
  })

  it('debe tener tipos MIME permitidos', () => {
    expect(TIPOS_ARCHIVO_PERMITIDOS.length).toBeGreaterThan(0)
  })

  it('no debe tener extensiones duplicadas', () => {
    const unicas = new Set(EXTENSIONES_ARCHIVO_PERMITIDAS)

    expect(unicas.size).toBe(
      EXTENSIONES_ARCHIVO_PERMITIDAS.length
    )
  })

  it('todas las extensiones deben comenzar con punto', () => {
    for (const extension of EXTENSIONES_ARCHIVO_PERMITIDAS) {
      expect(extension.startsWith('.')).toBe(true)
    }
  })

  it('todos los MIME deben tener un formato válido', () => {
    for (const mime of TIPOS_ARCHIVO_PERMITIDOS) {
      expect(mime).toContain('/')
    }
  })
})