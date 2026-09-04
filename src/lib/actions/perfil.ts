'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function actualizarPerfil(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const nombre = String(formData.get('nombre') ?? '').trim()
  const carreraId = String(formData.get('carrera_id') ?? '').trim()
  if (!nombre) redirect('/perfil/editar?error=El%20nombre%20es%20obligatorio')

  const { error } = await supabase.from('perfiles').update({
    nombre,
    carrera_id: carreraId || null,
  }).eq('id', user.id)

  if (error) redirect('/perfil/editar?error=No%20fue%20posible%20actualizar%20el%20perfil')
  redirect('/perfil')
}
