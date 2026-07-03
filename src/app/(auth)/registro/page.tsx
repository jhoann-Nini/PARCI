'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DOMINIO_CORREO } from '@/lib/constants'

export default function RegistroPage() {
  const [nombre,   setNombre]   = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)
  const [loading,  setLoading]  = useState(false)

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.endsWith(`@${DOMINIO_CORREO}`)) {
      setError(`Solo se aceptan correos @${DOMINIO_CORREO}`)
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cuadricula bg-papel px-4">
        <div className="w-full max-w-sm rounded-xl border bg-papel p-8 shadow-sm flex flex-col gap-4 text-center">
          <p className="font-mono text-lg font-bold text-tinta">¡Ya casi!</p>
          <p className="text-sm text-tinta-suave">
            Revisa tu bandeja de entrada en{' '}
            <strong className="text-tinta">{email}</strong> y confirma tu cuenta.
          </p>
          <Link href="/login" className="text-sm text-lapiz-rojo hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cuadricula bg-papel px-4">
      <div className="w-full max-w-sm rounded-xl border bg-papel p-8 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <Link href="/" className="font-mono text-2xl font-bold text-tinta">Parci</Link>
          <p className="text-sm text-tinta-suave">Crea tu cuenta con correo institucional</p>
        </div>

        <form onSubmit={handleRegistro} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-tinta">Nombre</label>
            <Input
              placeholder="Tu nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-tinta">Correo institucional</label>
            <Input
              type="email"
              placeholder={`usuario@${DOMINIO_CORREO}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-tinta">Contraseña</label>
            <Input
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-lapiz-rojo">{error}</p>}

          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="text-center text-sm text-tinta-suave">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-lapiz-rojo hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
