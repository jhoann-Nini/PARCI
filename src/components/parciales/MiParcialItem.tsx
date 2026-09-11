import Link from 'next/link'
import { FileText } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EliminarPropioButton } from '@/components/parciales/EliminarPropioButton'
import { cn, formatCorte, formatFecha } from '@/lib/utils'
import type { ColorCarrera } from '@/lib/constants'

const FRANJA_COLOR: Record<ColorCarrera, string> = {
  aula: 'var(--color-azul-aula)',
  musgo: 'var(--color-verde-musgo)',
  ocre: 'var(--color-ocre)',
  ciruela: 'var(--color-ciruela)',
}

interface MiParcialItemProps {
  id: string
  carreraId: string
  materiaId: string
  materia: string
  carreraColor: ColorCarrera
  semestre: string
  corte: string
  fechaSubida: string
  estado: string
  descargas: number
}

/**
 * Fila compacta para la pestaña "Mis parciales" del perfil — a
 * diferencia de ExamenCard (pensada para descubrir/interactuar con
 * el contenido de otros), esta es una vista de gestión: muestra el
 * estado del documento (activo/reportado) y cuántas descargas tuvo,
 * con la única acción relevante siendo eliminarlo.
 */
export function MiParcialItem({
  id, carreraId, materiaId, materia, carreraColor, semestre, corte, fechaSubida, estado, descargas,
}: MiParcialItemProps) {
  return (
    <Card className="relative overflow-hidden p-4 pl-5">
      <span
        className="absolute left-0 top-0 h-full w-1.5"
        style={{ backgroundColor: FRANJA_COLOR[carreraColor] }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-tinta-suave" />
          <div className="min-w-0">
            <h3 className="truncate font-serif text-base font-semibold text-tinta">{materia}</h3>
            <p className="mt-0.5 font-mono text-xs text-tinta-suave">
              {semestre} · {formatCorte(corte)} · {formatFecha(fechaSubida)}
            </p>
          </div>
        </div>
        {estado !== 'activo' && (
          <span
            className={cn(
              'shrink-0 rounded border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide',
              estado === 'reportado'
                ? 'border-lapiz-rojo/30 bg-lapiz-rojo/10 text-lapiz-rojo'
                : 'border-linea bg-linea/40 text-tinta-suave'
            )}
          >
            {estado === 'reportado' ? 'En revisión' : 'Eliminado'}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-linea pt-3">
        <span className="font-mono text-xs text-tinta-suave">
          ↓ {descargas} descarga{descargas !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-3">
          <Link
            href={`/explorar?carrera_id=${carreraId}&materia_id=${materiaId}`}
            className="text-xs font-medium text-lapiz-rojo hover:underline"
          >
            Ver
          </Link>
          <EliminarPropioButton documentoId={id} />
        </div>
      </div>
    </Card>
  )
}
