'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const MOTIVOS = [
  'No corresponde a esta materia/profesor',
  'Contenido ilegible o incompleto',
  'Contenido inapropiado',
  'Otro',
] as const

type Motivo = (typeof MOTIVOS)[number]
type Estado = 'idle' | 'enviando' | 'enviado' | 'ya-reportado' | 'error'

type ReportarButtonProps = {
  className?: string
} & ({ documentoId: string; comentarioId?: never } | { comentarioId: string; documentoId?: never })

export function ReportarButton({ documentoId, comentarioId, className }: ReportarButtonProps) {
  const [open, setOpen] = useState(false)
  const [motivo, setMotivo] = useState<Motivo | ''>('')
  const [detalle, setDetalle] = useState('')
  const [estado, setEstado] = useState<Estado>('idle')

  function cerrar() {
    setOpen(false)
    setMotivo('')
    setDetalle('')
    setEstado('idle')
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!motivo) return

    setEstado('enviando')
    const motivoFinal = motivo === 'Otro' && detalle.trim() ? detalle.trim() : motivo

    try {
      const res = await fetch('/api/reportes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documento_id: documentoId,
          comentario_id: comentarioId,
          motivo: motivoFinal,
        }),
      })

      if (res.status === 409) {
        setEstado('ya-reportado')
      } else if (!res.ok) {
        setEstado('error')
      } else {
        setEstado('enviado')
        setTimeout(cerrar, 1800)
      }
    } catch {
      setEstado('error')
    }
  }

  const etiqueta = comentarioId ? 'Reportar comentario' : 'Reportar documento'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={etiqueta}
        title={etiqueta}
        className={cn(
          'flex items-center text-tinta-suave hover:text-lapiz-rojo transition-colors',
          className
        )}
      >
        <Flag className="h-3.5 w-3.5" />
      </button>

      <Modal open={open} onClose={cerrar} title={etiqueta}>
        {estado === 'enviado' ? (
          <p className="text-sm text-tinta-suave">Gracias, revisaremos esto pronto.</p>
        ) : estado === 'ya-reportado' ? (
          <p className="text-sm text-tinta-suave">Ya habías reportado esto.</p>
        ) : (
          <form onSubmit={enviar} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-sm font-medium text-tinta">Motivo</label>
              <select
                required
                value={motivo}
                onChange={(e) => setMotivo(e.target.value as Motivo)}
                className="h-10 rounded-md border border-linea bg-papel px-3 font-mono text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo"
              >
                <option value="">Selecciona un motivo</option>
                {MOTIVOS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {motivo === 'Otro' && (
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-sm font-medium text-tinta">
                  Cuéntanos más (opcional)
                </label>
                <textarea
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  rows={3}
                  className="rounded-md border border-linea bg-papel px-3 py-2 text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo"
                />
              </div>
            )}

            {estado === 'error' && (
              <p className="text-sm text-lapiz-rojo">Ocurrió un error, intenta de nuevo.</p>
            )}

            <Button type="submit" disabled={!motivo || estado === 'enviando'}>
              {estado === 'enviando' ? 'Enviando…' : 'Enviar reporte'}
            </Button>
          </form>
        )}
      </Modal>
    </>
  )
}
