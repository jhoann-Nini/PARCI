import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/lib/actions/auth'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let esModerador = false
  if (user) {
    const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
    esModerador = perfil ? ['supervisor', 'administrador', 'admin'].includes(perfil.rol) : false
  }

  return (
    <header className="sticky top-0 z-40 border-b border-linea bg-papel/90 backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-5xl items-center justify-between gap-3 px-4 py-2">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <Logo className="text-xl" />
          <span className="hidden text-xs text-tinta-suave sm:inline">Univalle · Tuluá</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-tinta-suave sm:flex">
          <Link href="/explorar" className="transition-colors hover:text-tinta">Explorar</Link>
          {user && <Link href="/perfil" className="transition-colors hover:text-tinta">Mi perfil</Link>}
          {esModerador && <Link href="/moderacion" className="transition-colors hover:text-tinta">Moderación</Link>}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          {user ? <>
            <Link href="/subir"><Button variant="accent" size="sm">Subir parcial</Button></Link>
            <form action={logout}><Button type="submit" variant="ghost" size="sm">Salir</Button></form>
          </> : <>
            <Link href="/login"><Button variant="ghost" size="sm">Iniciar sesión</Button></Link>
            <Link href="/registro"><Button size="sm">Registrarse</Button></Link>
          </>}
        </div>

        <details className="relative sm:hidden">
          <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md border border-linea text-tinta [&::-webkit-details-marker]:hidden" aria-label="Abrir menú">
            <span className="text-lg leading-none">☰</span>
          </summary>
          <div className="absolute right-0 top-11 z-50 w-56 rounded-md border border-linea bg-papel p-2 shadow-paper">
            <div className="flex flex-col gap-1">
              <Link href="/explorar" className="rounded px-3 py-2 text-sm hover:bg-white/40">Explorar</Link>
              {user && <Link href="/perfil" className="rounded px-3 py-2 text-sm hover:bg-white/40">Mi perfil</Link>}
              {esModerador && <Link href="/moderacion" className="rounded px-3 py-2 text-sm hover:bg-white/40">Moderación</Link>}
              {user ? <>
                <Link href="/subir" className="mt-1 rounded px-3 py-2 text-sm font-medium text-lapiz-rojo hover:bg-white/40">+ Subir parcial</Link>
                <form action={logout}><button type="submit" className="w-full rounded px-3 py-2 text-left text-sm text-tinta-suave hover:bg-white/40">Salir</button></form>
              </> : <>
                <Link href="/login" className="rounded px-3 py-2 text-sm hover:bg-white/40">Iniciar sesión</Link>
                <Link href="/registro" className="rounded px-3 py-2 text-sm font-medium text-lapiz-rojo hover:bg-white/40">Registrarse</Link>
              </>}
            </div>
          </div>
        </details>
      </div>
    </header>
  )
}
