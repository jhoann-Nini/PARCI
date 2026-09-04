'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function actualizarPerfil(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const nombre = String(formData.get('nombre') ?? '').trim()
  const carreraId = String(formData.get('carrera_id') ?? '').trim()
  if (!nombre) return { error: 'El nombre es obligatorio.' }

  const { error } = await supabase.from('perfiles').update({
    nombre,
    carrera_id: carreraId || null,
  }).eq('id', user.id)

  if (error) return { error: 'No fue posible actualizar el perfil.' }
  redirect('/perfil')
}
