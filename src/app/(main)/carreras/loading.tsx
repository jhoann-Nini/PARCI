function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-linea/60 ${className}`} />
}

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando carreras"
      className="flex flex-col gap-8"
    >
      <section className="max-w-2xl">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-3 h-9 w-80 max-w-full" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="rounded-lg border border-linea bg-papel p-5 shadow-paper-sm"
          >
            <Skeleton className="mb-5 h-2 w-14" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="mt-2 h-4 w-2/5" />
          </div>
        ))}
      </div>

      <span className="sr-only">Cargando carreras, espera un momento.</span>
    </div>
  )
}
