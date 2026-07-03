export const SEMESTRES = [
  '2026-1', '2025-2', '2025-1', '2024-2', '2024-1', '2023-2', '2023-1',
] as const

export const CORTES = [
  { value: 'quiz', label: 'Quiz' },
  { value: 'parcial_1', label: 'Parcial 1' },
  { value: 'parcial_2', label: 'Parcial 2' },
  { value: 'final', label: 'Final' },
] as const

export const DOMINIO_CORREO =
  process.env.NEXT_PUBLIC_DOMINIO_CORREO ?? 'correounivalle.edu.co'

export const MAX_ARCHIVO_MB = 15
export const TIPOS_ARCHIVO_PERMITIDOS = ['application/pdf']

export const COLORES_CARRERA = ['aula', 'musgo', 'ocre', 'ciruela'] as const
export type ColorCarrera = (typeof COLORES_CARRERA)[number]

export const STORAGE_BUCKET = 'documentos'
