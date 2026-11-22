import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { Logo } from '../components/AppShell'
import { ConceptBanner } from '../components/ConceptNote'
import { Modal } from '../components/ui'
import { toast } from '../lib/toast'

export function Login() {
  const { account, login, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetId, setResetId] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetBusy, setResetBusy] = useState(false)
  const [showNew, setShowNew] = useState(false)

  if (account)
    return (
      <Navigate
        to={account.role === 'staff' ? '/staff' : account.role === 'teacher' ? '/teacher' : '/home'}
        replace
      />
    )

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
    navigate(res.role === 'staff' ? '/staff' : res.role === 'teacher' ? '/teacher' : '/home')
  }

  const openReset = () => {
    setResetId(loginValue)
    setNewPassword('')
    setRepeatPassword('')
    setResetError(null)
    setShowNew(false)
    setResetOpen(true)
  }

  const submitReset = async () => {
    setResetError(null)
    if (newPassword.length < 6) {
      setResetError('Пароль должен быть не короче 6 символов')
      return
    }
    if (newPassword !== repeatPassword) {
      setResetError('Пароли не совпадают')
      return
    }
    setResetBusy(true)
    const res = await resetPassword(resetId, newPassword)
    setResetBusy(false)
    if (!res.ok) {
      setResetError(res.error ?? 'Не удалось сменить пароль')
      return
    }
    setResetOpen(false)
    setLoginValue(resetId.trim())
    setPassword('')
    setError(null)
    toast({ title: 'Пароль изменён', body: 'Теперь войдите с новым паролем', tone: 'success' })
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-14">
        <div className="card p-6 sm:p-7">
          <h1 className="flex items-center justify-center text-2xl font-bold tracking-tight">Вход в кабинет</h1>

          <form className="mt-5 space-y-4" onSubmit={submit}>
            <div>
              <label className="label" htmlFor="login">
                Логин или почта
              </label>
              <input
                id="login"
                className="input"
                autoComplete="username"
                placeholder="anna или a.sokolova@student.example.edu"
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
              {loading && <Loader2 size={17} className="animate-spin" />}
              {loading ? 'Проверяем…' : 'Войти'}
            </button>

            <button
              type="button"
              className="w-full text-center text-[12px] font-semibold text-primary hover:underline"
              onClick={openReset}
            >
              Забыли пароль?
            </button>
          </form>

          <ConceptBanner />
        </div>

        <Modal
          open={resetOpen}
          onClose={() => setResetOpen(false)}
          title="Смена пароля"
          footer={
            <div className="flex gap-2">
              <button type="button" className="btn-soft flex-1" onClick={() => setResetOpen(false)}>
                Отмена
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={submitReset}
                disabled={resetBusy || !resetId.trim() || !newPassword || !repeatPassword}
              >
                {resetBusy ? 'Сохраняем…' : 'Сменить пароль'}
              </button>
            </div>
          }
        >
          <p className="text-[12px] leading-relaxed text-muted">
            Укажите логин или почту из профиля и задайте новый пароль.
          </p>

          <label className="label mt-3" htmlFor="reset-id">
            Логин или почта
          </label>
          <input
            id="reset-id"
            className="input"
            placeholder="anna или a.sokolova@student.example.edu"
            value={resetId}
            onChange={(e) => setResetId(e.target.value)}
            autoComplete="username"
          />

          <label className="label mt-3" htmlFor="reset-password">
            Новый пароль
          </label>
          <div className="relative">
            <input
              id="reset-password"
              className="input pr-11"
              type={showNew ? 'text' : 'password'}
              placeholder="Не короче 6 символов"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-2 text-muted hover:text-fg"
              onClick={() => setShowNew((v) => !v)}
              aria-label={showNew ? 'Скрыть пароль' : 'Показать пароль'}
            >
              {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          <label className="label mt-3" htmlFor="reset-repeat">
            Повторите пароль
          </label>
          <input
            id="reset-repeat"
            className="input"
            type={showNew ? 'text' : 'password'}
            placeholder="Ещё раз"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            autoComplete="new-password"
          />

          {resetError && (
            <p className="mt-3 rounded-xl border border-danger/30 bg-danger-bg px-3 py-2 text-xs font-medium text-danger" role="alert">
              {resetError}
            </p>
          )}
        </Modal>
      </main>
    </div>
  )
}
