import { http } from '../../../shared/api/http'
export interface AuthSession {
  accessToken: string
  email: string
}
export const authApi = {
  login: (email: string, password: string) =>
    http<AuthSession>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string) =>
    http<AuthSession>('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => http<void>('/api/auth/logout', { method: 'POST' }),
}
