import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { accounts, students } from '../data/seed'
import { sha256 } from './utils'
import type { Account, Student } from './types'

const SESSION_KEY = 'dekanat.session.v1'

interface AuthValue {
  account: Account | null
  isStudent: boolean
  student: Student | null
  login: (
    login: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string; role?: Account['role'] }>
  loginAs: (accountId: string) => void
  logout: () => void
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
    async (loginName: string, password: string) => {
      const found = accounts.find(
        (a) => a.login.toLowerCase() === loginName.trim().toLowerCase(),
      )
      if (!found) return { ok: false, error: 'Аккаунт с таким логином не найден' }
      const hash = await sha256(password)
      if (hash !== found.passwordHash) return { ok: false, error: 'Неверный пароль' }
      persist(found)
      return { ok: true, role: found.role }
    },
    [persist],
  )

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
    return {
      account,
      isStudent: account?.role === 'student',
      student,
      login,
      loginAs,
      logout,
    }
  }, [account, login, loginAs, logout])

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
