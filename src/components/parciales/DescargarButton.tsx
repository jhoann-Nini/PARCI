'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, ExternalLink } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { getAnonId } from '@/lib/anonId'

interface DescargarButtonProps { documentoId: string; loggedIn: boolean; archivoUrl?: string | null }

function extension(url: string) { return url.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() ?? '' }

export function DescargarButton({ documentoId, loggedIn, archivoUrl }: DescargarButtonProps) {
  const [loading, setLoading] = useState(false)
  const [bloqueado, setBloqueado] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewKind, setPreviewKind] = useState<'pdf' | 'image' | 'external' | null>(null)

  async function abrir() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/descargas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documento_id: documentoId, anon_id: loggedIn ? undefined : getAnonId() }) })
      if (!res.ok) return
      const data = await res.json() as { permitido: boolean; url?: string }
      if (!data.permitido) { setBloqueado(true); return }
      if (!data.url) return
      const ext = extension(archivoUrl ?? '')
      if (ext === 'pdf') { setPreviewKind('pdf'); setPreviewUrl(data.url) }
      else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) { setPreviewKind('image'); setPreviewUrl(data.url) }
      else { setPreviewKind('external'); setPreviewUrl(data.url) }
    } finally { setLoading(false) }
  }

  function cerrar() { setPreviewUrl(null); setPreviewKind(null) }

  return <>
    <button type="button" onClick={abrir} disabled={loading} className="flex items-center gap-1.5 text-xs font-medium text-lapiz-rojo hover:underline disabled:opacity-60">
      <Download className="h-3.5 w-3.5" /> {loading ? 'Abriendo…' : 'Ver archivo'}
    </button>

    <Modal open={!!previewUrl} onClose={cerrar} title={previewKind === 'pdf' ? 'Vista previa del PDF' : previewKind === 'image' ? 'Vista previa de imagen' : 'Archivo'}>
      {previewUrl && previewKind === 'pdf' && <iframe src={previewUrl} title="Vista previa PDF" className="h-[70vh] w-full rounded border border-linea" />}
      {previewUrl && previewKind === 'image' && <div className="flex max-h-[70vh] items-center justify-center overflow-auto"><img src={previewUrl} alt="Vista previa del archivo" className="max-h-[70vh] max-w-full object-contain" /></div>}
      {previewUrl && previewKind === 'external' && <div className="flex flex-col gap-4"><p className="text-sm text-tinta-suave">Este formato no tiene vista previa directa en el navegador. Puedes abrirlo en una nueva pestaña.</p><a href={previewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md bg-tinta px-4 py-2 text-sm font-medium text-papel hover:opacity-90"><ExternalLink className="h-4 w-4" /> Abrir archivo</a></div>}
    </Modal>

    <Modal open={bloqueado} onClose={() => setBloqueado(false)} title="Ya descargaste 2 parciales">
      <div className="flex flex-col gap-4"><p className="text-sm text-tinta-suave">Subí al menos un parcial propio y de ahí en adelante descargás todos los que quieras, sin límite ni vueltas.</p><Link href="/subir"><Button variant="accent" className="w-full">Subir un parcial</Button></Link></div>
    </Modal>
  </>
}
