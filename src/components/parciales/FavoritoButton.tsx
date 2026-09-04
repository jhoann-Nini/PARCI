'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FavoritoButtonProps {
  documentoId: string
  loggedIn: boolean
}

export function FavoritoButton({ documentoId, loggedIn }: FavoritoButtonProps) {
  const [guardado, setGuardado] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!loggedIn) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase
        .from('favoritos')
        .select('documento_id')
        .eq('usuario_id', data.user.id)
        .eq('documento_id', documentoId)
        .maybeSingle()
        .then(({ data: favorito }) => setGuardado(!!favorito))
    })
  }, [documentoId, loggedIn])

  async function toggle() {
    if (!loggedIn || loading) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    if (guardado) {
      await supabase.from('favoritos').delete().eq('usuario_id', user.id).eq('documento_id', documentoId)
      setGuardado(false)
    } else {
      const { error } = await supabase.from('favoritos').insert({ usuario_id: user.id, documento_id: documentoId })
      if (!error) setGuardado(true)
    }
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!loggedIn || loading}
      title={loggedIn ? (guardado ? 'Quitar de favoritos' : 'Guardar parcial') : 'Inicia sesión para guardar'}
      aria-label={loggedIn ? (guardado ? 'Quitar de favoritos' : 'Guardar parcial') : 'Inicia sesión para guardar'}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-linea text-tinta-suave transition-colors hover:text-resaltador disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Star className={`h-4 w-4 ${guardado ? 'fill-resaltador text-resaltador' : ''}`} />
    </button>
  )
}
