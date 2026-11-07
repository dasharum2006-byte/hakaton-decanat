import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { Logo } from '../components/AppShell'
import { DEMO_PASSWORD, STAFF_PASSWORD, students } from '../data/seed'

export function Login() {
  const { account, login } = useAuth()
  const navigate = useNavigate()
  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (account) return <Navigate to={account.role === 'staff' ? '/staff' : '/'} replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await login(loginValue, password)
    setLoading(false)
    if (!res.ok) {
      setError(res.error ?? 'Не удалось войти')
      return
    }
    navigate(res.role === 'staff' ? '/staff' : '/home')
  }

  const quick = (loginName: string, pass: string) => {
    setLoginValue(loginName)
    setPassword(pass)
    setError(null)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="btn-ghost -ml-2">
          <ArrowLeft size={16} />
          На главную
        </Link>
        <Logo />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-14">
        <div className="card p-6 sm:p-7">
          <h1 className="text-2xl font-bold tracking-tight">Вход в кабинет</h1>
          <p className="mt-1 text-sm text-muted">
            Демо-аккаунт: логин <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">anna</code> и пароль{' '}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">{DEMO_PASSWORD}</code>
          </p>

          <form className="mt-5 space-y-4" onSubmit={submit}>
            <div>
              <label className="label" htmlFor="login">
                Логин
              </label>
              <input
                id="login"
                className="input"
                autoComplete="username"
                placeholder="anna"
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Пароль
              </label>
              <div className="relative">
                <input
                  id="password"
                  className="input pr-11"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-2 text-muted hover:text-fg"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-danger/30 bg-danger-bg px-3 py-2 text-xs font-medium text-danger" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? <Loader2 size={17} className="animate-spin" /> : <KeyRound size={17} />}
              {loading ? 'Проверяем…' : 'Войти'}
            </button>
          </form>

          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Быстрый вход в демо
            </p>
            <div className="flex flex-wrap gap-2">
              {students.map((s) => (
                <button
                  key={s.id}
                  className="chip"
                  onClick={() => quick(s.login, DEMO_PASSWORD)}
                  type="button"
                >
                  {s.shortName} · {s.group}
                </button>
              ))}
              <button
                className="chip"
                onClick={() => quick('dekanat', STAFF_PASSWORD)}
                type="button"
              >
                Сотрудник деканата
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 flex items-start gap-2 rounded-2xl border border-border bg-surface px-3.5 py-3 text-[11px] leading-relaxed text-muted">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-ok" />
          Пароли демо-аккаунтов хранятся только как хэши. Это концепт для конкурса, а
          не официальный сервис вуза — не вводите реальные данные.
        </p>
      </main>
    </div>
  )
}
