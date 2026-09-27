function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-linea/60 ${className}`} />
}

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando parciales"
      className="flex flex-col gap-8"
    >
      <section className="flex flex-col gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-80 max-w-full" />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full sm:w-40" />
        </div>
        <div className="flex items-center justify-between border-t border-linea pt-3">
          <Skeleton className="h-10 w-40" />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="flex min-h-72 flex-col gap-4 rounded-md border border-linea bg-papel p-4 shadow-paper-sm"
            >
              <Skeleton className="h-10 w-8" />
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-6 w-3/5" />
              <Skeleton className="h-7 w-full" />
              <Skeleton className="mt-auto h-8 w-2/3" />
            </div>
          ))}
        </div>
      </section>

      <span className="sr-only">Cargando parciales, espera un momento.</span>
    </div>
  )
}
