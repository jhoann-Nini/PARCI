'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Logo } from '@/components/ui/Logo'
import { DOMINIO_CORREO } from '@/lib/constants'

export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRecovery(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const correo = email.trim().toLowerCase()

    if (!correo.endsWith(`@${DOMINIO_CORREO}`)) {
      setError(`Usa tu correo institucional @${DOMINIO_CORREO}`)
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(correo, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/restablecer`,
    })

    if (error) {
      console.error('Error al solicitar recuperación:', error)
      setError('No pudimos enviar el correo de recuperación. Intenta nuevamente.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Link href="/">
            <Logo className="text-2xl" />
          </Link>
          <h1 className="font-mono text-xl font-bold text-tinta">
            Recuperar contraseña
          </h1>
          <p className="text-sm leading-relaxed text-tinta-suave">
            Te enviaremos un enlace a tu correo institucional para crear una nueva contraseña.
          </p>
        </div>

        {success ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <p className="font-mono text-sm font-semibold text-tinta">
                ¡Solicitud enviada!
              </p>
              <p className="text-sm leading-relaxed text-tinta">
                Si el correo está registrado, recibirás un enlace para recuperar tu contraseña.
              </p>
              <p className="text-sm leading-relaxed text-tinta-suave">
                Revisa tu bandeja de entrada y la carpeta de spam.
              </p>
            </div>

            <Link
              href="/login"
              className="text-center text-sm text-lapiz-rojo hover:underline"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleRecovery} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="recuperar-email"
                  className="font-mono text-sm font-medium text-tinta"
                >
                  Correo institucional
                </label>
                <Input
                  id="recuperar-email"
                  name="email"
                  autoComplete="email"
                  type="email"
                  placeholder={`usuario@${DOMINIO_CORREO}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-lapiz-rojo">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={loading}>
                {loading ? 'Enviando…' : 'Enviar enlace'}
              </Button>
            </form>

            <p className="text-center text-sm text-tinta-suave">
              <Link href="/login" className="text-lapiz-rojo hover:underline">
                Volver a iniciar sesión
              </Link>
            </p>
          </>
        )}
      </Card>
    </div>
  )
}
