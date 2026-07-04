import { createClient } from '@/lib/supabase/server'
import { MapPin, Phone, BookOpen, Heart } from 'lucide-react'
import type { InfoSede } from '@/types'

const iconos: Record<string, React.ReactNode> = {
  biblioteca: <BookOpen className="h-5 w-5" />,
  bienestar:  <Heart className="h-5 w-5" />,
  admisiones: <Phone className="h-5 w-5" />,
  contacto:   <Phone className="h-5 w-5" />,
  mapa:       <MapPin className="h-5 w-5" />,
}

const titulos: Record<string, string> = {
  biblioteca: 'Biblioteca',
  bienestar:  'Bienestar Universitario',
  admisiones: 'Admisiones',
  contacto:   'Contacto',
  mapa:       'Cómo llegar',
}

export default async function SedePage() {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('info_sede')
    .select('*')
    .order('categoria')

  // Agrupar por categoría
  const grouped = (items ?? []).reduce<Record<string, InfoSede[]>>((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = []
    acc[item.categoria].push(item)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h1 className="font-mono text-2xl font-bold text-tinta">
          Sede Tuluá
        </h1>
        <p className="text-sm text-tinta-suave">
          Universidad del Valle · Carrera 27 # 48-144, Barrio Palermo
        </p>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        {Object.entries(grouped).map(([categoria, infoItems]) => (
          <div key={categoria} className="rounded-lg border bg-papel p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-lapiz-rojo">
              {iconos[categoria]}
              <h2 className="font-mono text-sm font-bold uppercase tracking-wide">
                {titulos[categoria] ?? categoria}
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              {infoItems.map((item) => (
                <div key={item.id} className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-tinta">{item.titulo}</p>
                  <p className="text-sm text-tinta-suave leading-relaxed">{item.contenido}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
