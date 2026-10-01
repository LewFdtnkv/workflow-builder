import { type FormEvent, type ReactNode, useState } from 'react'
import { authApi } from '../api/authApi'
export function AuthGate({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'))
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  if (token) return <>{children}</>
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const session = await authApi[mode](email, password)
      localStorage.setItem('accessToken', session.accessToken)
      setToken(session.accessToken)
    } catch {
      setError('Не удалось выполнить вход. Проверьте данные или запустите API.')
    }
  }
  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Flowcraft</h1>
        <p>{mode === 'login' ? 'Войдите, чтобы продолжить работу' : 'Создайте рабочее пространство'}</p>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Пароль
          <input
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <div className="auth-error">{error}</div>}
        <button className="button run" type="submit">
          {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
        </button>
        <button
          type="button"
          className="auth-switch"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Нет аккаунта? Регистрация' : 'Уже есть аккаунт? Войти'}
        </button>
      </form>
    </main>
  )
}
