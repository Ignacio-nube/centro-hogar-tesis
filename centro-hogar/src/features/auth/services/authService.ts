import { api, tokenStorage } from '@/lib/api'
import type { Profile, AuthLoginResult } from '@/types/app.types'

function normalizeProfile(p: any): Profile {
  return {
    ...p,
    id: String(p.id),
    rol: p.rol,
    activo: Boolean(p.activo),
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

    const me = normalizeProfile(await api.get<any>('/auth/me'))
    return { id: me.id, email: me.email ?? '' }
  },

  async getProfile(_userId: string): Promise<Profile | null> {
    try {
      const me = normalizeProfile(await api.get<any>('/auth/me'))
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
    const created = await api.post<any>('/usuarios', {
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
    const updated = await api.put<any>(`/usuarios/${userId}`, updates)
    return normalizeProfile(updated)
  },

  async listUsers(): Promise<Profile[]> {
    const users = await api.get<any[]>('/usuarios')
    return users.map(normalizeProfile)
  },

  async changePassword(userId: string, newPassword: string): Promise<void> {
    await api.put(`/usuarios/${userId}/password`, { newPassword })
  },

  async changeEmail(userId: string, newEmail: string): Promise<void> {
    await api.put(`/usuarios/${userId}`, { email: newEmail })
  },
}
