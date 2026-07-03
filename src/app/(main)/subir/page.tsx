import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SubirForm } from './SubirForm'

export default async function SubirPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Solo usuarios con sesión pueden subir desde esta página
  // (la subida anónima también está soportada vía API pero no se expone en UI por ahora)
  if (!user) redirect('/login?next=/subir')

  const [{ data: carreras }, { data: profesores }] = await Promise.all([
    supabase.from('carreras').select('id, nombre, color').order('nombre'),
    supabase.from('profesores').select('id, nombre').order('nombre'),
  ])

  return (
    <div className="mx-auto max-w-xl flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-mono text-2xl font-bold text-tinta">Subir parcial</h1>
        <p className="text-sm text-tinta-suave">
          Ayuda a los próximos estudiantes compartiendo un examen anterior.
        </p>
      </div>

      <SubirForm
        carreras={carreras ?? []}
        profesoresIniciales={profesores ?? []}
      />
    </div>
  )
}
