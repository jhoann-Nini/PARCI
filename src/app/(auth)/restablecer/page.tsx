'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Logo } from '@/components/ui/Logo'

export default function RestablecerPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setError('El enlace de recuperación no es válido o ya expiró. Solicita uno nuevo.')
      }
      setCheckingSession(false)
    })
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      console.error('Error al restablecer contraseña:', error)
      setError('No pudimos actualizar la contraseña. Solicita un nuevo enlace e inténtalo otra vez.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <Link href="/">
            <Logo className="text-2xl" />
          </Link>
          <h1 className="font-mono text-xl font-bold text-tinta">
            Nueva contraseña
          </h1>
          <p className="text-sm text-tinta-suave">
            Crea una nueva contraseña para tu cuenta de PARCI.
          </p>
        </div>

        {checkingSession ? (
          <p className="text-sm text-tinta-suave">Verificando el enlace…</p>
        ) : success ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-tinta">
              Tu contraseña fue actualizada correctamente.
            </p>
            <Link
              href="/login"
              className="text-center text-sm text-lapiz-rojo hover:underline"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="restablecer-password"
                className="font-mono text-sm font-medium text-tinta"
              >
                Nueva contraseña
              </label>
              <Input
                id="restablecer-password"
                name="password"
                autoComplete="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="restablecer-confirm-password"
                className="font-mono text-sm font-medium text-tinta"
              >
                Confirmar contraseña
              </label>
              <Input
                id="restablecer-confirm-password"
                name="confirmPassword"
                autoComplete="new-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-lapiz-rojo">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? 'Actualizando…' : 'Cambiar contraseña'}
            </Button>
          </form>
        )}

        {!checkingSession && !success && (
          <p className="text-center text-sm text-tinta-suave">
            <Link href="/recuperar" className="text-lapiz-rojo hover:underline">
              Solicitar otro enlace
            </Link>
          </p>
        )}
      </Card>
    </div>
  )
}
