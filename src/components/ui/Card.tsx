import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement>

/**
 * Superficie base del sistema de diseño: hoja de papel con relieve
 * (borde fino + sombra desplazada y nítida, sin blur).
 */
export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded border border-linea bg-white shadow-paper transition-transform duration-150 ease-out',
        'hover:-translate-y-0.5 hover:shadow-paper-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        className
      )}
      {...props}
    />
  )
}
