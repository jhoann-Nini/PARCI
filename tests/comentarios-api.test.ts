import { describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

import { createMockSupabase } from "./mocks/supabase";


// Mock SIEMPRE arriba
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { POST } from "@/app/api/comentarios/route";


describe("POST /api/comentarios", () => {


  test("rechaza comentario sin campos requeridos", async () => { 

    const request = new NextRequest(
      "http://localhost:3000/api/comentarios",
      {
        method:"POST",
        body:JSON.stringify({})
      }
    );


    const response = await POST(request);

    const data = await response.json();


    expect(response.status).toBe(400);

    expect(data.error)
      .toContain("Faltan campos requeridos");

  });



  test("bloquea comentario prohibido", async () => {

    const rpcMock = vi.fn()
      .mockReturnValue({
        single: vi.fn()
          .mockResolvedValue({
            data:null,
            error:{
              message:"COMENTARIO_PROHIBIDO"
            }
          })
      });


    vi.mocked(createClient).mockImplementation(
      async () =>
        createMockSupabase({
          rpc: rpcMock
        }) as unknown as Awaited<ReturnType<typeof createClient>>
    );


    const request = new NextRequest(
      "http://localhost:3000/api/comentarios",
      {
        method:"POST",
        body:JSON.stringify({
          documento_id:"11111111-1111-1111-1111-111111111111",
          contenido:"mierda",
          anon_id:"22222222-2222-2222-2222-222222222222"
        })
      }
    );


    const response = await POST(request);

    const data = await response.json();


    expect(response.status)
      .toBe(422);

    expect(data.error)
      .toContain("contenido no permitido");

  });;



});
