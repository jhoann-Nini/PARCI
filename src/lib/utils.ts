import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSemestre(semestre: string): string {
  const [year, period] = semestre.split('-')
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
  return new Date(fecha).toLocaleDateString('es-CO', {
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


