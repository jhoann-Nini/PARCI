'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SEMESTRES, CORTES, MAX_ARCHIVO_MB } from '@/lib/constants'
import type { Carrera, Materia, Profesor } from '@/types'

interface SubirFormProps {
  carreras: Pick<Carrera, 'id' | 'nombre' | 'color'>[]
  profesoresIniciales: Pick<Profesor, 'id' | 'nombre'>[]
}

export function SubirForm({ carreras, profesoresIniciales }: SubirFormProps) {
  const router = useRouter()

  const [carreraId,  setCarreraId]  = useState('')
  const [materiaId,  setMateriaId]  = useState('')
  const [profesorId, setProfesorId] = useState('')
  const [semestre,   setSemestre]   = useState('')
  const [corte,      setCorte]      = useState('')
  const [archivo,    setArchivo]    = useState<File | null>(null)
  const [nuevoProf,  setNuevoProf]  = useState('')

  const [materias,   setMaterias]   = useState<Pick<Materia, 'id' | 'nombre'>[]>([])
  const [profesores, setProfesores] = useState(profesoresIniciales)

  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)

  function handleCarreraChange(id: string) {
    setCarreraId(id)
    setMateriaId('')
    setMaterias([])
    setProfesorId('')
    setProfesores(profesoresIniciales)
  }

  // Cargar materias cuando cambia la carrera
  useEffect(() => {
    if (!carreraId) return
    fetch(`/api/materias?carrera_id=${carreraId}`)
      .then((r) => r.json())
      .then(setMaterias)
      .catch(() => {})
  }, [carreraId])

  function handleMateriaChange(id: string) {
    setMateriaId(id)
    setProfesorId('')
    if (!id) setProfesores(profesoresIniciales)
  }

  // Filtrar profesores cuando cambia la materia
  useEffect(() => {
    if (!materiaId) return
    fetch(`/api/profesores?materia_id=${materiaId}`)
      .then((r) => r.json())
      .then((data) => setProfesores(data.length ? data : profesoresIniciales))
      .catch(() => {})
  }, [materiaId, profesoresIniciales])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!archivo) { setError('Selecciona un archivo PDF'); return }
    if (archivo.size > MAX_ARCHIVO_MB * 1024 * 1024) {
      setError(`El archivo no puede superar ${MAX_ARCHIVO_MB}MB`); return
    }

    let profId = profesorId

    // Crear profesor nuevo si se escribió uno
    if (!profId && nuevoProf.trim()) {
      const res = await fetch('/api/profesores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoProf.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      profId = data.id
    }

    if (!profId) { setError('Selecciona o escribe el nombre del profesor'); return }

    setLoading(true)
    try {
      // Primero obtener/crear la oferta
      const ofertaResponse = await fetch('/api/ofertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materia_id: materiaId, profesor_id: profId, semestre }),
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
      <div className="rounded-lg border border-musgo/30 bg-musgo/10 p-6 text-center">
        <p className="font-mono text-lg font-bold text-tinta">¡Parcial subido!</p>
        <p className="mt-1 text-sm text-tinta-suave">Redirigiendo al explorador…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Carrera */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-tinta">Carrera</label>
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
        <label className="text-sm font-medium text-tinta">Materia</label>
        <select
          required
          value={materiaId}
          onChange={(e) => handleMateriaChange(e.target.value)}
          disabled={!carreraId || materias.length === 0}
          className="h-10 rounded-md border border-linea bg-papel px-3 text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo disabled:opacity-50"
        >
          <option value="">{carreraId ? 'Selecciona una materia' : 'Primero elige una carrera'}</option>
          {materias.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
      </div>

      {/* Profesor */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-tinta">Profesor</label>
        <select
          value={profesorId}
          onChange={(e) => setProfesorId(e.target.value)}
          className="h-10 rounded-md border border-linea bg-papel px-3 text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo"
        >
          <option value="">Selecciona un profesor</option>
          {profesores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        {!profesorId && (
          <Input
            placeholder="O escribe el nombre si no está en la lista"
            value={nuevoProf}
            onChange={(e) => setNuevoProf(e.target.value)}
          />
        )}
      </div>

      {/* Semestre */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-tinta">Semestre</label>
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
        <label className="text-sm font-medium text-tinta">Corte</label>
        <div className="grid grid-cols-4 gap-2">
          {CORTES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCorte(c.value)}
              className={`h-10 rounded-md border text-sm font-medium transition-colors ${
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
        <label className="text-sm font-medium text-tinta">Archivo PDF</label>
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

      <Button type="submit" disabled={loading} className="mt-2">
        {loading ? 'Subiendo…' : 'Subir parcial'}
      </Button>
    </form>
  )
}
