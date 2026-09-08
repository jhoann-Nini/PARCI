import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatSemestre,
  formatCorte,
  formatFecha,
  formatFechaRelativa,
} from '../src/lib/utils.ts'

// ── formatSemestre ──────────────────────────────────────────────

test('formatSemestre: primer semestre', () => {
  assert.equal(formatSemestre('2026-1'), 'Primer semestre 2026')
})

test('formatSemestre: segundo semestre', () => {
  assert.equal(formatSemestre('2026-2'), 'Segundo semestre 2026')
})

test('formatSemestre: años con 4 dígitos distintos no se confunden', () => {
  assert.equal(formatSemestre('2099-1'), 'Primer semestre 2099')
})

test('formatSemestre: dato corrupto sin guion se devuelve tal cual, sin inventar el periodo', () => {
  assert.equal(formatSemestre('2026'), '2026')
})

// ── formatCorte ─────────────────────────────────────────────────

test('formatCorte: los 4 valores conocidos', () => {
  assert.equal(formatCorte('quiz'), 'Quiz')
  assert.equal(formatCorte('parcial_1'), 'Parcial 1')
  assert.equal(formatCorte('parcial_2'), 'Parcial 2')
  assert.equal(formatCorte('final'), 'Final')
})

test('formatCorte: valor desconocido se devuelve tal cual (no revienta)', () => {
  assert.equal(formatCorte('taller_extra'), 'taller_extra')
})

test('formatCorte: string vacío no revienta', () => {
  assert.equal(formatCorte(''), '')
})

// ── formatFecha ─────────────────────────────────────────────────

test('formatFecha: formato es-CO con mes abreviado', () => {
  const resultado = formatFecha('2026-03-15')
  assert.match(resultado, /15/)
  assert.match(resultado, /2026/)
})

test('formatFecha: fin de año no se corre al año siguiente por huso horario', () => {
  const resultado = formatFecha('2026-12-31')
  assert.match(resultado, /2026/)
  assert.doesNotMatch(resultado, /2027/)
})

// ── formatFechaRelativa ─────────────────────────────────────────
// Construidos a partir de la fecha real de ejecución (Date.now())
// para no depender de qué día es "hoy" cuando corren los tests.

function haceNDias(n: number): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() - n)
  return fecha.toISOString().slice(0, 10)
}

test('formatFechaRelativa: hoy', () => {
  assert.equal(formatFechaRelativa(haceNDias(0)), 'Hoy')
})

test('formatFechaRelativa: ayer (singular, no "1 días")', () => {
  assert.equal(formatFechaRelativa(haceNDias(1)), 'Ayer')
})

test('formatFechaRelativa: dentro de la semana', () => {
  assert.equal(formatFechaRelativa(haceNDias(3)), 'Hace 3 días')
  assert.equal(formatFechaRelativa(haceNDias(6)), 'Hace 6 días')
})

test('formatFechaRelativa: límite exacto de 7 días pasa a semanas', () => {
  assert.equal(formatFechaRelativa(haceNDias(7)), 'Hace 1 sem')
})

test('formatFechaRelativa: varias semanas', () => {
  assert.equal(formatFechaRelativa(haceNDias(20)), 'Hace 2 sem')
})

test('formatFechaRelativa: límite exacto de 30 días cae a fecha completa', () => {
  const resultado = formatFechaRelativa(haceNDias(30))
  assert.doesNotMatch(resultado, /sem|Hace|Hoy|Ayer/)
})

// CASO LÍMITE — fecha en el futuro (reloj desincronizado, o un bug
// de otro lado que suba fecha_subida mal). Documenta el
// comportamiento actual: se trata igual que "hoy", sin señal de que
// algo está mal.
test('formatFechaRelativa: fecha futura no rompe, cae a "Hoy"', () => {
  assert.equal(formatFechaRelativa(haceNDias(-5)), 'Hoy')
})
