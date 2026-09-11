import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ExamenCard } from '@/components/parciales/ExamenCard'
import { CategoriaCarrera } from '@/components/parciales/CategoriaCarrera'
import { RecienSubidoCard } from '@/components/parciales/RecienSubidoCard'
import { RevelarAlEntrar } from '@/components/parciales/RevelarAlEntrar'
import { HeroInicio } from '@/components/parciales/HeroInicio'
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

const CANTIDAD_DESTACADOS = 6
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

  const { data: carreras } = await supabase
    .from('carreras')
    .select('id, nombre, color')
    .order('nombre')

  return (
    <div className="flex flex-col">
      {!hayFiltros && <HeroInicio />}

      {hayFiltros && (
        <section className="flex flex-col gap-4 pb-2 pt-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-lapiz-rojo">Explorar parciales</p>
            <h1 className="mt-1 font-mono text-2xl font-bold text-tinta">Busca el parcial que necesitas.</h1>
          </div>

          <form method="GET" action="/explorar" className="flex flex-col gap-3 sm:flex-row">
            <Input
              name="q"
              defaultValue={params.q}
              placeholder="Busca por materia, carrera o tema…"
              className="flex-1"
            />

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

          <a href="/explorar" className="w-fit text-xs text-tinta-suave underline hover:text-lapiz-rojo">
            Limpiar filtros
          </a>
        </section>
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
    <section className="pb-10 pt-6">
      <p className="mb-4 text-xs text-tinta-suave">
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
    </section>
  )
}

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
    <div className="flex flex-col pb-10">
      <div className="-mx-4 px-4 pb-2 pt-2 sm:pt-4">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="h-9 w-28 shrink-0 rounded-md border border-linea bg-white shadow-paper-sm sm:w-32"
            />
          ))}
        </div>
      </div>

      {destacadosDocs.length > 0 && (
        <section className="pt-8">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-lapiz-rojo">
              Recién subidos
            </h2>
            <Link href="/explorar?orden=recientes" className="text-xs text-tinta-suave hover:text-tinta hover:underline">
              Ver todos →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {destacadosDocs.map((doc, i) => (
              <RevelarAlEntrar key={doc.id} retrasoMs={i * 60}>
                <RecienSubidoCard
                  id={doc.id}
                  materia={doc.materia_nombre}
                  semestre={doc.semestre}
                  corte={doc.corte}
                  color={doc.carrera_color as ColorCarrera}
                />
              </RevelarAlEntrar>
            ))}
          </div>
        </section>
      )}

      {carrerasConDocumentos.length > 0 && (
        <section className="mt-10">
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

      <section className="mt-2 flex flex-col gap-4 rounded-md bg-tinta px-5 py-6 text-papel shadow-paper-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="font-mono text-lg font-bold">¿Ya cursaste esa materia?</h2>
          <p className="mt-1 text-xs text-papel/70">Sube el parcial y ayuda a quien viene después.</p>
        </div>
        <Link
          href="/subir"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-resaltador px-5 text-sm font-semibold text-tinta transition-transform hover:-translate-y-0.5"
        >
          Subir mi parcial
        </Link>
      </section>
    </div>
  )
}
