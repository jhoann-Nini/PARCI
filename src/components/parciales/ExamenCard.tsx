import { FileText, Download } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SemestreSello } from '@/components/ui/SemestreSello'
import { formatCorte } from '@/lib/utils'
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

const FRANJA_COLOR: Record<ColorCarrera, string> = {
  aula:    'var(--color-azul-aula)',
  musgo:   'var(--color-verde-musgo)',
  ocre:    'var(--color-ocre)',
  ciruela: 'var(--color-ciruela)',
}

export function ExamenCard({
  materia, profesor, carrera, carreraColor, semestre, corte, archivoUrl,
}: ExamenCardProps) {
  return (
    <Card className="group relative flex flex-col gap-3 overflow-hidden p-4 transition-shadow hover:shadow-paper-sm">
      {/* Franja de carrera */}
      <div
        className="absolute top-0 left-0 h-1 w-full"
        style={{ backgroundColor: FRANJA_COLOR[carreraColor] }}
      />

      {/* Icono de documento */}
      <div className="flex items-start justify-between pt-1">
        <div className="flex h-10 w-8 items-center justify-center rounded-sm border-2 border-dashed border-linea bg-papel">
          <FileText className="h-4 w-4 text-tinta-suave" />
        </div>

        {/* Sello de semestre */}
        <SemestreSello semestre={semestre} />
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
    </Card>
  )
}
