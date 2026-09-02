import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('carreras')
    .select('id, nombre, color')
    .order('nombre')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
//GET es para obtener todas las carreras de la base de datos, ordenadas por nombre. Se utiliza la función createClient para crear una instancia del cliente de Supabase y luego se realiza una consulta a la tabla 'carreras' para seleccionar los campos 'id', 'nombre' y 'color'. Si ocurre un error durante la consulta, se devuelve una respuesta JSON con el mensaje de error y un estado 500. Si la consulta es exitosa, se devuelve una respuesta JSON con los datos obtenidos.