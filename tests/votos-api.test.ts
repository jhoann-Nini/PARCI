import { describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

import { createMockSupabase } from "./mocks/supabase";

import { createClient } from "@/lib/supabase/server";
import { POST } from "@/app/api/votos/route";



vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));


describe("POST /api/votos", () => {


  test("rechaza voto sin documento_id", async () => {

    const rpcMock = vi.fn()
      .mockReturnValue({
        single: vi.fn()
          .mockResolvedValue({
            data:{
              votos_count:1,
              ya_voto:false
            },
            error:null
          })
      });

    vi.mocked(createClient).mockResolvedValue(
      createMockSupabase({
        rpc: rpcMock
      }) as never
    )


    const request = new NextRequest(
      "http://localhost:3000/api/votos",
      {
        method:"POST",
        body: JSON.stringify({})
      }
    );


    const response = await POST(request);

    const data = await response.json();


    expect(response.status).toBe(400);

    expect(data.error)
      .toContain("Falta documento_id");

  });



  test("registra voto correctamente", async () => {


    const rpcMock = vi.fn()
      .mockReturnValue({
        single: vi.fn()
          .mockResolvedValue({
            data:{
              votos_count:1,
              ya_voto:false
            },
            error:null
          })
      });


    vi.mocked(createClient).mockResolvedValue(
      createMockSupabase({
        rpc: rpcMock
      }) as never
    )



    const request = new NextRequest(
      "http://localhost:3000/api/votos",
      {
        method:"POST",
        body:JSON.stringify({
          documento_id:"11111111-1111-1111-1111-111111111111",
          anon_id:"22222222-2222-2222-2222-222222222222"
        })
      }
    );


    const response = await POST(request);

    const data = await response.json();


    expect(response.status).toBe(200);

    expect(data.votos_count)
      .toBe(1);

    expect(data.ya_voto)
      .toBe(false);

  });



  test("devuelve error cuando falla RPC", async () => {


    const rpcMock = vi.fn()
      .mockReturnValue({
        single: vi.fn()
          .mockResolvedValue({
            data:null,
            error:{
              message:"error de base de datos"
            }
          })
      });


    vi.mocked(createClient).mockResolvedValue(
      createMockSupabase({
        rpc: rpcMock
      }) as never
    );



    const request = new NextRequest(
      "http://localhost:3000/api/votos",
      {
        method:"POST",
        body:JSON.stringify({
          documento_id:"11111111-1111-1111-1111-111111111111"
        })
      }
    );


    const response = await POST(request);


    expect(response.status)
      .toBe(500);

  });


});
