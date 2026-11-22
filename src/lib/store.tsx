import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { initialNotifications, initialRequests, requestTypeById } from '../data/seed'
import { formatDateTime, plural, uid } from './utils'
import { toast } from './toast'
import { useAuth } from './auth'
import type {
  AppNotification,
  NotificationKind,
  RequestStatus,
  StudentRequest,
} from './types'

const REQUESTS_KEY = 'dekanat.v1.requests'
const NOTIFS_KEY = 'dekanat.v2.notifications'

const STEP_MS = 20_000
const NEXT_STATUS: Partial<Record<RequestStatus, RequestStatus>> = {
  new: 'in_progress',
  in_progress: 'signed',
  signed: 'ready',
}

const STATUS_COMMENT: Record<RequestStatus, string> = {
  new: 'Заявка создана',
  in_progress: 'Принята в работу специалистом деканата',
  signed: 'Подписана у директора института',
  ready: 'Готова к выдаче, кабинет 231',
  rejected: 'Заявка отклонена',
}

const STATUS_TITLE: Record<RequestStatus, string> = {
  new: 'Заявка создана',
  in_progress: 'Заявка в работе',
  signed: 'Заявка подписана',
  ready: 'Заявка готова',
  rejected: 'Заявка отклонена',
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export interface CreateRequestInput {
  typeId: string
  fields: Record<string, string>
}

interface DataValue {
  requests: StudentRequest[]
  notifications: AppNotification[]
  myRequests: StudentRequest[]
  myNotifications: AppNotification[]
  unreadCount: number
  createRequest: (input: CreateRequestInput) => StudentRequest | null
  cancelRequest: (id: string) => void
  setStatus: (id: string, status: RequestStatus, comment?: string) => void
  markRead: (id: string) => void
  markAllRead: () => void
  resetDemo: () => void
  getRequest: (id: string) => StudentRequest | undefined
}

const DataContext = createContext<DataValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { account, student } = useAuth()
  const [requests, setRequests] = useState<StudentRequest[]>(() =>
    load(REQUESTS_KEY, initialRequests),
  )
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    load(NOTIFS_KEY, initialNotifications),
  )
  const requestsRef = useRef(requests)
  const startedAt = useRef(Date.now())
  const [resetKey, setResetKey] = useState(0)

  useEffect(() => {
    requestsRef.current = requests
  }, [requests])

  useEffect(() => {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests))
  }, [requests])

  useEffect(() => {
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(notifications))
  }, [notifications])

  const addNotification = useCallback(
    (n: Omit<AppNotification, 'id' | 'at' | 'read'>) => {
      setNotifications((prev) => [
        { ...n, id: uid('n'), at: new Date().toISOString(), read: false },
        ...prev,
      ])
    },
    [],
  )

  // Деко: заявка сама проходит статусы, чтобы жюри увидело процесс за минуту.
  // Побочные эффекты (уведомления, тосты) выполняются СНАРУЖИ setState-updater:
  // в StrictMode React вызывает updater дважды, и раньше это давало дубли.
  useEffect(() => {
    const timer = setInterval(() => {
      const prev = requestsRef.current
      const changes: { req: StudentRequest; status: RequestStatus }[] = []
      const next = prev.map((req) => {
        if (!req.autoProgress) return req
        const nextStatus = NEXT_STATUS[req.status]
        if (!nextStatus) return req
        const last = req.events[req.events.length - 1]
        if (!last) return req
        if (Date.now() - new Date(last.at).getTime() < STEP_MS) return req
        const updated: StudentRequest = {
          ...req,
          status: nextStatus,
          autoProgress: nextStatus !== 'ready',
          events: [
            ...req.events,
            {
              id: uid('ev'),
              status: nextStatus,
              at: new Date().toISOString(),
              comment: STATUS_COMMENT[nextStatus],
            },
          ],
        }
        changes.push({ req: updated, status: nextStatus })
        return updated
      })

      if (!changes.length) return
      requestsRef.current = next
      setRequests(next)

      for (const { req, status } of changes) {
        if (req.studentId !== student?.id) continue
        addNotification({
          studentId: req.studentId,
          kind: 'request',
          title: STATUS_TITLE[status],
          body: `${req.number}: ${STATUS_COMMENT[status]}`,
          href: `#/requests/${req.id}`,
        })
        toast({
          title: STATUS_TITLE[status],
          body: `${req.number} · ${STATUS_COMMENT[status]}`,
          tone: status === 'ready' ? 'success' : 'default',
        })
      }
    }, 1500)
    return () => clearInterval(timer)
  }, [student?.id, addNotification])

  // Напоминания о дедлайнах: сегодня, завтра и за 2–3 дня
  const toastedDeadlines = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!student) return
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const upcoming = student.deadlines
      .map((deadline) => {
        const at = new Date(deadline.at)
        const day = new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime()
        return { deadline, days: Math.round((day - today) / 86400000) }
      })
      .filter(({ days }) => days >= 0 && days <= 3)

    const fresh = upcoming.filter(
      ({ deadline }) => !notifications.some((n) => n.id === `dl-${student.id}-${deadline.id}`),
    )
    if (!fresh.length) return

    const created = fresh.map(({ deadline, days }) => {
      const id = `dl-${student.id}-${deadline.id}`
      const prefix =
        days === 0
          ? 'Сегодня дедлайн'
          : days === 1
            ? 'Завтра дедлайн'
            : `Дедлайн через ${days} ${plural(days, 'день', 'дня', 'дней')}`
      return {
        id,
        title: `${prefix}: ${deadline.title}`,
        body: `${deadline.subject} · до ${formatDateTime(deadline.at)}`,
      }
    })

    setNotifications((prev) => {
      const ids = new Set(prev.map((n) => n.id))
      const next = [...prev]
      for (const item of created) {
        if (ids.has(item.id)) continue
        next.push({
          id: item.id,
          studentId: student.id,
          kind: 'deadline',
          title: item.title,
          body: item.body,
          at: new Date().toISOString(),
          read: false,
          href: '#/grades',
        })
      }
      return next.length === prev.length ? prev : next
    })

    for (const item of created) {
      if (toastedDeadlines.current.has(item.id)) continue
      toastedDeadlines.current.add(item.id)
      toast({ title: item.title, body: item.body, tone: 'danger' })
    }
  }, [student, notifications, resetKey])

  const createRequest = useCallback(
    (input: CreateRequestInput): StudentRequest | null => {
      if (!student) return null
      const type = requestTypeById(input.typeId)
      if (!type) return null
      const nowIso = new Date().toISOString()
      const req: StudentRequest = {
        id: uid('req'),
        number: `Д-2026-${1000 + Math.floor(Math.random() * 8999)}`,
        typeId: input.typeId,
        studentId: student.id,
        createdAt: nowIso,
        etaDays: type.etaDays,
        fields: input.fields,
        status: 'new',
        autoProgress: true,
        events: [
          { id: uid('ev'), status: 'new', at: nowIso, comment: STATUS_COMMENT.new },
        ],
      }
      setRequests((prev) => [req, ...prev])
      addNotification({
        studentId: student.id,
        kind: 'request',
        title: 'Заявка создана',
        body: `${req.number}: ${type.title}. Статус можно отслеживать в разделе «Заявки».`,
        href: `#/requests/${req.id}`,
      })
      toast({ title: 'Заявка создана', body: `${req.number} · ${type.title}`, tone: 'success' })
      return req
    },
    [student, addNotification],
  )

  const cancelRequest = useCallback(
    (id: string) => {
      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r
          if (r.status !== 'new' && r.status !== 'in_progress') return r
          return {
            ...r,
            status: 'rejected',
            autoProgress: false,
            staffComment: 'Отменена студентом',
            events: [
              ...r.events,
              {
                id: uid('ev'),
                status: 'rejected',
                at: new Date().toISOString(),
                comment: 'Отменена студентом',
              },
            ],
          }
        }),
      )
      toast({ title: 'Заявка отменена' })
    },
    [],
  )

  const setStatus = useCallback(
    (id: string, status: RequestStatus, comment?: string) => {
      const target = requestsRef.current.find((r) => r.id === id)
      const text = comment || STATUS_COMMENT[status]

      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r
          return {
            ...r,
            status,
            autoProgress: false,
            staffComment: comment || r.staffComment,
            events: [
              ...r.events,
              {
                id: uid('ev'),
                status,
                at: new Date().toISOString(),
                comment: text,
              },
            ],
          }
        }),
      )

      if (target) {
        addNotification({
          studentId: target.studentId,
          kind: 'request',
          title: STATUS_TITLE[status],
          body: `${target.number}: ${text}`,
          href: `#/requests/${target.id}`,
        })
      }
      toast({ title: 'Статус обновлён', tone: 'success' })
    },
    [addNotification],
  )

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const resetDemo = useCallback(() => {
    localStorage.removeItem(REQUESTS_KEY)
    localStorage.removeItem(NOTIFS_KEY)
    setRequests(initialRequests)
    setNotifications(initialNotifications)
    toastedDeadlines.current.clear()
    setResetKey((k) => k + 1)
    startedAt.current = Date.now()
    toast({ title: 'Демо-данные сброшены', tone: 'success' })
  }, [])

  const getRequest = useCallback(
    (id: string) => requests.find((r) => r.id === id),
    [requests],
  )

  const myRequests = useMemo(
    () =>
      student
        ? requests
            .filter((r) => r.studentId === student.id)
            .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        : [],
    [requests, student],
  )

  const myNotifications = useMemo(() => {
    if (!account) return []
    return notifications
      .filter((n) => n.studentId === account.id || n.studentId === 'all')
      .sort((a, b) => +new Date(b.at) - +new Date(a.at))
  }, [notifications, account])

  const unreadCount = useMemo(
    () => myNotifications.filter((n) => !n.read).length,
    [myNotifications],
  )

  const value = useMemo<DataValue>(
    () => ({
      requests,
      notifications,
      myRequests,
      myNotifications,
      unreadCount,
      createRequest,
      cancelRequest,
      setStatus,
      markRead,
      markAllRead,
      resetDemo,
      getRequest,
    }),
    [
      requests,
      notifications,
      myRequests,
      myNotifications,
      unreadCount,
      createRequest,
      cancelRequest,
      setStatus,
      markRead,
      markAllRead,
      resetDemo,
      getRequest,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}

export const REQUEST_STATUS_META: Record<
  RequestStatus,
  { label: string; tone: 'default' | 'info' | 'ok' | 'warn' | 'danger'; icon: string }
> = {
  new: { label: 'Создана', tone: 'info', icon: 'inbox' },
  in_progress: { label: 'В работе', tone: 'warn', icon: 'clock' },
  signed: { label: 'Подписана', tone: 'info', icon: 'pen' },
  ready: { label: 'Готова', tone: 'ok', icon: 'check' },
  rejected: { label: 'Отклонена', tone: 'danger', icon: 'x' },
}

export function notifyKindLabel(kind: NotificationKind): string {
  switch (kind) {
    case 'news':
      return 'Объявление'
    case 'schedule':
      return 'Расписание'
    case 'request':
      return 'Заявка'
    case 'deadline':
      return 'Дедлайн'
  }
}
