'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { SEMESTRES, CORTES, MAX_ARCHIVO_MB } from '@/lib/constants'
import type { Carrera, Materia } from '@/types'

interface SubirFormProps {
  carreras: Pick<Carrera, 'id' | 'nombre' | 'color'>[]
}

export function SubirForm({ carreras }: SubirFormProps) {
  const router = useRouter()

  const [carreraId,  setCarreraId]  = useState('')
  const [materiaId,  setMateriaId]  = useState('')
  const [semestre,   setSemestre]   = useState('')
  const [corte,      setCorte]      = useState('')
  const [archivo,    setArchivo]    = useState<File | null>(null)

  const [materias,   setMaterias]   = useState<Pick<Materia, 'id' | 'nombre'>[]>([])

  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)

  function handleCarreraChange(id: string) {
    setCarreraId(id)
    setMateriaId('')
    setMaterias([])
  }

  // Cargar materias cuando cambia la carrera
  useEffect(() => {
    if (!carreraId) return
    fetch(`/api/materias?carrera_id=${carreraId}`)
      .then((r) => r.json())
      .then(setMaterias)
      .catch(() => {})
  }, [carreraId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!archivo) { setError('Selecciona un archivo PDF'); return }
    if (archivo.size > MAX_ARCHIVO_MB * 1024 * 1024) {
      setError(`El archivo no puede superar ${MAX_ARCHIVO_MB}MB`); return
    }

    setLoading(true)
    try {
      // Primero obtener/crear la oferta
      const ofertaResponse = await fetch('/api/ofertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materia_id: materiaId, semestre }),
      })
      const ofertaData = await ofertaResponse.json()
      if (!ofertaResponse.ok) { setError(ofertaData.error); return }

      const fd = new FormData()
      fd.append('archivo',   archivo)
      fd.append('oferta_id', ofertaData.id)
      fd.append('tipo',      'parcial')
      fd.append('corte',     corte)

      const res = await fetch('/api/documentos', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) { setError(data.error); return }

      setSuccess(true)
      setTimeout(() => router.push('/explorar'), 2000)
    } catch {
      setError('Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded border border-verde-musgo/30 bg-verde-musgo/10 p-6 text-center">
        <p className="font-mono text-lg font-bold text-tinta">¡Parcial subido!</p>
        <p className="mt-1 text-sm text-tinta-suave">Redirigiendo al explorador…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Carrera */}
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-sm font-medium text-tinta">Carrera</label>
        <select
          required
          value={carreraId}
          onChange={(e) => handleCarreraChange(e.target.value)}
          className="h-10 rounded-md border border-linea bg-papel px-3 text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo"
        >
          <option value="">Selecciona una carrera</option>
          {carreras.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      {/* Materia */}
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-sm font-medium text-tinta">Materia</label>
        <select
          required
          value={materiaId}
          onChange={(e) => setMateriaId(e.target.value)}
          disabled={!carreraId || materias.length === 0}
          className="h-10 rounded-md border border-linea bg-papel px-3 text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo disabled:opacity-50"
        >
          <option value="">{carreraId ? 'Selecciona una materia' : 'Primero elige una carrera'}</option>
          {materias.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
      </div>

      {/* Semestre */}
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-sm font-medium text-tinta">Semestre</label>
        <select
          required
          value={semestre}
          onChange={(e) => setSemestre(e.target.value)}
          className="h-10 rounded-md border border-linea bg-papel px-3 text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo"
        >
          <option value="">Selecciona el semestre</option>
          {SEMESTRES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Corte */}
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-sm font-medium text-tinta">Corte</label>
        <div className="grid grid-cols-4 gap-2">
          {CORTES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCorte(c.value)}
              className={`h-10 rounded-md border font-mono text-sm font-medium transition-colors ${
                corte === c.value
                  ? 'border-lapiz-rojo bg-lapiz-rojo text-papel'
                  : 'border-linea bg-papel text-tinta hover:border-tinta-suave'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Archivo */}
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-sm font-medium text-tinta">Archivo PDF</label>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-linea p-6 hover:border-tinta-suave transition-colors">
          <span className="font-mono text-2xl text-tinta-suave">PDF</span>
          <span className="text-xs text-tinta-suave">
            {archivo ? archivo.name : `Haz clic para seleccionar (máx. ${MAX_ARCHIVO_MB}MB)`}
          </span>
          <input
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {error && (
        <p className="rounded-md bg-lapiz-rojo/10 px-3 py-2 text-sm text-lapiz-rojo">
          {error}
        </p>
      )}

      <Button type="submit" variant="accent" disabled={loading} className="mt-2">
        {loading ? 'Subiendo…' : 'Subir parcial'}
      </Button>
    </form>
  )
}
