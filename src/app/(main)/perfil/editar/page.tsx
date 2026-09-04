import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { actualizarPerfil } from '@/lib/actions/perfil'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default async function EditarPerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: perfil }, { data: carreras }] = await Promise.all([
    supabase.from('perfiles').select('nombre, correo_institucional, carrera_id').eq('id', user.id).single(),
    supabase.from('carreras').select('id, nombre').order('nombre'),
  ])

  return (
    <div className="mx-auto w-full max-w-xl">
      <Card className="p-5 sm:p-7">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="font-mono text-xl font-bold">Editar perfil</h1>
          <p className="text-sm text-tinta-suave">Mantén actualizada tu información académica.</p>
        </div>
        <form action={actualizarPerfil} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nombre" className="font-mono text-sm font-medium">Nombre</label>
            <Input id="nombre" name="nombre" defaultValue={perfil?.nombre ?? user.user_metadata?.nombre ?? ''} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-sm font-medium">Correo institucional</label>
            <Input value={perfil?.correo_institucional ?? user.email ?? ''} disabled readOnly />
            <p className="text-xs text-tinta-suave">El correo institucional no se puede cambiar.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="carrera_id" className="font-mono text-sm font-medium">Carrera</label>
            <select id="carrera_id" name="carrera_id" defaultValue={perfil?.carrera_id ?? ''} className="h-10 rounded-md border border-linea bg-papel px-3 text-sm text-tinta focus:outline-2 focus:outline-lapiz-rojo">
              <option value="">Selecciona tu carrera</option>
              {carreras?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link href="/perfil"><Button type="button" variant="ghost" className="w-full sm:w-auto">Cancelar</Button></Link>
            <Button type="submit" variant="accent" className="w-full sm:w-auto">Guardar cambios</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
