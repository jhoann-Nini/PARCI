import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
}

/**
 * Wordmark "Parci": la "i" pierde su punto y en su lugar lleva el trazo
 * rojo de corrección, como si un profesor la hubiera marcado a mano.
 */
export function Logo({ className }: LogoProps) {
  return (
    <span
      className={cn(
        'inline-flex items-baseline font-mono font-bold tracking-tight text-tinta select-none',
        className
      )}
    >
      Parc
      <span className="relative inline-block">
        ı
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 -top-[0.85em] h-[0.85em] w-[0.85em] -translate-x-1/2 text-lapiz-rojo"
        >
          <path
            d="M4 15 Q8.5 4 12 10 Q15.5 16 20 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.75"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </span>
  )
}
