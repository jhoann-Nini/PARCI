import { vi } from "vitest"


export type MockSupabase = {
  auth: {
    getUser: () => Promise<{
      data: {
        user: {
          id: string
        } | null
      }
    }>
  }

  rpc: ReturnType<typeof vi.fn>

  storage: {
    from: () => {
      upload: () => Promise<{ error: null }>
      remove: () => Promise<{ error: null }>
    }
  }

  from: () => {
    insert: () => {
      select: () => {
        single: () => Promise<{
          data: {
            id: string
            tipo: string
            corte: string
          }
          error: null
        }>
      }
    }
  }
}


type Options = {
  user?: {
    id: string
  } | null

  rpc?: ReturnType<typeof vi.fn>
}


export function createMockSupabase({
  user = null,
  rpc = vi.fn(),
}: Options): MockSupabase {

  return {

    auth: {
      getUser: async () => ({
        data: {
          user
        }
      })
    },


    rpc,


    storage: {
      from: () => ({
        upload: async () => ({
          error: null
        }),

        remove: async () => ({
          error: null
        })
      })
    },


    from: () => ({
      insert: () => ({
        select: () => ({
          single: async () => ({
            data: {
              id: "123",
              tipo: "parcial",
              corte: "1"
            },
            error: null
          })
        })
      })
    })

  }

}