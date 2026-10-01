import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ModeracionCard } from '@/components/parciales/ModeracionCard'
import { ModeracionComentarioCard } from '@/components/parciales/ModeracionComentarioCard'
import { PalabrasProhibidasPanel } from '@/components/moderacion/PalabrasProhibidasPanel'
import type { ColorCarrera } from '@/lib/constants'

type DocumentoReportado = {
  id: string
  corte: string
  fecha_subida: string
  oferta: {
    semestre: string
    materia: { nombre: string; carrera: { nombre: string; color: ColorCarrera } } | null
  } | null
  reportes: { id: string; motivo: string; fecha: string }[]
}

type ComentarioReportado = {
  id: string
  contenido: string
  created_at: string
  updated_at: string | null
  estado: string
  perfiles: { nombre: string } | null
  documentos: {
    id: string
    corte: string
    oferta: {
      semestre: string
      materia: {
        nombre: string
        carrera: { nombre: string; color: ColorCarrera } | null
      } | null
    } | null
  } | null
  reportes: { id: string; motivo: string; fecha: string }[]
}

const FILTROS_COMENTARIOS = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'reportado', etiqueta: 'Reportados' },
  { valor: 'activo', etiqueta: 'Activos' },
  { valor: 'eliminado', etiqueta: 'Eliminados' },
] as const

type FiltroComentario = (typeof FILTROS_COMENTARIOS)[number]['valor']

export default async function ModeracionPage({
  searchParams,
}: {
  searchParams: Promise<{ comentarios?: string }>
}) {
  const params = await searchParams
  const filtroSolicitado = params.comentarios as FiltroComentario | undefined
  const filtroComentario: FiltroComentario = FILTROS_COMENTARIOS.some(
    (filtro) => filtro.valor === filtroSolicitado
  )
    ? filtroSolicitado!
    : 'reportado'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/moderacion')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!perfil || !['supervisor', 'administrador'].includes(perfil.rol)) {
    redirect('/explorar')
  }

  const { data: documentos } = await supabase
    .from('documentos')
    .select(`
      id, corte, fecha_subida, estado,
      oferta:ofertas (
        semestre,
        materia:materias ( nombre, carrera:carreras ( nombre, color ) )
      ),
      reportes ( id, motivo, fecha )
    `)
    .in('estado', ['reportado', 'activo'])
    .order('fecha_subida', { ascending: false })

  const { data: comentarios } = await supabase
    .from('comentarios')
    .select(`
      id,
      contenido,
      created_at,
      updated_at,
      estado,
      perfiles:usuario_id ( nombre ),
      documentos:documento_id (
        id,
        corte,
        oferta:ofertas (
          semestre,
          materia:materias (
            nombre,
            carrera:carreras ( nombre, color )
          )
        )
      ),
      reportes ( id, motivo, fecha )
    `)
    .in('estado', ['activo', 'reportado', 'eliminado'])
    .order('created_at', { ascending: false })

  const todos = (documentos ?? []) as unknown as (DocumentoReportado & { estado: string })[]
  const reportados = todos.filter((d) => d.estado === 'reportado')
  const activos = todos.filter((d) => d.estado === 'activo')
  const todosComentarios = (comentarios ?? []) as unknown as ComentarioReportado[]
  const comentariosFiltrados =
    filtroComentario === 'todos'
      ? todosComentarios
      : todosComentarios.filter((comentario) => comentario.estado === filtroComentario)

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-mono text-2xl font-bold text-tinta">Moderación</h1>
          <p className="text-sm text-tinta-suave">
            Documentos y comentarios reportados por la comunidad. Revísalos y decide si se quedan o se retiran.
          </p>
        </div>

        {reportados.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="font-mono text-4xl text-linea">✓</span>
            <p className="text-tinta-suave">No hay documentos reportados pendientes.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {reportados.map((doc) => (
              <ModeracionCard
                key={doc.id}
                id={doc.id}
                materia={doc.oferta?.materia?.nombre ?? '—'}
                carrera={doc.oferta?.materia?.carrera?.nombre ?? '—'}
                carreraColor={doc.oferta?.materia?.carrera?.color ?? 'aula'}
                semestre={doc.oferta?.semestre ?? '—'}
                corte={doc.corte}
                reportes={doc.reportes}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="font-mono text-lg font-bold text-tinta">Comentarios</h2>
          <p className="text-sm text-tinta-suave">
            Consulta comentarios reportados, activos o eliminados y gestiona su estado.
          </p>
        </div>

        <nav className="flex flex-wrap gap-2" aria-label="Filtro de comentarios">
          {FILTROS_COMENTARIOS.map((filtro) => {
            const activo = filtroComentario === filtro.valor

            return (
              <Link
                key={filtro.valor}
                href={`/moderacion?comentarios=${filtro.valor}`}
                className={`rounded border px-3 py-1.5 text-sm transition ${
                  activo
                    ? 'border-tinta bg-tinta text-papel'
                    : 'border-linea bg-papel text-tinta-suave hover:border-tinta hover:text-tinta'
                }`}
              >
                {filtro.etiqueta}
              </Link>
            )
          })}
        </nav>

        {comentariosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="font-mono text-3xl text-linea">✓</span>
            <p className="text-sm text-tinta-suave">
              No hay comentarios en este filtro.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {comentariosFiltrados.map((comentario) => {
              const materia = comentario.documentos?.oferta?.materia
              const carrera = materia?.carrera

              return (
                <ModeracionComentarioCard
                  key={comentario.id}
                  id={comentario.id}
                  contenido={comentario.contenido}
                  autor={comentario.perfiles?.nombre ?? 'Usuario anónimo'}
                  materia={materia?.nombre ?? '—'}
                  carrera={carrera?.nombre ?? '—'}
                  carreraColor={carrera?.color ?? 'aula'}
                  semestre={comentario.documentos?.oferta?.semestre ?? '—'}
                  corte={comentario.documentos?.corte ?? '—'}
                  estado={comentario.estado}
                  reportes={comentario.reportes}
                />
              )
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="font-mono text-lg font-bold text-tinta">Todos los documentos</h2>
          <p className="text-sm text-tinta-suave">
            Sin reportes, pero también puedes retirarlos si hace falta.
          </p>
        </div>

        {activos.length === 0 ? (
          <p className="text-sm text-tinta-suave">No hay documentos activos.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {activos.map((doc) => (
              <ModeracionCard
                key={doc.id}
                id={doc.id}
                materia={doc.oferta?.materia?.nombre ?? '—'}
                carrera={doc.oferta?.materia?.carrera?.nombre ?? '—'}
                carreraColor={doc.oferta?.materia?.carrera?.color ?? 'aula'}
                semestre={doc.oferta?.semestre ?? '—'}
                corte={doc.corte}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="font-mono text-lg font-bold text-tinta">Palabras prohibidas</h2>
          <p className="text-sm text-tinta-suave">
            Administra las palabras que bloquean automáticamente los comentarios.
          </p>
        </div>

        <PalabrasProhibidasPanel />
      </section>
    </div>
  )
}
