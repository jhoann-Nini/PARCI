import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

import { ApiError } from '@/lib/errors/ApiError'
import { handleApiError } from '@/lib/errors/handleApiError'
import { ERROR_CODES } from '@/lib/errors/errorCodes'

// POST /api/votos — marcar "me sirvió" en un documento
export async function POST(request: NextRequest) {

  try {

    const supabase = await createClient()

    const body = await request.json()

    const { documento_id, anon_id } = body


    if (!documento_id) {

      throw new ApiError(
        ERROR_CODES.MISSING_FIELDS,
        "Falta documento_id",
        400
      )

    }


    const { data, error } = await supabase

      .rpc(
        'votar_documento',
        {
          p_documento_id: documento_id,
          p_anon_id: anon_id ?? null
        }
      )
      .single()


    if (error) {

      throw new ApiError(
        ERROR_CODES.DATABASE_ERROR,
        error.message,
        500
      )

    }


    return NextResponse.json(data)


  } catch(error) {

    return handleApiError(error)

  }

}
