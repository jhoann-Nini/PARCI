import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSemestre(semestre: string): string {
  const match = /^(\d{4})-(1|2)$/.exec(semestre)
  if (!match) return semestre // dato corrupto: mejor devolverlo tal cual que inventar un periodo

  const [, year, period] = match
  return `${period === '1' ? 'Primer' : 'Segundo'} semestre ${year}`
}

export function formatCorte(corte: string): string {
  const labels: Record<string, string> = {
    quiz: 'Quiz',
    parcial_1: 'Parcial 1',
    parcial_2: 'Parcial 2',
    final: 'Final',
  }
  return labels[corte] ?? corte
}

export function formatFecha(fecha: string): string {
  // "2026-03-15" (sin hora, típico de una columna `date`) lo
  // interpreta Date() como medianoche UTC, no local — en timezones
  // detrás de UTC (todo el continente americano, incluida
  // Colombia) eso muestra el día ANTERIOR. Si ya trae hora
  // (timestamptz), se deja tal cual.
  const tieneHora = /T\d{2}:\d{2}/.test(fecha)
  const fechaLocal = tieneHora ? fecha : `${fecha}T00:00:00`

  return new Date(fechaLocal).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatFechaRelativa(fecha: string): string {
  const dias = Math.floor(
    (Date.now() - new Date(fecha + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)
  )
  if (dias <= 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  if (dias < 7) return `Hace ${dias} días`
  if (dias < 30) return `Hace ${Math.floor(dias / 7)} sem`
  return formatFecha(fecha)
}


