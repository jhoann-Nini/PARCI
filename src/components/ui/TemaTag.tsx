import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TemaTagProps {
  children: React.ReactNode
  onRemove?: () => void
  className?: string
}

/**
 * Burbuja de "resaltador de marcador" sobre papel: tinte bajo de
 * amarillo, sin sombra, bordes suaves — para los temas de un parcial.
 */
export function TemaTag({ children, onRemove, className }: TemaTagProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full border border-resaltador/40 bg-resaltador/25 px-2.5 py-0.5 text-xs text-tinta',
        className
      )}
    >
      <span className="truncate">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar tema ${children}`}
          className="shrink-0 text-tinta/50 hover:text-tinta"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}
