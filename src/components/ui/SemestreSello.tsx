import { cn } from '@/lib/utils'

interface SemestreSelloProps {
  semestre: string
  className?: string
}

/** Sello de semestre: como una marca de corrección sobre la hoja. */
export function SemestreSello({ semestre, className }: SemestreSelloProps) {
  return (
    <span
      className={cn(
        'inline-block -rotate-[4deg] rounded-[3px] border-[1.5px] border-lapiz-rojo px-1.5 py-0.5 font-mono text-xs font-bold leading-none text-lapiz-rojo',
        className
      )}
    >
      {semestre}
    </span>
  )
}
