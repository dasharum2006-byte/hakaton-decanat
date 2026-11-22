import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { accounts, students, teachers } from '../data/seed'
import { sha256 } from './utils'
import type { Account, Student, Teacher } from './types'

const SESSION_KEY = 'dekanat.session.v1'
/** Демо-хранилище изменённых паролей: id аккаунта → SHA-256 */
const PASSWORDS_KEY = 'dekanat.passwords.v1'

function readPasswordOverrides(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PASSWORDS_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    return data && typeof data === 'object' ? (data as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function effectiveHash(account: Account): string {
  return readPasswordOverrides()[account.id] ?? account.passwordHash
}

/** Ищет аккаунт по логину или по почте из профиля */
function findAccount(identifier: string): Account | undefined {
  const value = identifier.trim().toLowerCase()
  if (!value) return undefined
  return accounts.find(
    (a) => a.login.toLowerCase() === value || a.email.toLowerCase() === value,
  )
}

interface AuthValue {
  account: Account | null
  isStudent: boolean
  isTeacher: boolean
  student: Student | null
  teacher: Teacher | null
  login: (
    login: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string; role?: Account['role'] }>
  loginAs: (accountId: string) => void
  logout: () => void
  /** Смена пароля по логину или почте (демо, без письма на почту) */
  resetPassword: (
    identifier: string,
    newPassword: string,
  ) => Promise<{ ok: boolean; error?: string }>
}

const AuthContext = createContext<AuthValue | null>(null)

function readSession(): Account | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const { accountId } = JSON.parse(raw) as { accountId: string }
    return accounts.find((a) => a.id === accountId) ?? null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(() => readSession())

  const persist = useCallback((next: Account | null) => {
    setAccount(next)
    if (next) sessionStorage.setItem(SESSION_KEY, JSON.stringify({ accountId: next.id }))
    else sessionStorage.removeItem(SESSION_KEY)
  }, [])

  const login = useCallback(
    async (login: string, password: string) => {
      const found = findAccount(login)
      if (!found) return { ok: false, error: 'Аккаунт с таким логином или почтой не найден' }
      const hash = await sha256(password)
      if (hash !== effectiveHash(found)) return { ok: false, error: 'Неверный пароль' }
      persist(found)
      return { ok: true, role: found.role }
    },
    [persist],
  )

  const resetPassword = useCallback(async (identifier: string, newPassword: string) => {
    const found = findAccount(identifier)
    if (!found) return { ok: false, error: 'Аккаунт с таким логином или почтой не найден' }
    if (newPassword.length < 6) {
      return { ok: false, error: 'Пароль должен быть не короче 6 символов' }
    }
    const hash = await sha256(newPassword)
    try {
      const overrides = readPasswordOverrides()
      overrides[found.id] = hash
      localStorage.setItem(PASSWORDS_KEY, JSON.stringify(overrides))
    } catch {
      return { ok: false, error: 'Не удалось сохранить новый пароль' }
    }
    return { ok: true }
  }, [])

  const loginAs = useCallback(
    (accountId: string) => {
      const found = accounts.find((a) => a.id === accountId)
      if (found) persist(found)
    },
    [persist],
  )

  const logout = useCallback(() => persist(null), [persist])

  const value = useMemo<AuthValue>(() => {
    const student = account?.role === 'student' ? (students.find((s) => s.id === account.id) ?? null) : null
    const teacher = account?.role === 'teacher' ? (teachers.find((t) => t.id === account.id) ?? null) : null
    return {
      account,
      isStudent: account?.role === 'student',
      isTeacher: account?.role === 'teacher',
      student,
      teacher,
      login,
      loginAs,
      logout,
      resetPassword,
    }
  }, [account, login, loginAs, logout, resetPassword])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('dekanat.theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('dekanat.theme', theme)
  }, [theme])

  return {
    theme,
    toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
  }
}
