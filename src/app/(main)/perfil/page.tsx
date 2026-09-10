import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/lib/actions/auth'
import { BookOpen, FileUp, Star, ThumbsUp, UserRound } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ExamenCard } from '@/components/parciales/ExamenCard'
import type { ColorCarrera } from '@/lib/constants'

type Carrera = { nombre: string; color: string }
type Materia = { nombre: string; carreras: Carrera | Carrera[] | null }
type Oferta = { materia_id: string; semestre: string; materias: Materia | Materia[] | null }
type DocumentoFavorito = { id: string; oferta_id: string; corte: string; fecha_subida: string; ofertas: Oferta | Oferta[] | null }
type FavoritoRow = { documentos: DocumentoFavorito | DocumentoFavorito[] | null }

function uno<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null
  return Array.isArray(valor) ? (valor[0] ?? null) : valor
}

export default async function PerfilPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { tab } = await searchParams
  const pestaña = tab === 'guardados' || tab === 'cuenta' ? tab : 'mis-parciales'

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre, correo_institucional, carrera_id, rol, carreras(nombre, color)')
    .eq('id', user.id)
    .single()

  const [{ count: subidos }, { count: favoritos }, { count: votos }] = await Promise.all([
    supabase.from('documentos').select('id', { count: 'exact', head: true }).eq('subido_por', user.id),
    supabase.from('favoritos').select('documento_id', { count: 'exact', head: true }).eq('usuario_id', user.id),
    supabase.from('votos').select('documento_id', { count: 'exact', head: true }).eq('usuario_id', user.id),
  ])

  const { data: favoritosRows } = await supabase
    .from('favoritos')
    .select('documentos(id, oferta_id, corte, fecha_subida, ofertas(materia_id, semestre, materias(nombre, carreras(nombre, color))))')
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false })
    .limit(12)

  const docs = (favoritosRows ?? []).map((row: FavoritoRow) => {
    const d = uno(row.documentos); const o = uno(d?.ofertas); const m = uno(o?.materias); const c = uno(m?.carreras)
    return d && o && m ? { id: d.id, materia: m.nombre, carrera: c?.nombre ?? 'Carrera', carreraColor: (c?.color ?? 'aula') as ColorCarrera, semestre: o.semestre, corte: d.corte, temas: null, votosCount: 0, yaVoto: false, comentariosCount: 0, loggedIn: true, esDueno: false } : null
  }).filter((doc): doc is NonNullable<typeof doc> => doc !== null)

  const carrera = Array.isArray(perfil?.carreras) ? perfil.carreras[0] : perfil?.carreras
  const nombre = perfil?.nombre ?? user.user_metadata?.nombre ?? 'Estudiante'
  const iniciales = nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  const semestre = user.user_metadata?.semestre ?? '—'
  const miembroDesde = user.created_at ? new Intl.DateTimeFormat('es-CO', { month: 'short', year: 'numeric' }).format(new Date(user.created_at)) : '—'

  return (
    <div className="-mx-4 -mt-8 flex min-h-[calc(100vh-4rem)] flex-col">
      <section className="bg-tinta text-papel">
        <div className="mx-auto w-full max-w-3xl px-5 pb-0 pt-8 sm:px-8 sm:pt-10">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-md border-2 border-azul-aula bg-azul-aula font-serif text-2xl font-bold text-papel sm:h-20 sm:w-20 sm:text-3xl">{iniciales || <UserRound />}</div>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-sm bg-resaltador px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-[#4A3800]">{perfil?.rol === 'estudiante' ? 'Estudiante' : perfil?.rol ?? 'Estudiante'}</span>
            </div>
            <div className="min-w-0 pt-0.5">
              <h1 className="truncate font-serif text-2xl font-bold sm:text-3xl">{nombre}</h1>
              <p className="mt-1 truncate font-mono text-[10px] text-azul-aula sm:text-xs">{perfil?.correo_institucional ?? user.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {carrera?.nombre && <Badge color="aula">{carrera.nombre}</Badge>}
                <span className="font-mono text-papel/70">↗ {semestre} semestre</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 border-t border-white/15">
            <ProfileStat value={subidos ?? 0} label="Subidos" />
            <ProfileStat value={0} label="Descargas" />
            <ProfileStat value={favoritos ?? 0} label="Guardados" />
          </div>
        </div>
      </section>

      <nav className="sticky top-14 z-30 border-b border-linea bg-papel/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl justify-center">
          <ProfileTab href="/perfil?tab=mis-parciales" active={pestaña === 'mis-parciales'}>Mis parciales</ProfileTab>
          <ProfileTab href="/perfil?tab=guardados" active={pestaña === 'guardados'}>Guardados</ProfileTab>
          <ProfileTab href="/perfil?tab=cuenta" active={pestaña === 'cuenta'}>Cuenta</ProfileTab>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-7 sm:px-8">
        {pestaña === 'cuenta' ? (
          <CuentaPanel nombre={nombre} correo={perfil?.correo_institucional ?? user.email ?? '—'} carrera={carrera?.nombre ?? '—'} semestre={semestre} rol={perfil?.rol ?? 'estudiante'} miembroDesde={miembroDesde} subidos={subidos ?? 0} />
        ) : (
          <section>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-tinta-suave">{pestaña === 'guardados' ? 'Parciales guardados' : `${subidos ?? 0} parciales subidos`}</p>
              </div>
              {pestaña === 'mis-parciales' && <Link href="/subir"><Button variant="danger" size="sm">+ Subir otro</Button></Link>}
            </div>
            {pestaña === 'guardados' ? (
              docs.length === 0 ? <Empty text="Todavía no tienes parciales guardados." /> : <div className="grid gap-4 sm:grid-cols-2">{docs.map((doc) => <ExamenCard key={doc.id} {...doc} />)}</div>
            ) : (
              <Empty text="Tus parciales subidos aparecerán aquí." action="Subir mi parcial" />
            )}
          </section>
        )}
      </main>
    </div>
  )
}

function ProfileStat({ value, label }: { value: number; label: string }) {
  return <div className="border-r border-white/15 py-4 text-center last:border-r-0"><strong className="font-serif text-2xl text-resaltador">{value}</strong><p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-papel/55">{label}</p></div>
}

function ProfileTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <Link href={href} className={`border-b-2 px-4 py-3 text-xs font-medium transition-colors sm:px-6 sm:text-sm ${active ? 'border-lapiz-rojo font-semibold text-tinta' : 'border-transparent text-tinta-suave hover:text-tinta'}`}>{children}</Link>
}

function CuentaPanel({ nombre, correo, carrera, semestre, rol, miembroDesde, subidos }: { nombre: string; correo: string; carrera: string; semestre: string; rol: string; miembroDesde: string; subidos: number }) {
  return <div className="space-y-3">
    <InfoCard title="Datos personales" rows={[['Nombre', nombre], ['Correo institucional', correo], ['Carrera', carrera], ['Semestre', semestre]} />
    <InfoCard title="Cuenta" rows={[['Rol', rol], ['Miembro desde', miembroDesde], ['Parciales subidos', String(subidos)]]} />
    <div className="flex flex-col gap-2 pt-1 sm:flex-row">
      <Link href="/perfil/editar" className="flex-1"><Button variant="secondary" className="w-full">Editar perfil</Button></Link>
      <form action={logout} className="flex-1"><Button type="submit" variant="danger" className="w-full">Cerrar sesión</Button></form>
    </div>
  </div>
}

function InfoCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return <Card className="overflow-hidden"><div className="border-b border-linea px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-tinta-suave">{title}</div>{rows.map(([label, value]) => <div key={label} className="flex min-h-11 items-center justify-between gap-4 border-b border-linea px-3 py-2 text-xs last:border-b-0"><span className="text-tinta-suave">{label}</span><span className="max-w-[65%] truncate text-right font-medium text-tinta">{value}</span></div>)}</Card>
}

function Empty({ text, action }: { text: string; action?: string }) {
  return <Card className="p-8 text-center"><p className="text-sm text-tinta-suave">{text}</p>{action && <Link href="/subir" className="mt-4 inline-block"><Button variant="accent" size="sm">{action}</Button></Link>}</Card>
}
