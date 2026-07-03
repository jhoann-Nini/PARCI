import { Suspense } from 'react'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ExamenCard } from '@/components/parciales/ExamenCard'
import { Input } from '@/components/ui/Input'
import type { ColorCarrera } from '@/lib/constants'

interface SearchParams {
  q?: string
  carrera_id?: string
  semestre?: string
  corte?: string
}

export default async function ExplorarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Cargar carreras para filtros
  const { data: carreras } = await supabase
    .from('carreras')
    .select('id, nombre, color')
    .order('nombre')

  // Buscar documentos via RPC
  const { data: documentos } = await supabase.rpc('buscar_documentos', {
    p_query:      params.q       || null,
    p_carrera_id: params.carrera_id || null,
    p_semestre:   params.semestre   || null,
    p_corte:      params.corte      || null,
    p_limit:      24,
    p_offset:     0,
  })

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <section className="flex flex-col gap-2">
        <h1 className="font-mono text-2xl font-bold text-tinta">
          Parciales de la sede
        </h1>
        <p className="text-sm text-tinta-suave">
          Encuentra exámenes anteriores de tu carrera, materia y profesor.
        </p>
      </section>

      {/* Buscador */}
      <form method="GET" action="/explorar" className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tinta-suave" />
          <Input
            name="q"
            defaultValue={params.q}
            placeholder="Busca por materia, profesor o carrera…"
            className="pl-9"
          />
        </div>

        <select
          name="carrera_id"
          defaultValue={params.carrera_id ?? ''}
          className="h-10 rounded-md border border-linea bg-papel px-3 text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo"
        >
          <option value="">Todas las carreras</option>
          {carreras?.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>

        <select
          name="corte"
          defaultValue={params.corte ?? ''}
          className="h-10 rounded-md border border-linea bg-papel px-3 text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo"
        >
          <option value="">Todos los cortes</option>
          <option value="quiz">Quiz</option>
          <option value="parcial_1">Parcial 1</option>
          <option value="parcial_2">Parcial 2</option>
          <option value="final">Final</option>
        </select>

        <button
          type="submit"
          className="h-10 rounded-md bg-tinta px-4 text-sm font-medium text-papel hover:bg-tinta/90 transition-colors"
        >
          Buscar
        </button>
      </form>

      {/* Filtros activos */}
      {(params.q || params.carrera_id || params.corte) && (
        <a href="/explorar" className="w-fit text-xs text-tinta-suave hover:text-lapiz-rojo underline">
          Limpiar filtros
        </a>
      )}

      {/* Resultados */}
      {!documentos || documentos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="font-mono text-4xl text-linea">?</span>
          <p className="text-tinta-suave">
            {params.q
              ? `No encontramos parciales para "${params.q}"`
              : 'Aún no hay parciales. ¡Sé el primero en subir uno!'}
          </p>
          <a
            href="/subir"
            className="mt-2 text-sm font-medium text-lapiz-rojo hover:underline"
          >
            Subir un parcial
          </a>
        </div>
      ) : (
        <>
          <p className="text-xs text-tinta-suave">
            {documentos.length} parcial{documentos.length !== 1 ? 'es' : ''} encontrado{documentos.length !== 1 ? 's' : ''}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(documentos as Array<{id: string; materia_nombre: string; profesor_nombre: string; carrera_nombre: string; carrera_color: string; semestre: string; corte: string; archivo_url: string}>).map((doc) => (
              <ExamenCard
                key={doc.id}
                id={doc.id}
                materia={doc.materia_nombre}
                profesor={doc.profesor_nombre}
                carrera={doc.carrera_nombre}
                carreraColor={doc.carrera_color as ColorCarrera}
                semestre={doc.semestre}
                corte={doc.corte}
                archivoUrl={doc.archivo_url}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
