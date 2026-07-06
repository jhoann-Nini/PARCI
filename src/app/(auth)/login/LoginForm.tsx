'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Logo } from '@/components/ui/Logo'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(
    searchParams.get('error') === 'confirmacion'
      ? 'No pudimos confirmar tu cuenta con ese enlace. Intenta iniciar sesión o regístrate de nuevo.'
      : ''
  )
  const [loading,  setLoading]  = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(
        error.message === 'Email not confirmed'
          ? 'Aún no confirmas tu cuenta. Revisa tu correo institucional y haz clic en el enlace de confirmación.'
          : 'Correo o contraseña incorrectos'
      )
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <Card className="w-full max-w-sm p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/">
          <Logo className="text-2xl" />
        </Link>
        <p className="text-sm text-tinta-suave">Inicia sesión con tu correo institucional</p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-sm font-medium text-tinta">Correo institucional</label>
          <Input
            type="email"
            placeholder="usuario@correounivalle.edu.co"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-sm font-medium text-tinta">Contraseña</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-lapiz-rojo">{error}</p>
        )}

        <Button type="submit" disabled={loading} className="mt-2">
          {loading ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>

      <p className="text-center text-sm text-tinta-suave">
        ¿No tienes cuenta?{' '}
        <Link href="/registro" className="text-lapiz-rojo hover:underline">
          Regístrate
        </Link>
      </p>
    </Card>
  )
}
