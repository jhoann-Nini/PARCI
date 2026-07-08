const ANON_ID_KEY = 'parci_anon_id'
const ANON_ID_MAX_AGE = 60 * 60 * 24 * 365 * 2 // 2 años

/**
 * Identificador anónimo del visitante, generado la primera vez que
 * vota o comenta sin sesión. Se persiste en cookie + localStorage
 * (cookie para que el server component también pueda leerlo en el
 * primer render; localStorage como respaldo si borran cookies).
 */
export function getAnonId(): string {
  const existing = readCookie(ANON_ID_KEY) ?? localStorage.getItem(ANON_ID_KEY)
  if (existing) {
    persistAnonId(existing)
    return existing
  }

  const id = crypto.randomUUID()
  persistAnonId(id)
  return id
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function persistAnonId(id: string) {
  localStorage.setItem(ANON_ID_KEY, id)
  document.cookie = `${ANON_ID_KEY}=${id}; max-age=${ANON_ID_MAX_AGE}; path=/; samesite=lax`
}
