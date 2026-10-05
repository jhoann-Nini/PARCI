export class ApiError extends Error {

  statusCode: number;
  code: string;


  constructor(
    code: string,
    message: string,
    statusCode: number
  ) {

    super(message);

    this.name = "ApiError";

    this.code = code;

    this.statusCode = statusCode;

  }

}
