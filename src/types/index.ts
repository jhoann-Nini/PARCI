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
  rol: 'usuario' | 'supervisor' | 'administrador'
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
  documento_id: string | null
  comentario_id: string | null
  usuario_id: string | null
  motivo: string
  fecha: string
}

export type Voto = {
  id: string
  documento_id: string
  usuario_id: string | null
  anon_id: string | null
  created_at: string
}

export type Comentario = {
  id: string
  contenido: string
  created_at: string
  updated_at: string
  nombre_autor: string | null
  es_propio: boolean
}

export type OrdenDocumentos = 'recientes' | 'utiles'

export type FiltrosBusqueda = {
  query?: string
  carrera_id?: string
  materia_id?: string
  profesor_id?: string
  semestre?: string
  corte?: CorteDocumento
  orden?: OrdenDocumentos
}

export type SubirDocumentoForm = {
  carrera_id: string
  materia_id: string
  profesor_id: string
  semestre: string
  corte: CorteDocumento
  archivo: File
}
