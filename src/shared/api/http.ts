const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''

export const isRemoteApiConfigured = true

async function refreshAccessToken() {
  const response = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) return false
  const session = (await response.json()) as { accessToken: string }
  localStorage.setItem('accessToken', session.accessToken)
  return true
}

export async function http<T>(path: string, init?: RequestInit, canRefresh = true): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(localStorage.getItem('accessToken')
        ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
        : {}),
      ...init?.headers,
    },
  })
  if (!response.ok) {
    if (
      response.status === 401 &&
      canRefresh &&
      path !== '/api/auth/refresh' &&
      (await refreshAccessToken())
    ) {
      return http<T>(path, init, false)
    }
    if (response.status === 401) {
      localStorage.removeItem('accessToken')
      window.location.reload()
    }
    const detail = await response.text().catch(() => '')
    throw new Error(detail || `Request failed with ${response.status}`)
  }
  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>)
}
