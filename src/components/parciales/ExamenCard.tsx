import Link from 'next/link'
import { FileText, Download } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatCorte, formatSemestre } from '@/lib/utils'
import type { ColorCarrera } from '@/lib/constants'

interface ExamenCardProps {
  id: string
  materia:   string
  profesor:  string
  carrera:   string
  carreraColor: ColorCarrera
  semestre:  string
  corte:     string
  archivoUrl: string
}

export function ExamenCard({
  materia, profesor, carrera, carreraColor, semestre, corte, archivoUrl,
}: ExamenCardProps) {
  return (
    <article className="group relative flex flex-col gap-3 rounded-lg border bg-papel p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Pestaña de carrera (parte superior izquierda) */}
      <div
        className="absolute -top-px left-4 h-1 w-16 rounded-b"
        style={{
          backgroundColor: `var(--color-${carreraColor})`,
        }}
      />

      {/* Icono de documento */}
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-8 items-center justify-center rounded-sm border-2 border-dashed border-linea bg-papel">
          <FileText className="h-4 w-4 text-tinta-suave" />
        </div>

        {/* Sello de semestre */}
        <span className="font-mono text-xs font-bold text-lapiz-rojo ring-1 ring-lapiz-rojo/30 rounded px-1.5 py-0.5">
          {semestre}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1">
        <h3 className="font-mono text-sm font-semibold text-tinta leading-snug">
          {materia}
        </h3>
        <p className="text-xs text-tinta-suave">{profesor}</p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <Badge color={carreraColor}>{carrera}</Badge>
        <Badge>{formatCorte(corte)}</Badge>
      </div>

      {/* Acción */}
      <a
        href={archivoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto flex items-center gap-1.5 text-xs font-medium text-lapiz-rojo hover:underline"
      >
        <Download className="h-3.5 w-3.5" />
        Ver parcial
      </a>
    </article>
  )
}
