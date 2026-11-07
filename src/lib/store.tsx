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
import { uid } from './utils'
import { toast } from './toast'
import { useAuth } from './auth'
import type {
  AppNotification,
  NotificationKind,
  RequestStatus,
  StudentRequest,
} from './types'

const REQUESTS_KEY = 'dekanat.v1.requests'
const NOTIFS_KEY = 'dekanat.v1.notifications'

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
  const startedAt = useRef(Date.now())

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

  // Деко: заявка сама проходит статусы, чтобы жюри увидело процесс за минуту
  useEffect(() => {
    const timer = setInterval(() => {
      setRequests((prev) => {
        let changed = false
        const next = prev.map((req) => {
          if (!req.autoProgress) return req
          const nextStatus = NEXT_STATUS[req.status]
          if (!nextStatus) return req
          const last = req.events[req.events.length - 1]
          if (!last) return req
          if (Date.now() - new Date(last.at).getTime() < STEP_MS) return req
          changed = true
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
          if (req.studentId === student?.id) {
            addNotification({
              studentId: req.studentId,
              kind: 'request',
              title: STATUS_TITLE[nextStatus],
              body: `${req.number}: ${STATUS_COMMENT[nextStatus]}`,
              href: `#/requests/${req.id}`,
            })
            toast({
              title: STATUS_TITLE[nextStatus],
              body: `${req.number} · ${STATUS_COMMENT[nextStatus]}`,
              tone: nextStatus === 'ready' ? 'success' : 'default',
            })
          }
          return updated
        })
        return changed ? next : prev
      })
    }, 1500)
    return () => clearInterval(timer)
  }, [student?.id, addNotification])

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
      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r
          const updated: StudentRequest = {
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
                comment: comment || STATUS_COMMENT[status],
              },
            ],
          }
          addNotification({
            studentId: r.studentId,
            kind: 'request',
            title: STATUS_TITLE[status],
            body: `${r.number}: ${comment || STATUS_COMMENT[status]}`,
            href: `#/requests/${r.id}`,
          })
          return updated
        }),
      )
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
