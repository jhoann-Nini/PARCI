import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const carreraId = searchParams.get('carrera_id')

  const supabase = await createClient()

  let query = supabase.from('materias').select('id, nombre, carrera_id').order('nombre')

  if (carreraId) query = query.eq('carrera_id', carreraId)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
