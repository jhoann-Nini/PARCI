import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MiniExamenCard } from '@/components/parciales/MiniExamenCard'
import { ContadorAnimado } from './ContadorAnimado'
import type { ColorCarrera } from '@/lib/constants'

const TAB_COLOR: Record<ColorCarrera, string> = {
  aula:    'var(--color-azul-aula)',
  musgo:   'var(--color-verde-musgo)',
  ocre:    'var(--color-ocre)',
  ciruela: 'var(--color-ciruela)',
}

interface DocumentoResumen {
  id: string
  materia_id: string
  materia_nombre: string
  corte: string
  semestre: string
  fecha_subida: string
  votos_count: number
}

interface CategoriaCarreraProps {
  carreraId: string
  nombre: string
  color: ColorCarrera
  total: number
  documentos: DocumentoResumen[]
}

/**
 * Sección "Explora por carrera": pestaña de carpeta de color sólido
 * + fila horizontal de vistas previas. Solo se renderiza cuando la
 * carrera tiene al menos un documento activo (ver caller).
 */
export function CategoriaCarrera({ carreraId, nombre, color, total, documentos }: CategoriaCarreraProps) {
  return (
    <section className="mb-8">
      <div
        className="inline-flex items-center gap-2 px-4 py-2 font-mono text-sm font-bold text-papel"
        style={{ backgroundColor: TAB_COLOR[color], borderRadius: '8px 14px 0 0' }}
      >
        {nombre}
        <span className="font-mono text-xs font-normal text-papel/80">
          <ContadorAnimado valor={total} />
        </span>
      </div>

      <div className="rounded-b-lg rounded-tr-lg border border-linea bg-white p-4 shadow-paper-sm">
        <div className="flex snap-x snap-proximity gap-3 overflow-x-auto scroll-smooth pb-1">
          {documentos.map((doc) => (
            <MiniExamenCard
              key={doc.id}
              carreraId={carreraId}
              materiaId={doc.materia_id}
              materia={doc.materia_nombre}
              corte={doc.corte}
              semestre={doc.semestre}
              fechaSubida={doc.fecha_subida}
              votosCount={doc.votos_count}
            />
          ))}

          <Link
            href={`/explorar?carrera_id=${carreraId}`}
            className="flex w-[110px] shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded border-2 border-dashed border-linea px-2 text-center text-xs text-tinta-suave transition-colors hover:border-tinta-suave hover:text-tinta"
          >
            <ArrowRight className="h-4 w-4" />
            Ver las <ContadorAnimado valor={total} />
          </Link>
        </div>
      </div>
    </section>
  )
}