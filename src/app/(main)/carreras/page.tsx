import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { ColorCarrera } from '@/lib/constants'

const TAB_COLOR: Record<ColorCarrera, string> = {
  aula: 'var(--color-azul-aula)',
  musgo: 'var(--color-verde-musgo)',
  ocre: 'var(--color-ocre)',
  ciruela: 'var(--color-ciruela)',
}

interface Carrera {
  id: string
  nombre: string
  color: ColorCarrera
}

export default async function CarrerasPage() {
  const supabase = await createClient()
  const { data: carreras } = await supabase
    .from('carreras')
    .select('id, nombre, color')
    .order('nombre')
  
  const carrerasTipadas: Carrera[] = (carreras ?? []).map((carrera) => ({
    id: carrera.id,
    nombre: carrera.nombre,
    color: carrera.color as ColorCarrera,
  }))

  const { data: documentos } = await supabase
    .from('documentos')
    .select('id, fecha_subida, ofertas!inner(materias!inner(carrera_id))')
    .eq('estado', 'activo')
    .order('fecha_subida', { ascending: false })

  const documentosPorCarrera = new Map<string, number>()

  for (const documento of documentos ?? []) {
    const oferta = Array.isArray(documento.ofertas) ? documento.ofertas[0] : documento.ofertas
    const materia = oferta?.materias
    const materiaData = Array.isArray(materia) ? materia[0] : materia

    if (materiaData?.carrera_id) {
      documentosPorCarrera.set(
        materiaData.carrera_id,
        (documentosPorCarrera.get(materiaData.carrera_id) ?? 0) + 1
      )
    }
  }

  const carrerasDisponibles = carrerasTipadas.filter(
    (carrera) => (documentosPorCarrera.get(carrera.id) ?? 0) > 0
  )

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-12 pt-10 sm:px-8">
      <div className="mb-8 max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-lapiz-rojo">
          Carreras
        </p>
        <h1 className="mt-2 font-mono text-3xl font-bold text-tinta">
          Explora por carrera.
        </h1>
        <p className="mt-2 text-sm text-tinta-suave">
          Encuentra parciales organizados por carrera y entra directamente a sus resultados.
        </p>
      </div>

      {carrerasDisponibles.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {carrerasDisponibles.map((carrera) => {
            const total = documentosPorCarrera.get(carrera.id) ?? 0

            return (
              <Link
                key={carrera.id}
                href={`/explorar?carrera_id=${carrera.id}`}
                className="group rounded-lg border border-linea bg-papel p-5 shadow-paper-sm transition-transform hover:-translate-y-0.5 hover:border-tinta-suave focus:outline-2 focus:outline-lapiz-rojo"
              >
                <div
                  className="mb-5 h-2 w-14 rounded-full"
                  style={{ backgroundColor: TAB_COLOR[carrera.color] }}
                  aria-hidden="true"
                />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-mono text-base font-bold text-tinta">
                      {carrera.nombre}
                    </h2>
                    <p className="mt-1 text-xs text-tinta-suave">
                      {total} parcial{total !== 1 ? 'es' : ''} disponible{total !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ArrowRight
                    className="mt-0.5 h-4 w-4 shrink-0 text-tinta-suave transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-linea bg-papel p-8 text-center">
          <p className="font-mono text-sm font-semibold text-tinta">
            Aún no hay carreras con parciales disponibles.
          </p>
          <Link
            href="/subir"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-tinta px-4 text-sm font-semibold text-papel"
          >
            Subir un parcial
          </Link>
        </div>
      )}
    </main>
  )
}
