'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Download, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SemestreSello } from '@/components/ui/SemestreSello'
import { formatCorte } from '@/lib/utils'
import type { ColorCarrera } from '@/lib/constants'

const FRANJA_COLOR: Record<ColorCarrera, string> = {
  aula:    'var(--color-azul-aula)',
  musgo:   'var(--color-verde-musgo)',
  ocre:    'var(--color-ocre)',
  ciruela: 'var(--color-ciruela)',
}

interface ModeracionCardProps {
  id: string
  materia: string
  profesor: string
  carrera: string
  carreraColor: ColorCarrera
  semestre: string
  corte: string
  archivoUrl: string
  reportes: { id: string; motivo: string; fecha: string }[]
}

export function ModeracionCard({
  id, materia, profesor, carrera, carreraColor, semestre, corte, archivoUrl, reportes,
}: ModeracionCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'aprobar' | 'eliminar' | null>(null)
  const [error, setError] = useState('')

  async function resolver(estado: 'activo' | 'eliminado', accion: 'aprobar' | 'eliminar') {
    setError('')
    setLoading(accion)
    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('documentos')
      .update({ estado })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setLoading(null)
      return
    }

    await supabase.from('reportes').delete().eq('documento_id', id)

    router.refresh()
  }

  return (
    <Card className="relative flex flex-col gap-3 overflow-hidden p-4">
      <div
        className="absolute top-0 left-0 h-1 w-full"
        style={{ backgroundColor: FRANJA_COLOR[carreraColor] }}
      />

      <div className="flex items-start justify-between pt-1">
        <div className="flex h-10 w-8 items-center justify-center rounded-sm border-2 border-dashed border-linea bg-papel">
          <FileText className="h-4 w-4 text-tinta-suave" />
        </div>
        <SemestreSello semestre={semestre} />
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-mono text-sm font-semibold text-tinta leading-snug">{materia}</h3>
        <p className="text-xs text-tinta-suave">{profesor}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge color={carreraColor}>{carrera}</Badge>
        <Badge>{formatCorte(corte)}</Badge>
      </div>

      <a
        href={archivoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs font-medium text-lapiz-rojo hover:underline"
      >
        <Download className="h-3.5 w-3.5" />
        Ver parcial
      </a>

      <div className="flex flex-col gap-1.5 rounded border border-lapiz-rojo/30 bg-lapiz-rojo/5 p-2.5">
        <p className="flex items-center gap-1.5 font-mono text-xs font-bold text-lapiz-rojo">
          <AlertTriangle className="h-3.5 w-3.5" />
          {reportes.length} reporte{reportes.length !== 1 ? 's' : ''}
        </p>
        <ul className="flex flex-col gap-1">
          {reportes.map((r) => (
            <li key={r.id} className="text-xs text-tinta-suave">
              «{r.motivo}»
            </li>
          ))}
        </ul>
      </div>

      {error && <p className="text-xs text-lapiz-rojo">{error}</p>}

      <div className="mt-auto flex gap-2 pt-1">
        <Button
          variant="secondary"
          size="sm"
          disabled={loading !== null}
          onClick={() => resolver('activo', 'aprobar')}
          className="flex-1"
        >
          {loading === 'aprobar' ? 'Aprobando…' : 'Aprobar'}
        </Button>
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
    </Card>
  )
}
