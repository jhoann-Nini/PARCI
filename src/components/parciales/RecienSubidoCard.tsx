import Link from 'next/link'
import { Paperclip } from 'lucide-react'
import type { ColorCarrera } from '@/lib/constants'

interface RecienSubidoCardProps {
  id: string
  materia: string
  profesor?: string | null
  semestre: string
  corte: string
  color: ColorCarrera
}

const FRANJA_COLOR: Record<ColorCarrera, string> = {
  aula: 'bg-azul-aula',
  musgo: 'bg-verde-musgo',
  ocre: 'bg-ocre',
  ciruela: 'bg-ciruela',
}

const CORTE_LABEL: Record<string, string> = {
  parcial_1: 'Parcial 1',
  parcial_2: 'Parcial 2',
  final: 'Final',
  quiz: 'Quiz',
}

export function RecienSubidoCard({ id, materia, profesor, semestre, corte, color }: RecienSubidoCardProps) {
  return (
    <Link
      href={`/parcial/${id}`}
      className="group relative block overflow-hidden rounded-md border border-linea bg-white shadow-paper-sm transition-transform duration-150 hover:-translate-y-0.5"
    >
      <div className={`h-1.5 w-full ${FRANJA_COLOR[color]}`} />

      <div className="relative min-h-[132px] p-4">
        <Paperclip className="absolute right-3 top-3 h-4 w-4 rotate-45 text-tinta-suave" strokeWidth={1.7} aria-hidden="true" />

        <div className="pr-20">
          <h3 className="font-sans text-sm font-bold leading-5 text-tinta">
            {materia}
          </h3>
          <p className="mt-1 font-mono text-[10px] text-tinta-suave">
            {profesor || 'Profesor'}
          </p>
        </div>

        <div className="absolute bottom-3 right-3 flex flex-col items-end gap-2">
          <span className="rotate-[-4deg] border border-dashed border-lapiz-rojo px-2 py-1 font-mono text-[9px] font-semibold tracking-[0.08em] text-lapiz-rojo">
            {semestre}
          </span>
          <span className="rounded border border-linea bg-papel px-2 py-1 font-mono text-[9px] text-tinta-suave">
            {CORTE_LABEL[corte] ?? corte}
          </span>
        </div>
      </div>
    </Link>
  )
}
