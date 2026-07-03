import { Navbar } from '@/components/layout/Navbar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
      <footer className="border-t py-6 text-center text-xs text-tinta-suave">
        Parci · Universidad del Valle, sede Tuluá
      </footer>
    </>
  )
}
