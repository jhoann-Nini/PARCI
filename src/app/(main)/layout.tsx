import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
      <footer className="border-t py-6 text-center text-xs text-tinta-suave">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
          <span>Parci · Para universitarios</span>
          <Link
            href="/privacidad"
            className="underline underline-offset-2 hover:text-tinta focus-visible:outline-2 focus-visible:outline-lapiz-rojo"
          >
            Política de privacidad
          </Link>
        </div>
      </footer>
    </>
  )
}
