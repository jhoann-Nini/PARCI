'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface Carrera {
  id: string
  nombre: string
}

interface Materia {
  id: string
  nombre: string
  carrera_id: string
}

interface FiltrosExplorarProps {
  carreras: Carrera[]
  materias: Materia[]
  semestres: string[]
}

const SELECT_CLASS =
  'h-10 rounded-md border border-linea bg-papel px-3 font-mono text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo'

export function FiltrosExplorar({
  carreras,
  materias,
  semestres,
}: FiltrosExplorarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [carreraId, setCarreraId] = useState(searchParams.get('carrera_id') ?? '')
  const [materiaId, setMateriaId] = useState(searchParams.get('materia_id') ?? '')

  const materiasDisponibles = useMemo(
    () => materias.filter((materia) => !carreraId || materia.carrera_id === carreraId),
    [materias, carreraId]
  )

  useEffect(() => {
    if (materiaId && !materiasDisponibles.some((materia) => materia.id === materiaId)) {
      setMateriaId('')
    }
  }, [materiaId, materiasDisponibles])

  function cambiarCarrera(id: string) {
    setCarreraId(id)
    setMateriaId('')
  }

  function limpiarFiltros() {
    router.push('/explorar')
  }

  return (
    <>
      <form method="GET" action="/explorar" className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="explorar-q" className="mb-1.5 block text-xs font-medium text-tinta">
              Buscar
            </label>
            <Input
              id="explorar-q"
              name="q"
              defaultValue={searchParams.get('q') ?? ''}
              placeholder="Materia, carrera o tema…"
            />
          </div>

          <div>
            <label htmlFor="explorar-carrera" className="mb-1.5 block text-xs font-medium text-tinta">
              Carrera
            </label>
            <select
              id="explorar-carrera"
              name="carrera_id"
              value={carreraId}
              onChange={(event) => cambiarCarrera(event.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">Todas las carreras</option>
              {carreras.map((carrera) => (
                <option key={carrera.id} value={carrera.id}>
                  {carrera.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="explorar-materia" className="mb-1.5 block text-xs font-medium text-tinta">
              Materia
            </label>
            <select
              id="explorar-materia"
              name="materia_id"
              value={materiaId}
              onChange={(event) => setMateriaId(event.target.value)}
              disabled={!!carreraId && materiasDisponibles.length === 0}
              className={SELECT_CLASS}
            >
              <option value="">
                {carreraId && materiasDisponibles.length === 0
                  ? 'No hay materias'
                  : 'Todas las materias'}
              </option>
              {materiasDisponibles.map((materia) => (
                <option key={materia.id} value={materia.id}>
                  {materia.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="explorar-semestre" className="mb-1.5 block text-xs font-medium text-tinta">
              Semestre
            </label>
            <select
              id="explorar-semestre"
              name="semestre"
              defaultValue={searchParams.get('semestre') ?? ''}
              className={SELECT_CLASS}
            >
              <option value="">Todos los semestres</option>
              {semestres.map((semestre) => (
                <option key={semestre} value={semestre}>
                  {semestre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="explorar-corte" className="mb-1.5 block text-xs font-medium text-tinta">
              Corte
            </label>
            <select
              id="explorar-corte"
              name="corte"
              defaultValue={searchParams.get('corte') ?? ''}
              className={SELECT_CLASS}
            >
              <option value="">Todos los cortes</option>
              <option value="quiz">Quiz</option>
              <option value="parcial_1">Parcial 1</option>
              <option value="parcial_2">Parcial 2</option>
              <option value="final">Final</option>
            </select>
          </div>

          <div>
            <label htmlFor="explorar-orden" className="mb-1.5 block text-xs font-medium text-tinta">
              Ordenar por
            </label>
            <select
              id="explorar-orden"
              name="orden"
              defaultValue={searchParams.get('orden') ?? 'recientes'}
              className={SELECT_CLASS}
            >
              <option value="recientes">Más recientes</option>
              <option value="utiles">Más útiles</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">Buscar</Button>
          <button
            type="button"
            onClick={limpiarFiltros}
            className="text-xs text-tinta-suave underline hover:text-lapiz-rojo"
          >
            Limpiar filtros
          </button>
        </div>
      </form>
    </>
  )
}
