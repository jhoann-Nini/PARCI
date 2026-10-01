'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, MessageSquare } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { ColorCarrera } from '@/lib/constants'

interface ModeracionComentarioCardProps {
  id: string
  contenido: string
  autor: string
  materia: string
  carrera: string
  carreraColor: ColorCarrera
  semestre: string
  corte: string
  estado: string
  reportes: { id: string; motivo: string; fecha: string }[]
}

export function ModeracionComentarioCard({
  id,
  contenido,
  autor,
  materia,
  carrera,
  carreraColor,
  semestre,
  corte,
  estado,
  reportes,
}: ModeracionComentarioCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'mantener' | 'eliminar' | null>(null)
  const [error, setError] = useState('')

  async function resolver(estado: 'activo' | 'eliminado', accion: 'mantener' | 'eliminar') {
    setError('')
    setLoading(accion)

    try {
      const res = await fetch('/api/moderacion/comentarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comentario_id: id,
          estado,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'No se pudo actualizar el comentario')
        return
      }

      router.refresh()
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-linea bg-papel">
            <MessageSquare className="h-4 w-4 text-tinta-suave" />
          </div>
          <div>
            <p className="text-xs text-tinta-suave">Comentario de</p>
            <p className="font-mono text-sm font-semibold text-tinta">{autor}</p>
          </div>
        </div>

        <Badge color={carreraColor}>{carrera}</Badge>
      </div>

      <div className="rounded border border-linea bg-papel p-3">
        <p className="text-sm leading-relaxed text-tinta">{contenido}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge>{materia}</Badge>
        <Badge>{semestre}</Badge>
        <Badge>{corte}</Badge>
      </div>

      <div className="flex flex-col gap-1.5 rounded border border-lapiz-rojo/30 bg-lapiz-rojo/5 p-2.5">
        <p className="flex items-center gap-1.5 font-mono text-xs font-bold text-lapiz-rojo">
          <AlertTriangle className="h-3.5 w-3.5" />
          {reportes.length} reporte{reportes.length !== 1 ? 's' : ''}
        </p>

        <ul className="flex flex-col gap-1">
          {reportes.map((reporte) => (
            <li key={reporte.id} className="text-xs text-tinta-suave">
              «{reporte.motivo}»
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-tinta-suave">Estado</span>
        <Badge color={estado === 'eliminado' ? 'ciruela' : estado === 'reportado' ? 'ocre' : 'musgo'}>
          {estado === 'eliminado' ? 'Eliminado' : estado === 'reportado' ? 'Reportado' : 'Activo'}
        </Badge>
      </div>

      {error && <p className="text-xs text-lapiz-rojo">{error}</p>}

      {estado !== 'eliminado' && (
        <div className="mt-auto flex gap-2 pt-1">
        {estado === 'reportado' && (
          <Button
          variant="secondary"
          size="sm"
          disabled={loading !== null}
          onClick={() => resolver('activo', 'mantener')}
          className="flex-1"
        >
          {loading === 'mantener' ? 'Manteniendo…' : 'Mantener'}
          </Button>
        )}

        <Button
          variant="danger"
          size="sm"
          disabled={loading !== null}
          onClick={() => resolver('eliminado', 'eliminar')}
          className="flex-1"
        >
          {loading === 'eliminar' ? 'Eliminando…' : 'Eliminar'}
        </Button>
      </div>
      )}
    </Card>
  )
}
