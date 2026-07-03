import { cn } from '@/lib/utils'

type ColorCarrera = 'aula' | 'musgo' | 'ocre' | 'ciruela'

const colorMap: Record<ColorCarrera, string> = {
  aula:    'bg-aula/15    text-aula    border-aula/30',
  musgo:   'bg-musgo/15   text-musgo   border-musgo/30',
  ocre:    'bg-ocre/15    text-ocre    border-ocre/30',
  ciruela: 'bg-ciruela/15 text-ciruela border-ciruela/30',
}

interface BadgeProps {
  children: React.ReactNode
  color?: ColorCarrera | 'default'
  className?: string
}

export function Badge({ children, color = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 text-xs font-mono font-medium',
        color === 'default'
          ? 'bg-linea/50 text-tinta-suave border-linea'
          : colorMap[color],
        className
      )}
    >
      {children}
    </span>
  )
}
