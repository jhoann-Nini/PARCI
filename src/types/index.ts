export type Sede = {
  id: string
  nombre: string
  ciudad: string
  direccion: string
}

export type Carrera = {
  id: string
  nombre: string
  sede_id: string
  color: 'aula' | 'musgo' | 'ocre' | 'ciruela'
}

export type Usuario = {
  id: string
  correo_institucional: string
  nombre: string
  carrera_id: string | null
  rol: 'estudiante' | 'egresado' | 'admin'
  created_at: string
}

export type Materia = {
  id: string
  nombre: string
  carrera_id: string
}

export type Profesor = {
  id: string
  nombre: string
}

export type Oferta = {
  id: string
  materia_id: string
  profesor_id: string
  semestre: string
  materia?: Materia
  profesor?: Profesor
}

export type TipoDocumento = 'parcial' | 'taller' | 'apunte' | 'nota'
export type CorteDocumento = 'quiz' | 'parcial_1' | 'parcial_2' | 'final'
export type EstadoDocumento = 'activo' | 'reportado' | 'eliminado'

export type Documento = {
  id: string
  oferta_id: string
  tipo: TipoDocumento
  corte: CorteDocumento
  archivo_url: string
  subido_por: string | null
  estado: EstadoDocumento
  fecha_subida: string
  oferta?: Oferta
}

export type DocumentoConContexto = Documento & {
  oferta: Oferta & {
    materia: Materia & {
      carrera: Carrera
    }
    profesor: Profesor
  }
}

export type InfoSede = {
  id: string
  sede_id: string
  categoria: 'biblioteca' | 'bienestar' | 'admisiones' | 'contacto' | 'mapa'
  titulo: string
  contenido: string
}

export type Reporte = {
  id: string
  documento_id: string
  usuario_id: string
  motivo: string
  fecha: string
}

export type FiltrosBusqueda = {
  query?: string
  carrera_id?: string
  materia_id?: string
  profesor_id?: string
  semestre?: string
  corte?: CorteDocumento
}

export type SubirDocumentoForm = {
  carrera_id: string
  materia_id: string
  profesor_id: string
  semestre: string
  corte: CorteDocumento
  archivo: File
}
