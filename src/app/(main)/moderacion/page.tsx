import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModeracionCard } from '@/components/parciales/ModeracionCard'
import type { ColorCarrera } from '@/lib/constants'

type DocumentoReportado = {
  id: string
  corte: string
  archivo_url: string
  fecha_subida: string
  oferta: {
    semestre: string
    materia: { nombre: string; carrera: { nombre: string; color: ColorCarrera } } | null
    profesor: { nombre: string } | null
  } | null
  reportes: { id: string; motivo: string; fecha: string }[]
}

export default async function ModeracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/moderacion')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!perfil || !['supervisor', 'administrador'].includes(perfil.rol)) {
    redirect('/explorar')
  }

  const { data: documentos } = await supabase
    .from('documentos')
    .select(`
      id, corte, archivo_url, fecha_subida,
      oferta:ofertas (
        semestre,
        materia:materias ( nombre, carrera:carreras ( nombre, color ) ),
        profesor:profesores ( nombre )
      ),
      reportes ( id, motivo, fecha )
    `)
    .eq('estado', 'reportado')
    .order('fecha_subida', { ascending: false })

  const items = (documentos ?? []) as unknown as DocumentoReportado[]

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h1 className="font-mono text-2xl font-bold text-tinta">Moderación</h1>
        <p className="text-sm text-tinta-suave">
          Documentos reportados por la comunidad. Revísalos y decide si se quedan o se retiran.
        </p>
      </section>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="font-mono text-4xl text-linea">✓</span>
          <p className="text-tinta-suave">No hay documentos reportados pendientes.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((doc) => (
            <ModeracionCard
              key={doc.id}
              id={doc.id}
              materia={doc.oferta?.materia?.nombre ?? '—'}
              profesor={doc.oferta?.profesor?.nombre ?? '—'}
              carrera={doc.oferta?.materia?.carrera?.nombre ?? '—'}
              carreraColor={doc.oferta?.materia?.carrera?.color ?? 'aula'}
              semestre={doc.oferta?.semestre ?? '—'}
              corte={doc.corte}
              archivoUrl={doc.archivo_url}
              reportes={doc.reportes}
            />
          ))}
        </div>
      )}
    </div>
  )
}
