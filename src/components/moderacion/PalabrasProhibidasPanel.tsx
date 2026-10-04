'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Trash2, Power, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

type PalabraProhibida = {
  palabra: string
  activa: boolean
}

export function PalabrasProhibidasPanel() {
  const [palabras, setPalabras] = useState<PalabraProhibida[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [nuevaPalabra, setNuevaPalabra] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelado = false

    async function cargarInicial() {
      try {
        const res = await fetch('/api/moderacion/palabras')
        const data = await res.json()
        
        if (cancelado) return

        if (!res.ok) {
          setError(data.error ?? 'No se pudo cargar las palabras')
          return
        }

        setPalabras(data)
      }catch {
        if (!cancelado) setError('No se pudo conectar con el servidor')
      } finally {
        if (!cancelado) {
          setCargando(false)
        }
      }
    }

    cargarInicial()

    return () => {
      cancelado = true
    }
  }, [])

  async function agregarPalabra() {
    const palabra = nuevaPalabra.trim()

    if (!palabra) {
      setError('Escribe una palabra antes de agregarla')
      return
    }

    setError('')
    setGuardando(true)

    try {
      const res = await fetch('/api/moderacion/palabras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ palabra }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'No se pudo agregar la palabra')
        return
      }

      setPalabras((actuales) => {
        const existe = actuales.some((item) => item.palabra === data.palabra)

        if (existe) {
          return actuales.map((item) =>
            item.palabra === data.palabra ? data : item
          )
        }

        return [...actuales, data].sort((a, b) =>
          a.palabra.localeCompare(b.palabra)
        )
      })

      setNuevaPalabra('')
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarEstado(palabra: PalabraProhibida) {
    setError('')

    try {
      const res = await fetch('/api/moderacion/palabras', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          palabra: palabra.palabra,
          activa: !palabra.activa,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'No se pudo cambiar el estado')
        return
      }

      setPalabras((actuales) =>
        actuales.map((item) =>
          item.palabra === data.palabra ? data : item
        )
      )
    } catch {
      setError('No se pudo conectar con el servidor')
    }
  }

  async function eliminarPalabra(palabra: string) {
    if (!window.confirm(`¿Eliminar definitivamente "${palabra}"?`)) {
      return
    }

    setError('')

    try {
      const res = await fetch('/api/moderacion/palabras', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ palabra }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'No se pudo eliminar la palabra')
        return
      }

      setPalabras((actuales) =>
        actuales.filter((item) => item.palabra !== data.palabra)
      )
    } catch {
      setError('No se pudo conectar con el servidor')
    }
  }

  const palabrasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()

    if (!termino) return palabras

    return palabras.filter((item) =>
      item.palabra.toLowerCase().includes(termino)
    )
  }, [palabras, busqueda])

  return (
    <Card className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex flex-col gap-1">
        <h3 className="font-mono text-base font-bold text-tinta">
          Palabras prohibidas
        </h3>
        <p className="text-sm text-tinta-suave">
          Administra las palabras que bloquean comentarios automáticamente.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Input
            value={nuevaPalabra}
            onChange={(event) => setNuevaPalabra(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !guardando) {
                agregarPalabra()
              }
            }}
            placeholder="Nueva palabra..."
            aria-label="Nueva palabra prohibida"
          />
        </div>

        <Button
          type="button"
          size="sm"
          disabled={guardando}
          onClick={agregarPalabra}
        >
          <Plus className="h-4 w-4" />
          {guardando ? 'Agregando…' : 'Agregar'}
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-suave" />
        <Input
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar palabra..."
          aria-label="Buscar palabra prohibida"
          className="pl-9"
        />
      </div>

      {error && (
        <p className="rounded border border-lapiz-rojo/30 bg-lapiz-rojo/5 p-2.5 text-sm text-lapiz-rojo">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-sm text-tinta-suave">Cargando palabras…</p>
      ) : palabrasFiltradas.length === 0 ? (
        <p className="py-6 text-center text-sm text-tinta-suave">
          {busqueda ? 'No hay coincidencias.' : 'No hay palabras registradas.'}
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-linea rounded border border-linea">
          {palabrasFiltradas.map((item) => (
            <div
              key={item.palabra}
              className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold text-tinta">
                  {item.palabra}
                </span>

                <Badge color={item.activa ? 'musgo' : 'ocre'}>
                  {item.activa ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => cambiarEstado(item)}
                >
                  {item.activa ? (
                    <PowerOff className="h-4 w-4" />
                  ) : (
                    <Power className="h-4 w-4" />
                  )}
                  {item.activa ? 'Desactivar' : 'Activar'}
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => eliminarPalabra(item.palabra)}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
