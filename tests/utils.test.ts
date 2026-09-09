import { describe, expect, it } from 'vitest'
import {
  formatSemestre,
  formatCorte,
  formatFecha,
  formatFechaRelativa,
} from '../src/lib/utils'

describe('formatSemestre', () => {
  it('primer semestre', () => {
    expect(formatSemestre('2026-1')).toBe('Primer semestre 2026')
  })

  it('segundo semestre', () => {
    expect(formatSemestre('2026-2')).toBe('Segundo semestre 2026')
  })

  it('años con 4 dígitos distintos no se confunden', () => {
    expect(formatSemestre('2099-1')).toBe('Primer semestre 2099')
  })

  it('dato corrupto sin guion se devuelve tal cual, sin inventar el periodo', () => {
    expect(formatSemestre('2026')).toBe('2026')
  })
})

describe('formatCorte', () => {
  it('los 4 valores conocidos', () => {
    expect(formatCorte('quiz')).toBe('Quiz')
    expect(formatCorte('parcial_1')).toBe('Parcial 1')
    expect(formatCorte('parcial_2')).toBe('Parcial 2')
    expect(formatCorte('final')).toBe('Final')
  })

  it('valor desconocido se devuelve tal cual (no revienta)', () => {
    expect(formatCorte('taller_extra')).toBe('taller_extra')
  })

  it('string vacío no revienta', () => {
    expect(formatCorte('')).toBe('')
  })
})

describe('formatFecha', () => {
  it('formato es-CO con mes abreviado', () => {
    const resultado = formatFecha('2026-03-15')
    expect(resultado).toMatch(/15/)
    expect(resultado).toMatch(/2026/)
  })

  it('fin de año no se corre al año siguiente por huso horario', () => {
    const resultado = formatFecha('2026-12-31')
    expect(resultado).toMatch(/2026/)
    expect(resultado).not.toMatch(/2027/)
  })
})

describe('formatFechaRelativa', () => {
  // Construidos a partir de la fecha real de ejecución (Date.now())
  // para no depender de qué día es "hoy" cuando corren los tests.
  // OJO: toISOString() convierte a UTC antes de recortar la fecha.
  // En timezones detrás de UTC (Colombia, UTC-5), correr esto en la
  // noche empuja la fecha resultante un día hacia adelante respecto
  // al calendario LOCAL — que es justo lo que formatFechaRelativa
  // usa como referencia. Por eso se arma el string a mano con los
  // componentes locales (getFullYear/getMonth/getDate), no con
  // toISOString().
  function haceNDias(n: number): string {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() - n)
    const anio = fecha.getFullYear()
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const dia = String(fecha.getDate()).padStart(2, '0')
    return `${anio}-${mes}-${dia}`
  }

  it('hoy', () => {
    expect(formatFechaRelativa(haceNDias(0))).toBe('Hoy')
  })

  it('ayer (singular, no "1 días")', () => {
    expect(formatFechaRelativa(haceNDias(1))).toBe('Ayer')
  })

  it('dentro de la semana', () => {
    expect(formatFechaRelativa(haceNDias(3))).toBe('Hace 3 días')
    expect(formatFechaRelativa(haceNDias(6))).toBe('Hace 6 días')
  })

  it('límite exacto de 7 días pasa a semanas', () => {
    expect(formatFechaRelativa(haceNDias(7))).toBe('Hace 1 sem')
  })

  it('varias semanas', () => {
    expect(formatFechaRelativa(haceNDias(20))).toBe('Hace 2 sem')
  })

  it('límite exacto de 30 días cae a fecha completa', () => {
    const resultado = formatFechaRelativa(haceNDias(30))
    expect(resultado).not.toMatch(/sem|Hace|Hoy|Ayer/)
  })

  // CASO LÍMITE — fecha en el futuro (reloj desincronizado, o un
  // bug de otro lado que suba fecha_subida mal). Documenta el
  // comportamiento actual: se trata igual que "hoy", sin señal de
  // que algo está mal.
  it('fecha futura no rompe, cae a "Hoy"', () => {
    expect(formatFechaRelativa(haceNDias(-5))).toBe('Hoy')
  })
})