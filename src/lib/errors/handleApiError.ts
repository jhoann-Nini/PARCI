import { NextResponse } from "next/server";
import { ApiError } from "./ApiError";
import { ERROR_CODES } from "./errorCodes";


export function handleApiError(error: unknown) {


  if (error instanceof ApiError) {

    return NextResponse.json(
      {
        success:false,

        error:{
          code:error.code,
          message:error.message
        }
      },
      {
        status:error.statusCode
      }
    );

  }


  console.error(error);


  return NextResponse.json(
    {
      success:false,

      error:{
        code:ERROR_CODES.UNKNOWN_ERROR,
        message:"Error interno del servidor"
      }
    },
    {
      status:500
    }
  );

}
