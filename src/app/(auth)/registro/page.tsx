'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Logo } from '@/components/ui/Logo'
import { DOMINIO_CORREO } from '@/lib/constants'

type Carrera = {
  id: string
  nombre: string
}

const SEMESTRES = Array.from({ length: 10 }, (_, index) => index + 1)

export default function RegistroPage() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [carreraId, setCarreraId] = useState('')
  const [semestre, setSemestre] = useState('')
  const [password, setPassword] = useState('')
  const [carreras, setCarreras] = useState<Carrera[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function cargarCarreras() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('carreras')
        .select('id, nombre')
        .order('nombre')

      if (error) {
        setError('No se pudieron cargar las carreras. Intenta nuevamente.')
        return
      }

      setCarreras(data ?? [])
    }

    cargarCarreras()
  }, [])

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.endsWith(`@${DOMINIO_CORREO}`)) {
      setError(`Solo se aceptan correos @${DOMINIO_CORREO}`)
      return
    }

    if (!carreraId) {
      setError('Selecciona tu carrera')
      return
    }

    if (!semestre) {
      setError('Selecciona tu semestre')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          carrera_id: carreraId,
          semestre: Number(semestre),
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/explorar`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user?.identities?.length === 0) {
      setError('Ese correo ya está registrado. Inicia sesión o recupera tu contraseña.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <Card className="flex w-full max-w-sm flex-col gap-4 p-8 text-center">
          <h1 className="font-mono text-lg font-bold text-tinta">¡Ya casi!</h1>
          <p className="text-sm text-tinta-suave">
            Revisa tu bandeja de entrada en{' '}
            <strong className="text-tinta">{email}</strong> y confirma tu cuenta.
          </p>
          <p className="text-xs text-tinta-suave">
            Si no lo ves en unos minutos, revisa tu carpeta de spam o correo no deseado.
          </p>
          <Link href="/login" className="text-sm text-lapiz-rojo hover:underline">
            Volver al inicio de sesión
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <Card className="flex w-full max-w-sm flex-col gap-6 p-8">
        <div className="flex flex-col gap-1">
          <Link href="/">
            <Logo className="text-2xl" />
          </Link>
          <p className="text-sm text-tinta-suave">Crea tu cuenta con correo institucional</p>
        </div>

        <form onSubmit={handleRegistro} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nombre" className="font-mono text-sm font-medium text-tinta">Nombre</label>
            <p id="nombre-ayuda" className="text-xs text-tinta-suave">Usa el nombre con el que quieres aparecer en Parci.</p>
            <Input
              id="nombre"
              name="nombre"
              autoComplete="name"
              aria-describedby="nombre-ayuda"
              placeholder="Tu nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="font-mono text-sm font-medium text-tinta">Correo institucional</label>
            <Input
              id="email"
              name="email"
              autoComplete="email"
              type="email"
              placeholder={`usuario@${DOMINIO_CORREO}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="carrera_id" className="font-mono text-sm font-medium text-tinta">Carrera</label>
            <p id="carrera-ayuda" className="text-xs text-tinta-suave">La usaremos para mostrarte parciales de tu carrera.</p>
            <select
              id="carrera_id"
              name="carrera_id"
              aria-describedby="carrera-ayuda"
              value={carreraId}
              onChange={(e) => setCarreraId(e.target.value)}
              required
              className="h-10 rounded-md border border-linea bg-papel px-3 text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo"
            >
              <option value="">Selecciona tu carrera</option>
              {carreras.map((carrera) => (
                <option key={carrera.id} value={carrera.id}>
                  {carrera.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="semestre" className="font-mono text-sm font-medium text-tinta">Semestre</label>
            <p id="semestre-ayuda" className="text-xs text-tinta-suave">El semestre que cursas actualmente.</p>
            <select
              id="semestre"
              name="semestre"
              aria-describedby="semestre-ayuda"
              value={semestre}
              onChange={(e) => setSemestre(e.target.value)}
              required
              className="h-10 rounded-md border border-linea bg-papel px-3 text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo"
            >
              <option value="">Selecciona tu semestre</option>
              {SEMESTRES.map((numero) => (
                <option key={numero} value={numero}>
                  {numero} semestre
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="font-mono text-sm font-medium text-tinta">Contraseña</label>
            <p id="password-ayuda" className="text-xs text-tinta-suave">Mínimo 8 caracteres.</p>
            <Input
              id="password"
              name="password"
              autoComplete="new-password"
              aria-describedby="password-ayuda"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p role="alert" className="text-sm text-lapiz-rojo">{error}</p>}

          <Button type="submit" disabled={loading || carreras.length === 0} className="mt-2">
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="text-center text-sm text-tinta-suave">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-lapiz-rojo hover:underline">
            Inicia sesión
          </Link>
        </p>
      </Card>
    </div>
  )
}
