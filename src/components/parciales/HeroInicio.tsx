import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function HeroInicio() {
  return (
    <section className="flex flex-col items-center px-2 pb-2 pt-10 text-center sm:pt-14">
      <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-lapiz-rojo sm:text-xs">
        Universidad del Valle · Sede Tuluá
      </p>

      <h1 className="max-w-3xl font-serif text-5xl font-bold leading-[0.98] tracking-tight text-tinta sm:text-6xl lg:text-7xl">
        El parcial que
        <br />
        <span className="text-lapiz-rojo">ya pasó</span> por aquí.
      </h1>

      <p className="mt-6 max-w-xl text-sm leading-6 text-tinta-suave sm:text-base">
        Encuentra exámenes de semestres anteriores,
        <br className="hidden sm:block" />
        organizados por materia y profe. Sin registro, sin rodeos.
      </p>

      <form method="GET" action="/explorar" className="mt-8 w-full max-w-2xl">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-tinta-suave"
            aria-hidden="true"
          />
          <Input
            name="q"
            placeholder="Busca por materia, profe o carrera..."
            aria-label="Buscar parciales"
            className="h-12 w-full rounded-md bg-white pl-12 pr-4 text-sm shadow-paper-sm sm:h-13"
          />
        </div>

        <Button
          type="submit"
          variant="accent"
          className="mt-3 h-11 w-full font-semibold sm:h-12"
        >
          Buscar parciales
        </Button>
      </form>
    </section>
  )
}
