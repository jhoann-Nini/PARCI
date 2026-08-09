'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface EliminarPropioButtonProps {
  documentoId: string
  className?: string
}

export function EliminarPropioButton({ documentoId, className }: EliminarPropioButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState('')

  async function confirmar() {
    setEliminando(true)
    setError('')
    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('documentos')
      .update({ estado: 'eliminado' })
      .eq('id', documentoId)

    if (updateError) {
      setError(updateError.message)
      setEliminando(false)
      return
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Eliminar mi documento"
        title="Eliminar mi documento"
        className={cn(
          'flex items-center text-tinta-suave hover:text-lapiz-rojo transition-colors',
          className
        )}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Eliminar documento">
        <p className="text-sm text-tinta-suave">
          Esto retira el documento de Parci para siempre. ¿Confirmas que quieres eliminarlo?
        </p>
        {error && <p className="text-sm text-lapiz-rojo">{error}</p>}
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => setOpen(false)} disabled={eliminando}>
            Cancelar
          </Button>
          <Button variant="danger" size="sm" className="flex-1" onClick={confirmar} disabled={eliminando}>
            {eliminando ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
