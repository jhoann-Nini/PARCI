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
  'h-10 w-full rounded-md border border-linea bg-papel px-3 font-mono text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo'

export function FiltrosExplorar({
  carreras,
  materias,
  semestres,
}: FiltrosExplorarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(
    Boolean(
      searchParams.get('carrera_id') ||
        searchParams.get('materia_id') ||
        searchParams.get('semestre') ||
        searchParams.get('corte')
    )
  )
  const [carreraId, setCarreraId] = useState(searchParams.get('carrera_id') ?? '')
  const [materiaId, setMateriaId] = useState(searchParams.get('materia_id') ?? '')

  const materiasDisponibles = useMemo(
    () => materias.filter((materia) => !carreraId || materia.carrera_id === carreraId),
    [materias, carreraId]
  )

  const carreraSeleccionada = carreras.find((carrera) => carrera.id === carreraId)
  const materiaSeleccionada = materias.find((materia) => materia.id === materiaId)
  const semestreSeleccionado = searchParams.get('semestre')
  const corteSeleccionado = searchParams.get('corte')

  const filtrosActivos = [
    carreraId,
    materiaId,
    semestreSeleccionado,
    corteSeleccionado,
  ].filter(Boolean).length

  useEffect(() => {
    if (materiaId && !materiasDisponibles.some((materia) => materia.id === materiaId)) {
      setMateriaId('')
    }
  }, [materiaId, materiasDisponibles])

  function cambiarCarrera(id: string) {
    setCarreraId(id)
    setMateriaId('')
  }

  function quitarFiltro(nombre: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(nombre)

    if (nombre === 'carrera_id') {
      params.delete('materia_id')
      setCarreraId('')
      setMateriaId('')
    }

    if (nombre === 'materia_id') {
      setMateriaId('')
    }

    router.push(params.toString() ? `/explorar?${params.toString()}` : '/explorar')
  }

  function limpiarFiltros() {
    router.push('/explorar')
  }

  return (
    <form method="GET" action="/explorar" className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="explorar-q" className="mb-1.5 block text-xs font-medium text-tinta">
            Buscar parciales
          </label>
          <Input
            id="explorar-q"
            name="q"
            defaultValue={searchParams.get('q') ?? ''}
            placeholder="Materia, carrera o tema…"
          />
        </div>
        <Button type="submit" className="sm:shrink-0">
          Buscar parciales
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-linea pt-3">
        <button
          type="button"
          onClick={() => setFiltrosAbiertos((abiertos) => !abiertos)}
          aria-expanded={filtrosAbiertos}
          aria-controls="panel-filtros-explorar"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-linea bg-papel px-3 text-xs font-medium text-tinta transition-colors hover:border-tinta-suave"
        >
          <span aria-hidden="true">⚙</span>
          Filtros{filtrosActivos > 0 ? ` (${filtrosActivos})` : ''}
          <span aria-hidden="true">{filtrosAbiertos ? '↑' : '↓'}</span>
        </button>

        {filtrosActivos > 0 && (
          <button
            type="button"
            onClick={limpiarFiltros}
            className="text-xs text-tinta-suave underline hover:text-lapiz-rojo"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {filtrosAbiertos && (
        <div
          id="panel-filtros-explorar"
          className="rounded-md border border-linea bg-papel p-4 shadow-paper-sm"
        >
          <div className="mb-4">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-tinta">
              Filtra tus resultados
            </p>
            <p className="mt-1 text-xs text-tinta-suave">
              Combina carrera, materia, semestre y corte para encontrar el parcial que necesitas.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                    ? 'No hay materias disponibles'
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
                defaultValue={semestreSeleccionado ?? ''}
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
                defaultValue={corteSeleccionado ?? ''}
                className={SELECT_CLASS}
              >
                <option value="">Todos los cortes</option>
                <option value="quiz">Quiz</option>
                <option value="parcial_1">Parcial 1</option>
                <option value="parcial_2">Parcial 2</option>
                <option value="final">Final</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-linea pt-3">
            <p className="text-xs text-tinta-suave">
              {filtrosActivos === 0
                ? 'Sin filtros activos.'
                : `${filtrosActivos} filtro${filtrosActivos !== 1 ? 's' : ''} activo${filtrosActivos !== 1 ? 's' : ''}.`}
            </p>
            <Button type="submit">Aplicar filtros</Button>
          </div>
        </div>
      )}

      {filtrosActivos > 0 && (
        <div aria-label="Filtros activos" className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-tinta">Filtros activos:</span>

          {carreraSeleccionada && (
            <button
              type="button"
              onClick={() => quitarFiltro('carrera_id')}
              className="inline-flex items-center gap-1 rounded-full border border-linea bg-papel px-2.5 py-1 text-xs text-tinta hover:border-lapiz-rojo"
              aria-label={`Quitar filtro de carrera ${carreraSeleccionada.nombre}`}
            >
              {carreraSeleccionada.nombre}
              <span aria-hidden="true">×</span>
            </button>
          )}

          {materiaSeleccionada && (
            <button
              type="button"
              onClick={() => quitarFiltro('materia_id')}
              className="inline-flex items-center gap-1 rounded-full border border-linea bg-papel px-2.5 py-1 text-xs text-tinta hover:border-lapiz-rojo"
              aria-label={`Quitar filtro de materia ${materiaSeleccionada.nombre}`}
            >
              {materiaSeleccionada.nombre}
              <span aria-hidden="true">×</span>
            </button>
          )}

          {semestreSeleccionado && (
            <button
              type="button"
              onClick={() => quitarFiltro('semestre')}
              className="inline-flex items-center gap-1 rounded-full border border-linea bg-papel px-2.5 py-1 text-xs text-tinta hover:border-lapiz-rojo"
              aria-label={`Quitar filtro de semestre ${semestreSeleccionado}`}
            >
              {semestreSeleccionado}
              <span aria-hidden="true">×</span>
            </button>
          )}

          {corteSeleccionado && (
            <button
              type="button"
              onClick={() => quitarFiltro('corte')}
              className="inline-flex items-center gap-1 rounded-full border border-linea bg-papel px-2.5 py-1 text-xs text-tinta hover:border-lapiz-rojo"
              aria-label={`Quitar filtro de corte ${corteSeleccionado}`}
            >
              {corteSeleccionado}
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>
      )}

      <input type="hidden" name="orden" value={searchParams.get('orden') ?? 'recientes'} />
    </form>
  )
}
