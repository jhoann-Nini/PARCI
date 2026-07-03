import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/lib/actions/auth'
import { Button } from '@/components/ui/Button'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-40 border-b bg-papel/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-mono text-xl font-bold tracking-tight text-tinta">
            Parci
          </span>
          <span className="hidden text-xs text-tinta-suave sm:inline">
            Univalle · Tuluá
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden gap-6 text-sm text-tinta-suave sm:flex">
          <Link href="/explorar" className="hover:text-tinta transition-colors">
            Explorar
          </Link>
          <Link href="/sede" className="hover:text-tinta transition-colors">
            Info de la sede
          </Link>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/subir">
                <Button size="sm">Subir parcial</Button>
              </Link>
              <form action={logout}>
                <Button type="submit" variant="ghost" size="sm">
                  Salir
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Iniciar sesión</Button>
              </Link>
              <Link href="/registro">
                <Button size="sm">Registrarse</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
