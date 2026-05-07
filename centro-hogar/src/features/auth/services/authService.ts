import { api, tokenStorage } from '@/lib/api'
import type { Profile, AuthLoginResult, Rol } from '@/types/app.types'

interface RawProfile {
  id: number | string
  nombre: string
  apellido: string
  email?: string
  rol: Rol
  activo: boolean | number
  created_at?: string
  updated_at?: string
}

function normalizeProfile(p: RawProfile): Profile {
  return {
    id: String(p.id),
    nombre: p.nombre,
    apellido: p.apellido,
    email: p.email,
    rol: p.rol,
    activo: Boolean(p.activo),
    created_at: p.created_at ?? '',
    updated_at: p.updated_at ?? '',
  }
}

export const authService = {
  async signIn(email: string, password: string): Promise<AuthLoginResult> {
    const result = await api.post<AuthLoginResult>('/auth/login', { email, password })
    tokenStorage.set(result.token)
    return result
  },

  async signOut(): Promise<void> {
    tokenStorage.remove()
  },

  async getCurrentUser(): Promise<{ id: string; email: string } | null> {
    const token = tokenStorage.get()
    if (!token) return null

    const me = normalizeProfile(await api.get<RawProfile>('/auth/me'))
    return { id: me.id, email: me.email ?? '' }
  },

  async getProfile(_userId: string): Promise<Profile | null> {
    try {
      const me = normalizeProfile(await api.get<RawProfile>('/auth/me'))
      return me
    } catch {
      tokenStorage.remove()
      return null
    }
  },

  async createUser(
    email: string,
    password: string,
    profileData: { nombre: string; apellido: string; rol: Profile['rol'] }
  ): Promise<Profile> {
    const created = await api.post<RawProfile>('/usuarios', {
      nombre: profileData.nombre,
      apellido: profileData.apellido,
      email,
      password,
      rol: profileData.rol,
    })
    return normalizeProfile(created)
  },

  async updateProfile(
    userId: string,
    updates: Partial<Pick<Profile, 'nombre' | 'apellido' | 'rol' | 'activo'>>
  ): Promise<Profile> {
    const updated = await api.put<RawProfile>(`/usuarios/${userId}`, updates)
    return normalizeProfile(updated)
  },

  async listUsers(opts?: {
    search?: string
    activo?: boolean
    page?: number
    pageSize?: number
  }): Promise<{ data: Profile[]; count: number }> {
    const params = new URLSearchParams()
    if (opts?.search)            params.set('search',   opts.search)
    if (opts?.activo !== undefined) params.set('activo', String(opts.activo))
    if (opts?.page)              params.set('page',     String(opts.page))
    if (opts?.pageSize)          params.set('pageSize', String(opts.pageSize))
    const qs = params.toString()
    const result = await api.get<{ data: RawProfile[]; count: number }>(
      `/usuarios${qs ? `?${qs}` : ''}`
    )
    return { data: result.data.map(normalizeProfile), count: result.count }
  },

  async changePassword(userId: string, newPassword: string): Promise<void> {
    await api.put(`/usuarios/${userId}/password`, { newPassword })
  },

  async changeEmail(userId: string, newEmail: string): Promise<void> {
    await api.put(`/usuarios/${userId}`, { email: newEmail })
  },
}
