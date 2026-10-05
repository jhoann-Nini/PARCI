import { describe, expect, test } from "vitest";

import {
  obtenerExtension,
  esTipoArchivoPermitido,
  contenidoCoincideConExtension,
} from "@/lib/validaciones";


describe("Validación de archivos", () => {

  test("obtiene correctamente la extensión de un PDF", () => {
    expect(obtenerExtension("parcial-calculo.pdf"))
      .toBe(".pdf");
  });


  test("rechaza archivos con extensión no permitida", () => {
    expect(
      esTipoArchivoPermitido(
        "virus.exe",
        "application/x-msdownload"
      )
    ).toBe(false);
  });


  test("acepta PDF con MIME correcto", () => {
    expect(
      esTipoArchivoPermitido(
        "parcial.pdf",
        "application/pdf"
      )
    ).toBe(true);
  });


  test("detecta firma real de PDF", () => {

    const pdfFake = new Uint8Array([
      0x25,
      0x50,
      0x44,
      0x46
    ]);

    expect(
      contenidoCoincideConExtension(
        pdfFake,
        ".pdf"
      )
    ).toBe(true);

  });


  test("rechaza archivo que dice ser PDF pero no tiene firma PDF", () => {

    const archivoFalso = new Uint8Array([
      0x00,
      0x11,
      0x22,
      0x33
    ]);

    expect(
      contenidoCoincideConExtension(
        archivoFalso,
        ".pdf"
      )
    ).toBe(false);

  });

});
