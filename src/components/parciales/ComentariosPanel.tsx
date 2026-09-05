'use client'

import { useState } from 'react'
import { MessageSquare, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { ReportarButton } from '@/components/parciales/ReportarButton'
import { Button } from '@/components/ui/Button'
import { formatFecha, cn } from '@/lib/utils'
import { getAnonId } from '@/lib/anonId'
import type { Comentario } from '@/types'

interface ComentariosPanelProps {
  documentoId: string
  comentariosCountInicial: number
  loggedIn: boolean
  className?: string
}

export function ComentariosPanel({ documentoId, comentariosCountInicial, loggedIn, className }: ComentariosPanelProps) {
  const [abierto, setAbierto] = useState(false)
  const [cargado, setCargado] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [count, setCount] = useState(comentariosCountInicial)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [error, setError] = useState('')

  const propio = comentarios.find((c) => c.es_propio)

  async function toggle() { const next = !abierto; setAbierto(next); if (next && !cargado) await cargar() }
  async function cargar() {
    setCargando(true)
    try {
      const anonId = loggedIn ? '' : getAnonId()
      const qs = new URLSearchParams({ documento_id: documentoId }); if (anonId) qs.set('anon_id', anonId)
      const res = await fetch(`/api/comentarios?${qs.toString()}`); if (!res.ok) return
      const data = (await res.json()) as Comentario[]; setComentarios(data); setCount(data.length); setCargado(true)
      const mio = data.find((c) => c.es_propio); if (mio) setTexto(mio.contenido)
    } finally { setCargando(false) }
  }
  async function enviar(e: React.FormEvent) {
    e.preventDefault(); if (!texto.trim() || enviando) return; setEnviando(true); setError('')
    try {
      const res = await fetch('/api/comentarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documento_id: documentoId, contenido: texto.trim(), anon_id: loggedIn ? undefined : getAnonId() }) })
      const data = await res.json(); if (!res.ok) { setError(data.error ?? 'Ocurrió un error'); return }
      setComentarios((prev) => [...prev.filter((c) => !c.es_propio), { ...data, es_propio: true } as Comentario].sort((a, b) => a.created_at.localeCompare(b.created_at)))
      setCount((prev) => (propio ? prev : prev + 1))
    } catch { setError('Ocurrió un error inesperado') } finally { setEnviando(false) }
  }
  async function eliminar(id: string) {
    if (!window.confirm('¿Eliminar tu comentario? Esta acción no se puede deshacer.')) return
    setEliminando(id); setError('')
    try {
      const res = await fetch('/api/comentarios', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comentario_id: id, anon_id: loggedIn ? undefined : getAnonId() }) })
      const data = await res.json(); if (!res.ok) { setError(data.error ?? 'No se pudo eliminar'); return }
      setComentarios((prev) => prev.filter((c) => c.id !== id)); setCount((prev) => Math.max(0, prev - 1)); setTexto('')
    } catch { setError('Ocurrió un error inesperado') } finally { setEliminando(null) }
  }

  return <div className={cn('flex flex-col', className)}>
    <button type="button" onClick={toggle} className="flex items-center gap-1.5 text-xs font-medium text-tinta-suave hover:text-tinta transition-colors">
      <MessageSquare className="h-3.5 w-3.5" /> {count} comentario{count !== 1 ? 's' : ''} {abierto ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
    </button>
    {abierto && <div className="mt-3 flex flex-col gap-3 border-t border-linea pt-3">
      {cargando ? <p className="text-xs text-tinta-suave">Cargando comentarios…</p> : <ul className="flex flex-col gap-2.5">
        {comentarios.map((c) => <li key={c.id} className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2"><span className="font-mono text-[11px] text-tinta-suave">{c.nombre_autor ?? 'Anónimo'} · {formatFecha(c.created_at)}{c.updated_at !== c.created_at ? ' (editado)' : ''}</span>
            <div className="flex items-center gap-2">{!c.es_propio && <ReportarButton comentarioId={c.id} />}{c.es_propio && <button type="button" title="Eliminar comentario" aria-label="Eliminar comentario" onClick={() => eliminar(c.id)} disabled={eliminando === c.id} className="text-tinta-suave hover:text-lapiz-rojo disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /></button>}</div>
          </div><p className="text-sm text-tinta">{c.contenido}</p>
        </li>)}
        {comentarios.length === 0 && <p className="text-xs text-tinta-suave">Sé el primero en comentar.</p>}
      </ul>}
      <form onSubmit={enviar} className="flex flex-col gap-1.5"><textarea value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={500} rows={2} placeholder={propio ? 'Edita tu comentario…' : 'Escribe un comentario corto…'} className="rounded-md border border-linea bg-papel px-3 py-2 text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo" />{error && <p className="text-xs text-lapiz-rojo">{error}</p>}<Button type="submit" variant="secondary" size="sm" disabled={!texto.trim() || enviando} className="self-end">{enviando ? 'Guardando…' : propio ? 'Guardar cambios' : 'Comentar'}</Button></form>
    </div>}
  </div>
}
