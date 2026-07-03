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
