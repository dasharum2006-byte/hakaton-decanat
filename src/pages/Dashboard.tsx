import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { SleepingKotik } from '../components/SleepingKotik'
import { useData } from '../lib/store'
import {
  DAY_NAMES,
  cn,
  formatDate,
  formatGpa,
  formatTime,
  plural,
  timeAgo,
  addDays,
  deadlineLabel,
  deadlineTone,
  isoDay,
  toMinutes,
  weekParity,
} from '../lib/utils'
import { gpa } from '../lib/assistant'
import { Badge, LessonTypeBadge, ProgressBar, StatusBadge } from '../components/ui'
import { requestTypes } from '../data/seed'
import vuzBg from '../assets/vuz-bg.png'

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

export function Dashboard() {
  const { student } = useAuth()
  const { myRequests } = useData()
  const now = useNow(30_000)

  const todayDay = now.getDay() === 0 ? 7 : now.getDay()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const todayLessons = useMemo(
    () =>
      (student?.schedule ?? [])
        .filter((l) => l.day === todayDay && (!l.parity || l.parity === weekParity(now)))
        .sort((a, b) => toMinutes(a.start) - toMinutes(b.start)),
    [student?.schedule, todayDay, now],
  )

  const nextLesson = useMemo(() => {
    const upcomingToday = todayLessons.find((l) => toMinutes(l.end) > nowMin)
    if (upcomingToday) return upcomingToday
    for (let offset = 1; offset <= 7; offset++) {
      const date = addDays(now, offset)
      const day = isoDay(date)
      const parity = weekParity(date)
      const list = (student?.schedule ?? [])
        .filter((l) => l.day === day && (!l.parity || l.parity === parity))
        .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
      if (list.length) return list[0]
    }
    return null
  }, [student?.schedule, todayLessons, nowMin, now])

  const lessonOngoing =
    !!nextLesson &&
    nextLesson.day === todayDay &&
    nextLesson.change?.kind !== 'canceled' &&
    toMinutes(nextLesson.start) <= nowMin &&
    nowMin < toMinutes(nextLesson.end)

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
  const average = gpa(student.grades)
  /** «Тревожная» успеваемость: есть долг или средний балл ниже 3 */
  const gradesRisk = debts.length > 0 || average < 3

  const activeRequests = myRequests.filter(
    (r) => r.status === 'new' || r.status === 'in_progress' || r.status === 'signed',
  )
  const lastRequest = myRequests[0]
  const lastType = lastRequest ? requestTypes.find((t) => t.id === lastRequest.typeId) : undefined

  return (
    <div className="animate-rise">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {DAY_NAMES[todayDay === 7 ? 0 : todayDay]}, {formatDate(now)}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Привет, {student.shortName}
          </h1>
          <p className="mt-1.5 text-lg font-bold text-primary">
            {todayLessons.length ? 'Удачного учебного дня!' : 'Хорошего Выходного!'}
          </p>
        </div>
      </div>

      {/* Следующая пара */}
      <section className="relative mb-4 overflow-hidden rounded-2xl bg-primary-solid px-4 py-2.5 text-white shadow-md">
        <img
          src={vuzBg}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 h-full w-[88%] object-cover object-top opacity-20"
        />
        <div className="relative">
        {nextLesson ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold backdrop-blur">
                <Clock size={13} />
                {lessonOngoing
                  ? 'Сейчас идёт'
                  : nextLesson.day === todayDay
                    ? 'Следующая пара сегодня'
                    : 'Следующая пара'}
              </span>
              <span className="text-base font-bold uppercase tracking-wide text-white sm:text-lg">
                {DAY_NAMES[nextLesson.day === 7 ? 0 : nextLesson.day]}
              </span>
            </div>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight">{nextLesson.subject}</h2>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-base text-white/95">
              <span className="text-lg font-bold tabular-nums">
                {nextLesson.start}–{nextLesson.end}
              </span>
              <span className="text-white/50" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1 font-semibold">
                <MapPin size={15} /> ауд. {nextLesson.room}
              </span>
              <span className="text-white/50" aria-hidden>
                ·
              </span>
              <span className="font-medium">{nextLesson.teacher}</span>
            </div>
            <div className="mt-1.5 flex justify-end">
              <Link
                to="/schedule"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur transition-colors hover:bg-white/30"
              >
                Всё расписание <ArrowRight size={14} />
              </Link>
            </div>
            {nextLesson.change && (
              <div className="mt-2 flex items-start gap-2 rounded-xl bg-black/15 px-3 py-2 text-[11px] leading-snug">
                <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                {nextLesson.change.note}
              </div>
            )}
          </>
        ) : (
          <div className="py-1.5">
            <h2 className="text-xl font-bold">Пар нет</h2>
            <p className="mt-1 text-sm text-white/85">Свободный день.</p>
          </div>
        )}
        </div>
      </section>

      {/* Сейчас важно */}
      <section className="mb-4 grid gap-3 sm:grid-cols-2">
        <Link
          to="/grades"
          className={cn(
            'card block p-4 backdrop-blur-md transition-colors',
            gradesRisk
              ? 'border-danger/30 bg-danger-bg/55 hover:border-danger/50'
              : 'border-primary/25 bg-info-bg/60 hover:border-primary/45',
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[15px] font-bold">Успеваемость</h2>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-extrabold">{formatGpa(average)}</p>
              <p className="text-[11px] text-muted">средний балл</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">
                {creditsClosed} / {creditsTotal} з.е.
              </p>
              <p className="text-[11px] text-muted">закрыто</p>
            </div>
          </div>
          <ProgressBar value={progress} tone="primary" className="mt-3" trackClassName="bg-white/90" />
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
          </div>
        </Link>

        <Link
          to="/deadlines"
          className="card block border-l-4 border-l-danger border-primary/25 bg-info-bg/60 p-4 backdrop-blur-md transition-colors hover:border-primary/45"
        >
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[15px] font-bold">Ближайший дедлайн</h2>
          </div>
          {nearestDeadline ? (
            <>
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-primary">
                  <CalendarClock size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{nearestDeadline.title}</p>
                  <p className="truncate text-[13px] text-muted">{nearestDeadline.subject}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-[14px] font-medium text-muted">
                  {formatDate(nearestDeadline.at, { weekday: 'short' })}, {formatTime(nearestDeadline.at)}
                </span>
                <Badge tone={deadlineTone(nearestDeadline.at)} className="text-[13px]!">
                  {deadlineLabel(nearestDeadline.at)}
                </Badge>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">Ближайших дедлайнов нет.</p>
          )}
        </Link>
      </section>

      {/* Сегодня */}
      <section className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-fg">Сегодня</h2>
        </div>
        {todayLessons.length ? (
          <div className="space-y-2">
            {todayLessons.slice(0, 3).map((l) => {
              const startMin = toMinutes(l.start)
              const endMin = toMinutes(l.end)
              const passed = endMin < nowMin
              const ongoing =
                !passed && l.change?.kind !== 'canceled' && startMin <= nowMin
              const progress = ongoing
                ? Math.min(1, Math.max(0, (nowMin - startMin) / Math.max(1, endMin - startMin)))
                : 0
              return (
                <div
                  key={l.id}
                  className={cn(
                    'card relative flex items-center gap-3 overflow-hidden p-3.5',
                    passed && !l.change && 'opacity-55',
                    ongoing && 'border-primary/35 bg-info-bg',
                  )}
                >
                  <div className="w-16 shrink-0 text-center">
                    <p className="text-base font-bold leading-none">{l.start}</p>
                    <p className="mt-1 text-xs text-muted">{l.end}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{l.subject}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted">
                      <LessonTypeBadge type={l.type} />
                      <Link
                        to={`/campus?room=${encodeURIComponent(l.room)}`}
                        className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 transition-colors hover:text-primary"
                        aria-label={`Где находится аудитория ${l.room}`}
                      >
                        <MapPin size={11} /> ауд. {l.room}
                      </Link>
                      <span className="truncate">{l.teacher}</span>
                    </div>
                  </div>
                  {l.change ? (
                    <Badge tone={l.change.kind === 'canceled' ? 'danger' : 'warn'}>
                      {l.change.kind === 'canceled' ? 'отмена' : 'изменение'}
                    </Badge>
                  ) : null}
                  {ongoing && (
                    <div
                      className="absolute inset-x-0 bottom-0 h-1 bg-primary/15"
                      role="progressbar"
                      aria-label="Пара идёт"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(progress * 100)}
                    >
                      <div
                        className="h-full bg-primary-solid transition-[width] duration-1000 ease-linear"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card p-4 text-center">
            <p className="text-sm font-semibold">Сегодня пар нет</p>
            <SleepingKotik className="mt-3 h-[142px]" />
          </div>
        )}
      </section>

      {/* Заявки */}
      <section className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-fg">Мои заявки</h2>
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
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-primary">
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
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-primary">
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
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-primary">
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
    </div>
  )
}
