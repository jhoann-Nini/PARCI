import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BookOpen, Download, FileUp, Star, ThumbsUp, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ExamenCard } from '@/components/parciales/ExamenCard'
import type { ColorCarrera } from '@/lib/constants'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre, correo_institucional, carrera_id, rol, carreras(nombre, color)')
    .eq('id', user.id)
    .single()

  const [{ count: subidos }, { count: favoritos }, { count: votos }, { count: comentarios }] = await Promise.all([
    supabase.from('documentos').select('id', { count: 'exact', head: true }).eq('subido_por', user.id),
    supabase.from('favoritos').select('documento_id', { count: 'exact', head: true }).eq('usuario_id', user.id),
    supabase.from('votos').select('documento_id', { count: 'exact', head: true }).eq('usuario_id', user.id),
    supabase.from('comentarios').select('id', { count: 'exact', head: true }).eq('usuario_id', user.id),
  ])

  const { data: favoritosRows } = await supabase
    .from('favoritos')
    .select('documentos(id, oferta_id, corte, fecha_subida, ofertas(materia_id, semestre, materias(nombre, carreras(nombre, color))))')
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false })
    .limit(12)

  const docs = (favoritosRows ?? []).map((row: any) => {
    const d = row.documentos
    const o = d?.ofertas
    const m = o?.materias
    const c = m?.carreras
    return d && o && m ? {
      id: d.id, materia: m.nombre, carrera: c?.nombre ?? 'Carrera',
      carreraColor: (c?.color ?? 'aula') as ColorCarrera, semestre: o.semestre,
      corte: d.corte, temas: null, votosCount: 0, yaVoto: false,
      comentariosCount: 0, loggedIn: true, esDueno: false,
    } : null
  }).filter(Boolean) as any[]

  const carrera = Array.isArray(perfil?.carreras) ? perfil?.carreras[0] : perfil?.carreras

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-wider text-tinta-suave">Mi espacio</p>
        <h1 className="font-mono text-2xl font-bold text-tinta">Mi perfil</h1>
        <p className="text-sm text-tinta-suave">Consulta tu actividad, tus parciales guardados y tus aportes.</p>
      </section>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-linea bg-papel">
              <UserRound className="h-6 w-6 text-tinta-suave" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-mono text-lg font-bold">{perfil?.nombre ?? user.user_metadata?.nombre ?? 'Estudiante'}</h2>
              <p className="truncate text-sm text-tinta-suave">{perfil?.correo_institucional ?? user.email}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {carrera?.nombre && <Badge color={(carrera.color ?? 'aula') as ColorCarrera}>{carrera.nombre}</Badge>}
                <Badge>{perfil?.rol ?? 'estudiante'}</Badge>
              </div>
            </div>
          </div>
          <Link href="/perfil/editar" className="w-full sm:w-auto"><Button variant="ghost" className="w-full sm:w-auto">Editar perfil</Button></Link>
        </div>
      </Card>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<FileUp />} value={subidos ?? 0} label="Subidos" />
        <Stat icon={<Star />} value={favoritos ?? 0} label="Guardados" />
        <Stat icon={<ThumbsUp />} value={votos ?? 0} label="Votos" />
        <Stat icon={<BookOpen />} value={comentarios ?? 0} label="Comentarios" />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><h2 className="font-mono text-lg font-bold">Mis favoritos</h2><p className="mt-1 text-xs text-tinta-suave">Parciales que guardaste para volver después.</p></div>
          <Star className="h-5 w-5 shrink-0 text-resaltador" />
        </div>
        {docs.length === 0 ? (
          <Card className="p-8 text-center"><p className="text-sm text-tinta-suave">Todavía no tienes parciales guardados.</p><Link href="/explorar" className="mt-3 inline-block"><Button variant="accent" size="sm">Explorar parciales</Button></Link></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{docs.map((doc) => <ExamenCard key={doc.id} {...doc} />)}</div>
        )}
      </section>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return <Card className="flex min-w-0 flex-col gap-2 p-4"><div className="text-tinta-suave [&>svg]:h-4 [&>svg]:w-4">{icon}</div><strong className="font-mono text-xl">{value}</strong><span className="truncate text-xs text-tinta-suave">{label}</span></Card>
}
