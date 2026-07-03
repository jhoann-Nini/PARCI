'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DOMINIO_CORREO } from '@/lib/constants'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email    = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  redirect('/')
}

export async function registro(formData: FormData) {
  const supabase = await createClient()
  const email    = (formData.get('email') as string).trim().toLowerCase()
  const password = formData.get('password') as string
  const nombre   = (formData.get('nombre') as string).trim()

  if (!email.endsWith(`@${DOMINIO_CORREO}`)) {
    return {
      error: `Solo se aceptan correos institucionales (@${DOMINIO_CORREO})`,
    }
  }

  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirmar`,
    },
  })

  if (error) return { error: error.message }

  return { success: 'Revisa tu correo para confirmar tu cuenta' }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
