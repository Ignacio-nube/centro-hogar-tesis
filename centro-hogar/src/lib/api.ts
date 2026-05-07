/**
 * Cliente HTTP centralizado para la API REST de Centro Hogar.
 * Almacena el JWT en localStorage y lo adjunta automáticamente en cada request.
 */

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001/api'

const TOKEN_KEY = 'ch_token'

// ─── Helpers de token ────────────────────────────────────────────────────────

export const tokenStorage = {
  get:    ()           => localStorage.getItem(TOKEN_KEY),
  set:    (t: string)  => localStorage.setItem(TOKEN_KEY, t),
  remove: ()           => localStorage.removeItem(TOKEN_KEY),
}

// ─── Fetcher base ─────────────────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean
  data?:   T
  message?: string
}

function handleUnauthorized(): void {
  // Token inválido o expirado: limpiar y forzar relogin.
  tokenStorage.remove()
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.assign('/login')
  }
}

async function request<T>(
  path:    string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStorage.get()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  // 204 No Content
  if (res.status === 204) return undefined as T

  // Login propio devuelve 401 con mensaje — no redirigir desde el endpoint de login.
  const isLoginAttempt = path.endsWith('/auth/login')

  let body: ApiResponse<T>
  try {
    body = await res.json()
  } catch {
    body = { success: res.ok }
  }

  if (res.status === 401 && !isLoginAttempt) {
    handleUnauthorized()
    throw new Error(body.message ?? 'Sesión expirada')
  }

  if (!res.ok) {
    throw new Error(body.message ?? `HTTP ${res.status}`)
  }

  return body.data as T
}

function parseFileNameFromDisposition(headerValue: string | null): string | null {
  if (!headerValue) return null

  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      return utf8Match[1]
    }
  }

  const simpleMatch = headerValue.match(/filename="?([^";]+)"?/i)
  return simpleMatch?.[1] ?? null
}

// ─── Métodos exportados ───────────────────────────────────────────────────────

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path)
  },

  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'POST', body: JSON.stringify(body) })
  },

  put<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'PUT', body: JSON.stringify(body) })
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined })
  },

  delete<T = void>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' })
  },

  async download(path: string): Promise<{ blob: Blob; filename: string | null }> {
    const token = tokenStorage.get()

    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${BASE_URL}${path}`, { method: 'GET', headers })

    if (res.status === 401) {
      handleUnauthorized()
      throw new Error('Sesión expirada')
    }

    if (!res.ok) {
      let message = `HTTP ${res.status}`
      try {
        const body = (await res.json()) as ApiResponse<unknown>
        if (body.message) message = body.message
      } catch {
        // noop
      }
      throw new Error(message)
    }

    const blob = await res.blob()
    const filename = parseFileNameFromDisposition(res.headers.get('content-disposition'))

    return { blob, filename }
  },
}
