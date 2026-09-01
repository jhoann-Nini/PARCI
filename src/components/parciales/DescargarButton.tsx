'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { getAnonId } from '@/lib/anonId'

interface DescargarButtonProps {
  documentoId: string
  loggedIn: boolean
}

export function DescargarButton({ documentoId, loggedIn }: DescargarButtonProps) {
  const [loading, setLoading] = useState(false)
  const [bloqueado, setBloqueado] = useState(false)

  async function descargar() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/descargas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documento_id: documentoId,
          anon_id: loggedIn ? undefined : getAnonId(),
        }),
      })

      if (!res.ok) return

      const data = (await res.json()) as { permitido: boolean; url?: string }
      if (data.permitido && data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer')
      } else {
        setBloqueado(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={descargar}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-medium text-lapiz-rojo hover:underline disabled:opacity-60"
      >
        <Download className="h-3.5 w-3.5" />
        Ver parcial
      </button>

      <Modal
        open={bloqueado}
        onClose={() => setBloqueado(false)}
        title="Ya descargaste 2 parciales"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-tinta-suave">
            Subí al menos un parcial propio y de ahí en adelante descargás
            todos los que quieras, sin límite ni vueltas.
          </p>
          <Link href="/subir">
            <Button variant="accent" className="w-full">Subir un parcial</Button>
          </Link>
        </div>
      </Modal>
    </>
  )
}
