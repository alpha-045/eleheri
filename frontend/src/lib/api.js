export const TOKEN_KEY = 'gs_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY)
    return
  }
  localStorage.setItem(TOKEN_KEY, token)
}

export async function apiFetch(path, options = {}) {
  const token = getToken()
  const headers = new Headers(options.headers || {})

  if (!headers.has('Accept')) headers.set('Accept', 'application/json')

  if (token && token !== 'fake-token') headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(path.startsWith('/') ? path : `/${path}`, {
    ...options,
    headers,
  })

  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await res.json().catch(() => null) : await res.text()

  if (!res.ok) {
    let message =
      (payload && typeof payload === 'object' && payload.message) ||
      `HTTP ${res.status}`

    if (typeof message === 'string' && (message.includes('SQLSTATE[23000]') || message.includes('Integrity constraint violation'))) {
      message = "Impossible d'effectuer cette opération : cet élément est lié à d'autres enregistrements."
    }

    const err = new Error(message)
    err.status = res.status
    err.payload = payload
    throw err
  }

  return payload
}

