'use client'

import { useEffect, useRef, useState } from 'react'

interface ContadorAnimadoProps {
  valor: number
  duracionMs?: number
  className?: string
}

export function ContadorAnimado({ valor, duracionMs = 800, className }: ContadorAnimadoProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const yaAnimoRef = useRef(false)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || yaAnimoRef.current) return
        yaAnimoRef.current = true

        const prefiereMenosMovimiento =
          window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

        if (prefiereMenosMovimiento) {
          setDisplay(valor)
          observer.disconnect()
          return
        }

        const inicio = performance.now()
        const paso = (ahora: number) => {
          const progreso = Math.min((ahora - inicio) / duracionMs, 1)
          const suavizado = 1 - Math.pow(1 - progreso, 3) // ease-out cúbico
          setDisplay(Math.round(suavizado * valor))
          if (progreso < 1) requestAnimationFrame(paso)
        }
        requestAnimationFrame(paso)
        observer.disconnect()
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [valor, duracionMs])

  return <span ref={ref} className={className}>{display}</span>
}
