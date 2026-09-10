import { ContadorAnimado } from '@/components/parciales/ContadorAnimado'

interface EstadisticasInicioProps {
  parciales: number
  materias: number
  carreras: number
}

export function EstadisticasInicio({ parciales, materias, carreras }: EstadisticasInicioProps) {
  const items = [
    { valor: parciales, etiqueta: 'Parciales subidos' },
    { valor: materias, etiqueta: 'Materias' },
    { valor: carreras, etiqueta: 'Carreras' },
  ]

  return (
    <section className="mx-auto mt-8 grid w-full max-w-2xl grid-cols-3 overflow-hidden rounded-md border border-linea bg-white shadow-paper-sm">
      {items.map((item, index) => (
        <div
          key={item.etiqueta}
          className={`flex min-h-24 flex-col items-center justify-center px-2 py-4 text-center ${
            index > 0 ? 'border-l border-linea' : ''
          }`}
        >
          <ContadorAnimado
            valor={item.valor}
            className="font-serif text-3xl font-bold leading-none text-lapiz-rojo sm:text-4xl"
          />
          <span className="mt-2 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-tinta-suave sm:text-[10px]">
            {item.etiqueta}
          </span>
        </div>
      ))}
    </section>
  )
}
