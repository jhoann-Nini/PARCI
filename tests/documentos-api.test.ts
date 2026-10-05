import { describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

import { createMockSupabase } from "./mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { POST } from "@/app/api/documentos/route";


describe("POST /api/documentos", () => {


  test("rechaza solicitud sin campos requeridos", async () => {

    const formData = new FormData();

    const request = new NextRequest(
      "http://localhost:3000/api/documentos",
      {
        method:"POST",
        body:formData,
      }
    );


    const response = await POST(request);

    const data = await response.json();


    expect(response.status).toBe(400);

    expect(data.error)
      .toContain("Faltan campos requeridos");

  });



  test("rechaza subida si el usuario no está autenticado", async () => {


    vi.mocked(createClient).mockImplementation(
      async () =>
        createMockSupabase({
          user:null
        }) as unknown as Awaited<ReturnType<typeof createClient>>
    );


    const archivo = new File(
      [
        new Uint8Array([
          0x25,
          0x50,
          0x44,
          0x46
        ])
      ],
      "parcial.pdf",
      {
        type:"application/pdf"
      }
    );


    const formData = new FormData();

    formData.append("archivo", archivo);
    formData.append("oferta_id","oferta-test");
    formData.append("corte","1");


    const request = new NextRequest(
      "http://localhost:3000/api/documentos",
      {
        method:"POST",
        body:formData
      }
    );


    const response = await POST(request);

    const data = await response.json();


    expect(response.status).toBe(401);

    expect(data.error)
      .toContain("Debes iniciar sesión");

  });



  test("crea documento cuando los datos son válidos", async () => {


    vi.mocked(createClient).mockImplementation(
      async () =>
        createMockSupabase({
          user:{
            id:"usuario-test"
          }
        }) as unknown as Awaited<ReturnType<typeof createClient>>
    );


    const archivo = new File(
      [
        new Uint8Array([
          0x25,
          0x50,
          0x44,
          0x46
        ])
      ],
      "parcial.pdf",
      {
        type:"application/pdf"
      }
    );


    const formData = new FormData();

    formData.append("archivo",archivo);
    formData.append("oferta_id","oferta-test");
    formData.append("corte","2");


    const request = new NextRequest(
      "http://localhost:3000/api/documentos/route",
      {
        method:"POST",
        body:formData
      }
    );


    const response = await POST(request);

    const data = await response.json();


    expect(response.status).toBe(201);

    expect(data)
      .toHaveProperty("id");

  });


});