import { formatFechaRelativa } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface CardDestacadaProps {
  fechaSubida: string
  index: 0 | 1 | 2
  children: React.ReactNode
}

const ROTACION = ['-rotate-[1.4deg]', 'rotate-[0.9deg]', '-rotate-[0.6deg]'] as const
const TAPE_COLOR = ['bg-resaltador/55', 'bg-lapiz-rojo/35', 'bg-verde-musgo/45'] as const

/**
 * Envuelve una ExamenCard real (misma tarjeta interactiva de
 * siempre — votos, descarga, comentarios) con el tratamiento
 * visual de "hoja recién pegada" para la sección de destacados de
 * la página de inicio: rotación leve + washi tape + insignia de
 * frescura. No duplica ninguna lógica de la tarjeta.
 */
export function CardDestacada({ fechaSubida, index, children }: CardDestacadaProps) {
  return (
    <div className={cn('relative', ROTACION[index])}>
      <span
        className={cn(
          'absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 -rotate-2 rounded-[1px]',
          'transition-transform duration-150 ease-out group-hover:-translate-y-0.5 group-hover:-rotate-[9deg]',
          'motion-reduce:transition-none motion-reduce:group-hover:rotate-2 motion-reduce:group-hover:translate-y-0',
          TAPE_COLOR[index]
        )}
      />
      <span className="absolute -right-2 -top-2 z-10 rotate-[6deg] rounded-sm bg-lapiz-rojo px-1.5 py-0.5 font-mono text-[10px] font-bold text-papel shadow-paper-sm">
        {formatFechaRelativa(fechaSubida)}
      </span>
      {children}
    </div>
  )
}
