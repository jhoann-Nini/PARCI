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

// Lista blanca de tipos MIME admitidos para documentos académicos.
export const TIPOS_ARCHIVO_PERMITIDOS = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
] as const

export const EXTENSIONES_ARCHIVO_PERMITIDAS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
] as const

export const ACCEPT_ARCHIVOS = EXTENSIONES_ARCHIVO_PERMITIDAS.join(',')

export const MAX_TEMAS = 8

export const COLORES_CARRERA = ['aula', 'musgo', 'ocre', 'ciruela'] as const
export type ColorCarrera = (typeof COLORES_CARRERA)[number]

export const STORAGE_BUCKET = 'documentos'
