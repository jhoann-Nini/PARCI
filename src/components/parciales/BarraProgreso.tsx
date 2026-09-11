interface BarraProgresoProps {
  paso: 1 | 2 | 3
}

const PASOS = [
  { n: 1, label: 'Contexto' },
  { n: 2, label: 'Detalles' },
  { n: 3, label: 'Archivo' },
] as const

export function BarraProgreso({ paso }: BarraProgresoProps) {
  return (
    <div className="flex items-center">
      {PASOS.map((p, i) => (
        <div key={p.n} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 font-mono text-xs font-bold transition-colors ${
                p.n < paso
                  ? 'border-lapiz-rojo bg-lapiz-rojo text-papel'
                  : p.n === paso
                    ? 'border-lapiz-rojo bg-papel text-lapiz-rojo'
                    : 'border-linea bg-papel text-tinta-suave'
              }`}
            >
              {p.n < paso ? '✓' : p.n}
            </div>
            <span
              className={`font-mono text-[10px] uppercase tracking-wide ${
                p.n <= paso ? 'text-tinta' : 'text-tinta-suave'
              }`}
            >
              {p.label}
            </span>
          </div>
          {i < PASOS.length - 1 && (
            <div
              className={`mx-2 h-0.5 flex-1 transition-colors ${p.n < paso ? 'bg-lapiz-rojo' : 'bg-linea'}`}
              style={{ marginBottom: '1.1rem' }}
            />
          )}
        </div>
      ))}
    </div>
  )
}
