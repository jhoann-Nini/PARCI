import Link from 'next/link'
import { formatCorte, formatFechaRelativa } from '@/lib/utils'

interface MiniExamenCardProps {
  carreraId: string
  materiaId: string
  materia:   string
  corte:     string
  semestre:  string
  fechaSubida: string
  votosCount: number
}

/**
 * Vista previa liviana para las secciones "Explora por carrera" de
 * la página de inicio — sin votar/reportar/comentar (eso vive en
 * ExamenCard, que aparece al entrar al buscador). Clic filtra el
 * buscador por esa materia exacta, reutilizando los filtros que ya
 * existen en /explorar en vez de crear una ruta de detalle nueva.
 */
export function MiniExamenCard({
  carreraId, materiaId, materia, corte, semestre, fechaSubida, votosCount,
}: MiniExamenCardProps) {
  return (
    <Link
      href={`/explorar?carrera_id=${carreraId}&materia_id=${materiaId}`}
      className="flex w-[190px] shrink-0 flex-col gap-2 rounded border border-linea bg-papel p-3 transition-colors hover:border-tinta-suave"
    >
      <h4 className="min-h-[2.1rem] font-mono text-xs leading-snug font-semibold text-tinta">
        {materia}
      </h4>
      <span className="inline-flex w-fit items-center rounded border border-linea bg-linea/50 px-1.5 py-0.5 font-mono text-[11px] font-medium text-tinta-suave">
        {formatCorte(corte)}
      </span>
      <div className="mt-1 flex items-center justify-between font-mono text-[11px] text-tinta-suave">
        <span>{semestre} · {formatFechaRelativa(fechaSubida)}</span>
        <span>↑ {votosCount}</span>
      </div>
    </Link>
  )
}