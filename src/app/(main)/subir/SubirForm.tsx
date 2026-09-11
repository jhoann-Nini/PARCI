'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileCheck2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TemasInput } from '@/components/parciales/TemasInput'
import { BarraProgreso } from '@/components/parciales/BarraProgreso'
import { ACCEPT_ARCHIVOS, SEMESTRES, CORTES, MAX_ARCHIVO_MB } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Carrera, Materia } from '@/types'

interface SubirFormProps {
  carreras: Pick<Carrera, 'id' | 'nombre' | 'color'>[]
}

type Paso = 1 | 2 | 3

export function SubirForm({ carreras }: SubirFormProps) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [paso, setPaso] = useState<Paso>(1)
  const [carreraId, setCarreraId] = useState('')
  const [materiaId, setMateriaId] = useState('')
  const [semestre, setSemestre] = useState('')
  const [corte, setCorte] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [temas, setTemas] = useState<string[]>([])
  const [arrastrando, setArrastrando] = useState(false)

  const [materias, setMaterias] = useState<Pick<Materia, 'id' | 'nombre'>[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function handleCarreraChange(id: string) {
    setCarreraId(id)
    setMateriaId('')
    setMaterias([])
  }

  useEffect(() => {
    if (!carreraId) return
    fetch(`/api/materias?carrera_id=${carreraId}`)
      .then((r) => r.json())
      .then(setMaterias)
      .catch(() => {})
  }, [carreraId])

  const carreraNombre = carreras.find((c) => c.id === carreraId)?.nombre ?? ''
  const materiaNombre = materias.find((m) => m.id === materiaId)?.nombre ?? ''
  const corteLabel = CORTES.find((c) => c.value === corte)?.label ?? ''

  const puedeAvanzar1 = !!carreraId && !!materiaId
  const puedeAvanzar2 = !!semestre && !!corte

  function validarYAsignarArchivo(f: File | null | undefined) {
    if (!f) return
    setError('')
    if (f.size > MAX_ARCHIVO_MB * 1024 * 1024) {
      setError(`El archivo no puede superar ${MAX_ARCHIVO_MB}MB`)
      return
    }
    setArchivo(f)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setArrastrando(false)
    validarYAsignarArchivo(e.dataTransfer.files[0])
  }

  async function handleSubmit() {
    setError('')

    if (!archivo) {
      setError('Selecciona un archivo')
      return
    }

    setLoading(true)
    try {
      const ofertaResponse = await fetch('/api/ofertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materia_id: materiaId, semestre }),
      })
      const ofertaData = await ofertaResponse.json()
      if (!ofertaResponse.ok) {
        setError(ofertaData.error)
        return
      }

      const fd = new FormData()
      fd.append('archivo', archivo)
      fd.append('oferta_id', ofertaData.id)
      fd.append('tipo', 'parcial')
      fd.append('corte', corte)
      temas.forEach((t) => fd.append('temas', t))

      const res = await fetch('/api/documentos', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

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
        <p className="font-serif text-lg font-bold text-tinta">¡Parcial subido!</p>
        <p className="mt-1 text-sm text-tinta-suave">Redirigiendo al explorador…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <BarraProgreso paso={paso} />

      {/* ── Paso 1: Contexto ── */}
      {paso === 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-sm font-medium text-tinta">Carrera</label>
            <select
              value={carreraId}
              onChange={(e) => handleCarreraChange(e.target.value)}
              className="h-10 rounded-md border border-linea bg-papel px-3 text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo"
            >
              <option value="">Selecciona una carrera</option>
              {carreras.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-sm font-medium text-tinta">Materia</label>
            <select
              value={materiaId}
              onChange={(e) => setMateriaId(e.target.value)}
              disabled={!carreraId || materias.length === 0}
              className="h-10 rounded-md border border-linea bg-papel px-3 text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo disabled:opacity-50"
            >
              <option value="">{carreraId ? 'Selecciona una materia' : 'Primero elige una carrera'}</option>
              {materias.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>

          <Button
            type="button"
            variant="accent"
            disabled={!puedeAvanzar1}
            onClick={() => setPaso(2)}
            className="mt-2"
          >
            Continuar
          </Button>
        </div>
      )}

      {/* ── Paso 2: Detalles ── */}
      {paso === 2 && (
        <div className="flex flex-col gap-4">
          <p className="font-mono text-xs text-tinta-suave">
            {carreraNombre} · {materiaNombre}
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-sm font-medium text-tinta">Semestre</label>
            <select
              value={semestre}
              onChange={(e) => setSemestre(e.target.value)}
              className="h-10 rounded-md border border-linea bg-papel px-3 text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo"
            >
              <option value="">Selecciona el semestre</option>
              {SEMESTRES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-sm font-medium text-tinta">Corte</label>
            <div className="grid grid-cols-4 gap-2">
              {CORTES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCorte(c.value)}
                  className={cn(
                    'h-10 rounded-md border font-mono text-sm font-medium transition-colors',
                    corte === c.value
                      ? 'border-lapiz-rojo bg-lapiz-rojo text-papel'
                      : 'border-linea bg-papel text-tinta hover:border-tinta-suave'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-sm font-medium text-tinta">
              Temas cubiertos <span className="font-normal text-tinta-suave">(opcional)</span>
            </label>
            <TemasInput value={temas} onChange={setTemas} materiaId={materiaId} />
          </div>

          <div className="mt-2 flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setPaso(1)} className="flex-1">
              Atrás
            </Button>
            <Button
              type="button"
              variant="accent"
              disabled={!puedeAvanzar2}
              onClick={() => setPaso(3)}
              className="flex-1"
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* ── Paso 3: Archivo ── */}
      {paso === 3 && (
        <div className="flex flex-col gap-4">
          <p className="font-mono text-xs text-tinta-suave">
            {carreraNombre} · {materiaNombre} · {semestre} · {corteLabel}
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
              arrastrando ? 'border-lapiz-rojo bg-lapiz-rojo/5' : 'border-linea hover:border-tinta-suave'
            )}
          >
            {archivo ? (
              <>
                <FileCheck2 className="h-7 w-7 text-verde-musgo" />
                <span className="font-mono text-sm font-medium text-tinta">{archivo.name}</span>
                <span className="text-xs text-tinta-suave">Haz clic para cambiar el archivo</span>
              </>
            ) : (
              <>
                <Upload className="h-7 w-7 text-tinta-suave" />
                <span className="font-mono text-sm text-tinta-suave">
                  Arrastra tu archivo aquí, o haz clic para buscarlo
                </span>
                <span className="text-center text-xs text-tinta-suave">
                  PDF, JPG, PNG, WEBP, DOC, DOCX, XLS, XLSX, PPT o PPTX · máx. {MAX_ARCHIVO_MB}MB
                </span>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT_ARCHIVOS}
              className="sr-only"
              onChange={(e) => validarYAsignarArchivo(e.target.files?.[0])}
            />
          </div>

          {error && <p className="rounded-md bg-lapiz-rojo/10 px-3 py-2 text-sm text-lapiz-rojo">{error}</p>}

          <div className="mt-2 flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setPaso(2)} className="flex-1" disabled={loading}>
              Atrás
            </Button>
            <Button
              type="button"
              variant="accent"
              disabled={!archivo || loading}
              onClick={handleSubmit}
              className="flex-1"
            >
              {loading ? 'Subiendo…' : 'Subir parcial'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
