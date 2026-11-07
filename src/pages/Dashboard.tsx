import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Sparkles,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import { useAuth, useTheme } from '../lib/auth'
import { useData } from '../lib/store'
import {
  DAY_NAMES,
  cn,
  formatDate,
  formatGpa,
  plural,
  timeAgo,
  timeUntil,
  toMinutes,
} from '../lib/utils'
import { gpa } from '../lib/assistant'
import { Badge, ProgressBar, StatusBadge } from '../components/ui'
import { requestTypes } from '../data/seed'
import type { Lesson } from '../lib/types'

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

function Countdown({ target }: { target: Date }) {
  const now = useNow()
  const diff = Math.max(0, target.getTime() - now.getTime())
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return (
    <span className="font-mono tabular-nums">
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  )
}

function lessonDate(lesson: Lesson): Date {
  const now = new Date()
  const day = now.getDay() === 0 ? 7 : now.getDay()
  const diff = (lesson.day - day + 7) % 7
  const d = new Date(now)
  d.setDate(d.getDate() + diff)
  const [h, m] = lesson.start.split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return d
}

export function Dashboard() {
  const { student } = useAuth()
  const { myRequests } = useData()
  const now = useNow(1000)
  const { theme } = useTheme()

  const todayDay = now.getDay() === 0 ? 7 : now.getDay()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const todayLessons = useMemo(
    () =>
      (student?.schedule ?? [])
        .filter((l) => l.day === todayDay)
        .sort((a, b) => toMinutes(a.start) - toMinutes(b.start)),
    [student?.schedule, todayDay],
  )

  const nextLesson = useMemo(() => {
    const upcomingToday = todayLessons.find((l) => toMinutes(l.end) > nowMin)
    if (upcomingToday) return upcomingToday
    for (let offset = 1; offset <= 7; offset++) {
      const day = ((todayDay - 1 + offset) % 7) + 1
      const list = (student?.schedule ?? [])
        .filter((l) => l.day === day)
        .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
      if (list.length) return list[0]
    }
    return null
  }, [student?.schedule, todayLessons, nowMin, todayDay])

  const nearestDeadline = useMemo(
    () =>
      (student?.deadlines ?? [])
        .filter((d) => new Date(d.at).getTime() > Date.now())
        .sort((a, b) => +new Date(a.at) - +new Date(b.at))[0],
    [student?.deadlines],
  )

  if (!student) return null

  const creditsTotal = student.grades.reduce((s, g) => s + g.credits, 0)
  const creditsClosed = student.grades
    .filter((g) => g.status === 'closed')
    .reduce((s, g) => s + g.credits, 0)
  const progress = Math.round((creditsClosed / creditsTotal) * 100)
  const debts = student.grades.filter((g) => g.status === 'debt')
  const inProgress = student.grades.filter((g) => g.status === 'in-progress')

  const activeRequests = myRequests.filter(
    (r) => r.status === 'new' || r.status === 'in_progress' || r.status === 'signed',
  )
  const lastRequest = myRequests[0]
  const lastType = lastRequest ? requestTypes.find((t) => t.id === lastRequest.typeId) : undefined

  const quickActions = [
    { to: '/requests/new', label: 'Заказать справку', icon: <FileText size={18} />, tone: 'from-primary to-accent' },
    { to: '/schedule', label: 'Расписание', icon: <CalendarDays size={18} />, tone: 'from-sky-500 to-cyan-500' },
    { to: '/grades', label: 'Мои долги', icon: <BookOpenCheck size={18} />, tone: 'from-amber-500 to-orange-500' },
    { to: '/assistant', label: 'Помощник', icon: <Sparkles size={18} />, tone: 'from-fuchsia-500 to-pink-500' },
  ]

  return (
    <div className="animate-rise">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {DAY_NAMES[todayDay === 7 ? 0 : todayDay]}, {formatDate(now)}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Привет, {student.shortName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted">
            {student.group} · {student.course} курс · {student.faculty}
          </p>
        </div>
      </div>

      {/* Следующая пара */}
      <section className="relative mb-4 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent p-5 text-white shadow-xl shadow-primary/20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl"
        />
        {nextLesson ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
                <Clock size={12} />
                {nextLesson.day === todayDay ? 'Следующая пара сегодня' : 'Следующая пара'}
              </span>
              <span className="text-[11px] font-medium text-white/85">
                {DAY_NAMES[nextLesson.day === 7 ? 0 : nextLesson.day]}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-bold leading-tight">{nextLesson.subject}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/90">
              <span className="font-semibold">
                {nextLesson.start}–{nextLesson.end}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} /> ауд. {nextLesson.room}
              </span>
              <span>{nextLesson.teacher}</span>
            </div>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/70">До начала</p>
                <p className="text-lg font-bold">
                  <Countdown target={lessonDate(nextLesson)} />
                </p>
              </div>
              <Link
                to="/schedule"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold backdrop-blur transition-colors hover:bg-white/30"
              >
                Всё расписание <ArrowRight size={14} />
              </Link>
            </div>
            {nextLesson.change && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-black/15 px-3 py-2 text-[11px] leading-snug">
                <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                {nextLesson.change.note}
              </div>
            )}
          </>
        ) : (
          <div className="py-4">
            <h2 className="text-xl font-bold">Пар нет 🎉</h2>
            <p className="mt-1 text-sm text-white/85">Свободный день — можно заняться собой.</p>
          </div>
        )}
      </section>

      {/* Быстрые действия */}
      <section className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {quickActions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="card group flex items-center gap-2.5 p-3 transition-transform hover:-translate-y-0.5"
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white',
                a.tone,
              )}
            >
              {a.icon}
            </span>
            <span className="text-[12px] font-semibold leading-tight">{a.label}</span>
          </Link>
        ))}
      </section>

      {/* Сейчас важно */}
      <section className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">Учёба</h2>
            <Link to="/grades" className="text-[11px] font-semibold text-primary hover:underline">
              Подробнее
            </Link>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-extrabold">{formatGpa(gpa(student.grades))}</p>
              <p className="text-[11px] text-muted">средний балл</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">
                {creditsClosed} / {creditsTotal} з.е.
              </p>
              <p className="text-[11px] text-muted">закрыто</p>
            </div>
          </div>
          <ProgressBar value={progress} tone={debts.length ? 'warn' : 'ok'} className="mt-3" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {debts.length ? (
              <Badge tone="danger">
                <TriangleAlert size={11} />
                {debts.length} {plural(debts.length, 'долг', 'долга', 'долгов')}
              </Badge>
            ) : (
              <Badge tone="ok">
                <CheckCircle2 size={11} />
                без долгов
              </Badge>
            )}
            <Badge tone="default">{inProgress.length} в процессе</Badge>
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">Ближайший дедлайн</h2>
            <Link to="/grades" className="text-[11px] font-semibold text-primary hover:underline">
              Все
            </Link>
          </div>
          {nearestDeadline ? (
            <>
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warn-bg text-warn">
                  <CalendarClock size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{nearestDeadline.title}</p>
                  <p className="truncate text-[11px] text-muted">{nearestDeadline.subject}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2">
                <span className="text-[11px] font-medium text-muted">
                  {formatDate(nearestDeadline.at, { weekday: 'short' })}, {nearestDeadline.at.slice(11, 16)}
                </span>
                <Badge tone="warn">{timeUntil(nearestDeadline.at)}</Badge>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">Дедлайнов нет — можно выдохнуть.</p>
          )}
        </div>
      </section>

      {/* Сегодня */}
      <section className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Сегодня</h2>
          <Link to="/schedule" className="text-[11px] font-semibold text-primary hover:underline">
            Вся неделя
          </Link>
        </div>
        {todayLessons.length ? (
          <div className="space-y-2">
            {todayLessons.slice(0, 3).map((l) => {
              const passed = toMinutes(l.end) < nowMin
              return (
                <div
                  key={l.id}
                  className={cn(
                    'card flex items-center gap-3 p-3.5',
                    passed && !l.change && 'opacity-55',
                  )}
                >
                  <div className="w-14 shrink-0 text-center">
                    <p className="text-sm font-bold leading-none">{l.start}</p>
                    <p className="mt-1 text-[10px] text-muted">{l.end}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{l.subject}</p>
                    <p className="truncate text-[11px] text-muted">
                      {l.type} · ауд. {l.room} · {l.teacher}
                    </p>
                  </div>
                  {l.change ? (
                    <Badge tone={l.change.kind === 'canceled' ? 'danger' : 'warn'}>
                      {l.change.kind === 'canceled' ? 'отмена' : 'изменение'}
                    </Badge>
                  ) : passed ? (
                    <span className="text-[10px] font-semibold text-muted">прошла</span>
                  ) : (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-ok" aria-label="предстоит" />
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card p-5 text-center">
            <p className="text-sm font-semibold">Сегодня пар нет 🎉</p>
            <p className="mt-1 text-xs text-muted">Хороший день, чтобы закрыть долги или заказать справку.</p>
          </div>
        )}
      </section>

      {/* Заявки */}
      <section className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Мои заявки</h2>
          <Link to="/requests" className="text-[11px] font-semibold text-primary hover:underline">
            Все ({myRequests.length})
          </Link>
        </div>
        {activeRequests.length ? (
          <div className="space-y-2">
            {activeRequests.slice(0, 2).map((r) => {
              const type = requestTypes.find((t) => t.id === r.typeId)
              return (
                <Link
                  key={r.id}
                  to={`/requests/${r.id}`}
                  className="card flex items-center gap-3 p-3.5 transition-transform hover:-translate-y-0.5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-info-bg text-primary">
                    <FileText size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{type?.title ?? 'Заявка'}</p>
                    <p className="truncate text-[11px] text-muted">
                      {r.number} · {timeAgo(r.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              )
            })}
          </div>
        ) : lastRequest ? (
          <Link to={`/requests/${lastRequest.id}`} className="card flex items-center gap-3 p-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ok-bg text-ok">
              <CheckCircle2 size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{lastType?.title ?? 'Заявка'}</p>
              <p className="text-[11px] text-muted">
                {lastRequest.number} · {lastRequest.status === 'ready' ? 'готова к выдаче' : 'завершена'}
              </p>
            </div>
            <StatusBadge status={lastRequest.status} />
          </Link>
        ) : (
          <div className="card flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-info-bg text-primary">
                <Wallet size={17} />
              </span>
              <div>
                <p className="text-sm font-semibold">Заявок пока нет</p>
                <p className="text-[11px] text-muted">Справка об обучении — за 3 шага</p>
              </div>
            </div>
            <Link to="/requests/new" className="btn-primary px-3 py-2 text-xs">
              Создать
            </Link>
          </div>
        )}
      </section>

      <p className="mt-6 rounded-2xl border border-border bg-surface px-4 py-3 text-[11px] leading-relaxed text-muted">
        <span className="font-semibold text-fg">Деканат+ · концепт.</span> Не официальный
        сервис вуза. Данные вымышлены. Тема: {theme === 'dark' ? 'тёмная' : 'светлая'}.
      </p>
    </div>
  )
}
