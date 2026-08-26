'use client'

import { useEffect, useState } from 'react'
import { TemaTag } from '@/components/ui/TemaTag'
import { MAX_TEMAS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface TemasInputProps {
  value: string[]
  onChange: (temas: string[]) => void
  materiaId: string
}

export function TemasInput({ value, onChange, materiaId }: TemasInputProps) {
  const [input, setInput] = useState('')
  const [sugeridos, setSugeridos] = useState<{ materiaId: string; temas: string[] }>({
    materiaId: '',
    temas: [],
  })
  useEffect(() => {
    if (!materiaId) return
    fetch(`/api/documentos/temas?materia_id=${materiaId}`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setSugeridos({ materiaId, temas: data }))
      .catch(() => {})
  }, [materiaId])

  // Descarta sugerencias de una materia distinta a la seleccionada
  // ahora (evita el flash de disponibles obsoletos entre selects).
  const disponibles = sugeridos.materiaId === materiaId ? sugeridos.temas : []

  function agregar(tema: string) {
    const limpio = tema.trim()
    if (!limpio) return
    if (value.length >= MAX_TEMAS) return
    if (value.some((t) => t.toLowerCase() === limpio.toLowerCase())) return
    onChange([...value, limpio])
    setInput('')
  }

  function quitar(tema: string) {
    onChange(value.filter((t) => t !== tema))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      agregar(input)
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      quitar(value[value.length - 1])
    }
  }

  const sugerencias = input.trim()
    ? disponibles
        .filter((t) => t.toLowerCase().includes(input.trim().toLowerCase()))
        .filter((t) => !value.some((v) => v.toLowerCase() === t.toLowerCase()))
        .slice(0, 5)
    : []

  const alTope = value.length >= MAX_TEMAS

  return (
    <div className="relative flex flex-col gap-1.5">
      <div
        className={cn(
          'flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-linea bg-papel px-2 py-1.5 focus-within:outline-2 focus-within:outline-lapiz-rojo'
        )}
      >
        {value.map((tema) => (
          <TemaTag key={tema} onRemove={() => quitar(tema)}>{tema}</TemaTag>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => agregar(input)}
          disabled={alTope}
          placeholder={alTope ? '' : value.length ? '' : 'ej. grafos, presiona Enter'}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm text-tinta placeholder:text-tinta-suave focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      {sugerencias.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {sugerencias.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => agregar(s)}
                className="rounded-full border border-linea px-2.5 py-0.5 text-xs text-tinta-suave hover:border-tinta-suave hover:text-tinta"
              >
                + {s}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-tinta-suave">
        {alTope
          ? `Máximo ${MAX_TEMAS} temas.`
          : 'Enter o coma para agregar cada tema. Ayuda a otros estudiantes a saber si este parcial les sirve.'}
      </p>
    </div>
  )
}
