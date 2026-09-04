import Link from 'next/link'
import { cookies } from 'next/headers'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ExamenCard } from '@/components/parciales/ExamenCard'
import { CardDestacada } from '@/components/parciales/CardDestacada'
import { CategoriaCarrera } from '@/components/parciales/CategoriaCarrera'
import { RevelarAlEntrar } from '@/components/parciales/RevelarAlEntrar'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { ColorCarrera } from '@/lib/constants'
import type { OrdenDocumentos } from '@/types'

interface SearchParams {
  q?: string
  carrera_id?: string
  materia_id?: string
  semestre?: string
  corte?: string
  orden?: OrdenDocumentos
}

interface DocumentoRPC {
  id: string; materia_id: string; materia_nombre: string; carrera_nombre: string
  carrera_color: string; semestre: string; corte: string; fecha_subida: string
  temas: string[] | null
  votos_count: number; comentarios_count: number; ya_voto: boolean; subido_por: string | null
}

const CANTIDAD_DESTACADOS = 3
const CANTIDAD_POR_CARRERA = 6

export default async function ExplorarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const cookieStore = await cookies()

  const { data: { user } } = await supabase.auth.getUser()
  const anonId = cookieStore.get('parci_anon_id')?.value ?? null
  const orden: OrdenDocumentos = params.orden === 'utiles' ? 'utiles' : 'recientes'

  const hayFiltros = !!(
    params.q || params.carrera_id || params.materia_id || params.semestre ||
    params.corte || orden === 'utiles'
  )

  // Cargar carreras — se usan tanto en el <select> de filtros como
  // en la vista de inicio (una sección por carrera).
  const { data: carreras } = await supabase
    .from('carreras')
    .select('id, nombre, color')
    .order('nombre')

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <h1 className="font-mono text-2xl font-bold text-tinta">
          Parciales de la sede
        </h1>
        <p className="text-sm text-tinta-suave">
          Encuentra exámenes anteriores de tu carrera y materia.
        </p>
      </section>

      {/* Buscador */}
      <form method="GET" action="/explorar" className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tinta-suave" />
          <Input
            name="q"
            defaultValue={params.q}
            placeholder="Busca por materia, carrera o tema…"
            className="pl-9"
          />
        </div>

        <select
          name="carrera_id"
          defaultValue={params.carrera_id ?? ''}
          className="h-10 rounded-md border border-linea bg-papel px-3 font-mono text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo"
        >
          <option value="">Todas las carreras</option>
          {carreras?.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>

        <select
          name="corte"
          defaultValue={params.corte ?? ''}
          className="h-10 rounded-md border border-linea bg-papel px-3 font-mono text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo"
        >
          <option value="">Todos los cortes</option>
          <option value="quiz">Quiz</option>
          <option value="parcial_1">Parcial 1</option>
          <option value="parcial_2">Parcial 2</option>
          <option value="final">Final</option>
        </select>

        <select
          name="orden"
          defaultValue={orden}
          className="h-10 rounded-md border border-linea bg-papel px-3 font-mono text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo"
        >
          <option value="recientes">Más recientes</option>
          <option value="utiles">Más útiles</option>
        </select>

        <Button type="submit">Buscar</Button>
      </form>

      {/* Filtros activos */}
      {hayFiltros && (
        <a href="/explorar" className="w-fit text-xs text-tinta-suave hover:text-lapiz-rojo underline">
          Limpiar filtros
        </a>
      )}

      {hayFiltros ? (
        <ResultadosBusqueda
          params={params}
          orden={orden}
          anonId={anonId}
          loggedIn={!!user}
          userId={user?.id ?? null}
        />
      ) : (
        <PaginaInicio
          carreras={carreras ?? []}
          anonId={anonId}
          loggedIn={!!user}
          userId={user?.id ?? null}
        />
      )}
    </div>
  )
}

/** Vista con filtros activos: la lista plana de siempre. */
async function ResultadosBusqueda({
  params, orden, anonId, loggedIn, userId,
}: {
  params: SearchParams
  orden: OrdenDocumentos
  anonId: string | null
  loggedIn: boolean
  userId: string | null
}) {
  const supabase = await createClient()

  const { data: documentos } = await supabase.rpc('buscar_documentos', {
    p_query:      params.q          || null,
    p_carrera_id: params.carrera_id || null,
    p_materia_id: params.materia_id || null,
    p_semestre:   params.semestre   || null,
    p_corte:      params.corte      || null,
    p_orden:      orden,
    p_anon_id:    anonId,
    p_limit:      24,
    p_offset:     0,
  })

  if (!documentos || documentos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="font-mono text-4xl text-linea">?</span>
        <p className="text-tinta-suave">
          {params.q
            ? `No encontramos parciales para "${params.q}"`
            : 'No encontramos parciales con esos filtros.'}
        </p>
        <Link href="/subir" className="mt-2">
          <Button variant="accent" size="sm">Subir un parcial</Button>
        </Link>
      </div>
    )
  }

  const docs = documentos as DocumentoRPC[]

  return (
    <>
      <p className="text-xs text-tinta-suave">
        {docs.length} parcial{docs.length !== 1 ? 'es' : ''} encontrado{docs.length !== 1 ? 's' : ''}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map((doc) => (
          <ExamenCard
            key={doc.id}
            id={doc.id}
            materia={doc.materia_nombre}
            carrera={doc.carrera_nombre}
            carreraColor={doc.carrera_color as ColorCarrera}
            semestre={doc.semestre}
            corte={doc.corte}
            temas={doc.temas}
            votosCount={doc.votos_count}
            yaVoto={doc.ya_voto}
            comentariosCount={doc.comentarios_count}
            loggedIn={loggedIn}
            esDueno={!!userId && doc.subido_por === userId}
          />
        ))}
      </div>
    </>
  )
}

/** Vista sin filtros: destacados + una sección por carrera. */
async function PaginaInicio({
  carreras, anonId, loggedIn, userId,
}: {
  carreras: { id: string; nombre: string; color: string }[]
  anonId: string | null
  loggedIn: boolean
  userId: string | null
}) {
  const supabase = await createClient()

  const { data: destacados } = await supabase.rpc('buscar_documentos', {
    p_orden: 'recientes',
    p_anon_id: anonId,
    p_limit: CANTIDAD_DESTACADOS,
    p_offset: 0,
  })

  const porCarrera = await Promise.all(
    carreras.map(async (carrera) => {
      const [{ data: documentos }, { data: total }] = await Promise.all([
        supabase.rpc('buscar_documentos', {
          p_carrera_id: carrera.id,
          p_orden: 'recientes',
          p_anon_id: anonId,
          p_limit: CANTIDAD_POR_CARRERA,
          p_offset: 0,
        }),
        supabase.rpc('contar_documentos', { p_carrera_id: carrera.id }),
      ])
      return { carrera, documentos: (documentos ?? []) as DocumentoRPC[], total: (total as number) ?? 0 }
    })
  )

  const destacadosDocs = (destacados ?? []) as DocumentoRPC[]
  const carrerasConDocumentos = porCarrera.filter((c) => c.total > 0)

  if (destacadosDocs.length === 0 && carrerasConDocumentos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="font-mono text-4xl text-linea">?</span>
        <p className="text-tinta-suave">Aún no hay parciales. ¡Sé el primero en subir uno!</p>
        <Link href="/subir" className="mt-2">
          <Button variant="accent" size="sm">Subir un parcial</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      {destacadosDocs.length > 0 && (
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-mono text-lg font-bold text-tinta">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-lapiz-rojo" />
                Recién subidos
              </h2>
              <p className="mt-1 text-xs text-tinta-suave">Lo último que subieron tus compañeros.</p>
            </div>
          </div>

          <div className="grid gap-6 pt-2 sm:grid-cols-2 lg:grid-cols-3">
            {destacadosDocs.map((doc, i) => (
              <RevelarAlEntrar key={doc.id} retrasoMs={i * 80}>
                <CardDestacada fechaSubida={doc.fecha_subida} index={i as 0 | 1 | 2}>
                  <ExamenCard
                    id={doc.id}
                    materia={doc.materia_nombre}
                    carrera={doc.carrera_nombre}
                    carreraColor={doc.carrera_color as ColorCarrera}
                    semestre={doc.semestre}
                    corte={doc.corte}
                    temas={doc.temas}
                    votosCount={doc.votos_count}
                    yaVoto={doc.ya_voto}
                    comentariosCount={doc.comentarios_count}
                    loggedIn={loggedIn}
                    esDueno={!!userId && doc.subido_por === userId}
                  />
                </CardDestacada>
              </RevelarAlEntrar>
            ))}
          </div>
        </section>
      )}

      {carrerasConDocumentos.length > 0 && (
        <section>
          <div className="mb-5 flex items-center gap-3">
            <span className="shrink-0 font-mono text-xs text-tinta-suave">Explora por carrera</span>
            <div className="h-px flex-1 bg-linea" />
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full border border-linea" />
              <span className="h-2 w-2 rounded-full border border-linea" />
              <span className="h-2 w-2 rounded-full border border-linea" />
            </div>
          </div>

          {carrerasConDocumentos.map(({ carrera, documentos, total }, i) => (
            <RevelarAlEntrar key={carrera.id} retrasoMs={Math.min(i * 90, 270)}>
              <CategoriaCarrera
                carreraId={carrera.id}
                nombre={carrera.nombre}
                color={carrera.color as ColorCarrera}
                total={total}
                documentos={documentos.map((d) => ({
                  id: d.id,
                  materia_id: d.materia_id,
                  materia_nombre: d.materia_nombre,
                  corte: d.corte,
                  semestre: d.semestre,
                  fecha_subida: d.fecha_subida,
                  votos_count: d.votos_count,
                }))}
              />
            </RevelarAlEntrar>
          ))}
        </section>
      )}
    </div>
  )
}