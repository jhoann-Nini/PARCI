'use client'

import { useState } from 'react'
import { ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAnonId } from '@/lib/anonId'

interface VotoButtonProps {
  documentoId: string
  votosInicial: number
  yaVotoInicial: boolean
  loggedIn: boolean
  className?: string
}

export function VotoButton({
  documentoId, votosInicial, yaVotoInicial, loggedIn, className,
}: VotoButtonProps) {
  const [votos, setVotos] = useState(votosInicial)
  const [yaVoto, setYaVoto] = useState(yaVotoInicial)
  const [loading, setLoading] = useState(false)

  async function votar() {
    if (yaVoto || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/votos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documento_id: documentoId,
          anon_id: loggedIn ? undefined : getAnonId(),
        }),
      })
      if (!res.ok) return
      const data = await res.json() as { votos_count: number; ya_voto: boolean }
      setVotos(data.votos_count)
      setYaVoto(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={votar}
      disabled={yaVoto || loading}
      aria-pressed={yaVoto}
      title={yaVoto ? 'Ya marcaste que te sirvió' : 'Marcar que te sirvió'}
      className={cn(
        'flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-xs font-medium transition-colors disabled:cursor-default',
        yaVoto
          ? 'border-resaltador bg-resaltador text-[#4A3800]'
          : 'border-linea text-tinta-suave hover:border-tinta-suave',
        className
      )}
    >
      <ThumbsUp className={cn('h-3.5 w-3.5', yaVoto && 'fill-current')} />
      {votos}
    </button>
  )
}
