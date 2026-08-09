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
      id, corte, archivo_url, fecha_subida, estado,
      oferta:ofertas (
        semestre,
        materia:materias ( nombre, carrera:carreras ( nombre, color ) )
      ),
      reportes ( id, motivo, fecha )
    `)
    .in('estado', ['reportado', 'activo'])
    .order('fecha_subida', { ascending: false })

  const todos = (documentos ?? []) as unknown as (DocumentoReportado & { estado: string })[]
  const reportados = todos.filter((d) => d.estado === 'reportado')
  const activos = todos.filter((d) => d.estado === 'activo')

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-mono text-2xl font-bold text-tinta">Moderación</h1>
          <p className="text-sm text-tinta-suave">
            Documentos reportados por la comunidad. Revísalos y decide si se quedan o se retiran.
          </p>
        </div>

        {reportados.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="font-mono text-4xl text-linea">✓</span>
            <p className="text-tinta-suave">No hay documentos reportados pendientes.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {reportados.map((doc) => (
              <ModeracionCard
                key={doc.id}
                id={doc.id}
                materia={doc.oferta?.materia?.nombre ?? '—'}
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
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="font-mono text-lg font-bold text-tinta">Todos los documentos</h2>
          <p className="text-sm text-tinta-suave">
            Sin reportes, pero también puedes retirarlos si hace falta.
          </p>
        </div>

        {activos.length === 0 ? (
          <p className="text-sm text-tinta-suave">No hay documentos activos.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {activos.map((doc) => (
              <ModeracionCard
                key={doc.id}
                id={doc.id}
                materia={doc.oferta?.materia?.nombre ?? '—'}
                carrera={doc.oferta?.materia?.carrera?.nombre ?? '—'}
                carreraColor={doc.oferta?.materia?.carrera?.color ?? 'aula'}
                semestre={doc.oferta?.semestre ?? '—'}
                corte={doc.corte}
                archivoUrl={doc.archivo_url}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
