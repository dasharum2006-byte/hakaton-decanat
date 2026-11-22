import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../lib/auth'
import {
  DAY_NAMES,
  DAY_SHORT,
  academicWeekNumber,
  addDays,
  cn,
  deadlineTone,
  formatTime,
  isoDay,
  plural,
  startOfWeek,
  weekParity,
  toMinutes,
} from '../lib/utils'
import { Badge, PageHeader, Segmented } from '../components/ui'
import { LessonCard, typeDot } from '../components/lesson-card'
import { SleepingKotik } from '../components/SleepingKotik'
import type { Deadline, Lesson, LessonType } from '../lib/types'

const weekend = (day: number) => day === 6 || day === 7

/** Тип пары, к которому привязывается работа из основной системы */
const assessmentLessonType = (title: string): LessonType =>
  /коллоквиум/i.test(title) ? 'Лекция' : 'Практика'

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

function DeadlineNote({ deadline, compact = false }: { deadline: Deadline; compact?: boolean }) {
  const tone = deadlineTone(deadline.at)
  return (
    <article
      className={cn(
        'card flex items-center gap-3 border-l-4 border-l-danger p-3',
        compact && 'p-2.5',
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          tone === 'danger' ? 'bg-danger-bg text-danger' : 'bg-warn-bg text-warn',
        )}
      >
        <CalendarClock size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold">{deadline.title}</p>
        <p className="truncate text-[11px] text-muted">
          {deadline.subject} · до {formatTime(deadline.at)}
        </p>
      </div>
    </article>
  )
}

export function Schedule() {
  const { student } = useAuth()
  const now = useNow()
  const todayDay = now.getDay() === 0 ? 7 : now.getDay()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()

  const [view, setView] = useState<'day' | 'week' | 'month'>('day')
  const [day, setDay] = useState(todayDay)
  const [anchor, setAnchor] = useState(() => new Date())

  const weekStart = useMemo(() => startOfWeek(anchor), [anchor])
  const monthStart = useMemo(
    () => new Date(anchor.getFullYear(), anchor.getMonth(), 1),
    [anchor],
  )
  const monthCells = useMemo(() => {
    const first = startOfWeek(monthStart)
    const lastDay = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
    const end = addDays(lastDay, (7 - isoDay(lastDay)) % 7)
    const cells: Date[] = []
    for (let d = first; d <= end; d = addDays(d, 1)) cells.push(new Date(d))
    return cells
  }, [monthStart])
  const isCurrentWeek = startOfWeek(now).getTime() === weekStart.getTime()
  const isCurrentMonth =
    now.getFullYear() === monthStart.getFullYear() && now.getMonth() === monthStart.getMonth()
  const days = [1, 2, 3, 4, 5, 6, 7]

  if (!student) return null

  const lessonsOn = (date: Date) =>
    student.schedule
      .filter(
        (l) => l.day === isoDay(date) && (!l.parity || l.parity === weekParity(date)),
      )
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))

  const dayLessons = lessonsOn(addDays(weekStart, day - 1))
  const totalWeek = days.reduce(
    (count, d) => count + lessonsOn(addDays(weekStart, d - 1)).length,
    0,
  )

  const shiftPeriod = (delta: number) => {
    setAnchor((a) =>
      view === 'month'
        ? new Date(a.getFullYear(), a.getMonth() + delta, 1)
        : addDays(a, delta * 7),
    )
  }

  const resetToToday = () => {
    setAnchor(new Date())
    setDay(todayDay)
  }

  const openDay = (date: Date) => {
    setAnchor(date)
    setDay(isoDay(date))
    setView('day')
  }

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const deadlinesOn = (date: Date) =>
    student.deadlines
      .filter((d) => sameDay(new Date(d.at), date))
      .sort((a, b) => +new Date(a.at) - +new Date(b.at))

  /**
   * 1. Проходим по всем датам диапазона работы.
   * 2. Ищем в этой дате пару по предмету.
   * 3. Оставляем только нужный тип: практика для контрольной/тестирования,
   *    лекция для коллоквиума. Первая подходящая дата получает бейдж.
   */
  const resolvedAssessments = useMemo(() => {
    if (!student) return [] as { dateKey: string; lessonId: string; title: string }[]
    return student.assessments.flatMap((assessment) => {
      const required = assessmentLessonType(assessment.title)
      const from = new Date(assessment.from)
      const to = new Date(assessment.to)
      const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
      const end = new Date(to.getFullYear(), to.getMonth(), to.getDate())
      for (let date = start; date <= end; date = addDays(date, 1)) {
        const weekday = isoDay(date)
        const lesson = student.schedule.find(
          (l) =>
            l.day === weekday &&
            l.subject === assessment.subject &&
            l.type === required &&
            (!l.parity || l.parity === weekParity(date)),
        )
        if (lesson) {
          return [{ dateKey: dayKey(date), lessonId: lesson.id, title: assessment.title }]
        }
      }
      return []
    })
  }, [student])

  const assessmentFor = (date: Date, lesson: Lesson) => {
    const key = dayKey(date)
    return resolvedAssessments
      .filter((item) => item.dateKey === key && item.lessonId === lesson.id)
      .map((item) => item.title)
      .join(' · ')
  }

  const periodLabel =
    view === 'month'
      ? `${monthStart.toLocaleDateString('ru-RU', { month: 'long' })} ${monthStart.getFullYear()}`
      : academicWeekNumber(weekStart) < 1
        ? 'до семестра'
        : `${academicWeekNumber(weekStart)} неделя`
  const isCurrentPeriod = view === 'month' ? isCurrentMonth : isCurrentWeek

  return (
    <div className="animate-rise">
      <PageHeader
        title="Расписание"
        subtitle={`${student.group} · ${totalWeek} ${plural(totalWeek, 'пара', 'пары', 'пар')} на неделе`}
      />

      <div className="mb-3 -mt-2">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'day', label: 'День' },
            { value: 'week', label: 'Неделя' },
            { value: 'month', label: 'Месяц' },
          ]}
        />
      </div>

      {/* Переключение недель и месяцев */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          className="btn-soft h-9 w-9 p-0"
          onClick={() => shiftPeriod(-1)}
          aria-label={view === 'month' ? 'Предыдущий месяц' : 'Предыдущая неделя'}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-base font-bold leading-tight sm:text-lg">{periodLabel}</p>
          <div className="mt-0.5 flex h-4 items-center justify-center">
            {isCurrentPeriod ? (
              <span className="whitespace-nowrap text-[11px] font-medium text-primary">
                {view === 'month' ? 'Текущий месяц' : 'Текущая неделя'}
              </span>
            ) : (
              <button
                type="button"
                className="max-w-full truncate whitespace-nowrap text-[11px] font-medium text-muted hover:text-primary hover:underline"
                onClick={resetToToday}
              >
                {view === 'month' ? 'Вернуться к текущему месяцу' : 'Вернуться к текущей неделе'}
              </button>
            )}
          </div>
        </div>
        <button
          type="button"
          className="btn-soft h-9 w-9 p-0"
          onClick={() => shiftPeriod(1)}
          aria-label={view === 'month' ? 'Следующий месяц' : 'Следующая неделя'}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Полоса дней */}
      <div className={cn('mb-2 grid-cols-7 gap-1.5', view === 'month' ? 'hidden' : 'grid')}>
        {days.map((d) => {
          const date = addDays(weekStart, d - 1)
          const isToday = isCurrentWeek && d === todayDay
          const active = view === 'day' && d === day
          const list = lessonsOn(date)
          const isWeekendDay = weekend(d)
          return (
            <button
              key={d}
              onClick={() => {
                setDay(d)
                setView('day')
              }}
              className={cn(
                'flex flex-col items-center rounded-xl border px-1 py-2 transition-colors',
                active && 'border-primary ring-1 ring-primary/30',
                active && !isWeekendDay && 'bg-info-bg text-primary',
                active && isWeekendDay && 'bg-info-bg text-danger',
                !active && isWeekendDay &&
                  'border-border bg-surface text-danger hover:border-primary/40',
                !active && !isWeekendDay &&
                  'border-border bg-surface text-muted hover:border-primary/40 hover:text-fg',
              )}
              aria-pressed={active}
            >
              <span className="text-[10px] font-semibold uppercase">{DAY_SHORT[d % 7]}</span>
              <span className={cn('text-sm font-bold', !active && isToday && 'text-primary')}>
                {date.getDate()}
              </span>
              <span className="mt-1 flex h-1.5 items-center justify-center gap-[3px]">
                {list.slice(0, 4).map((l) => (
                  <span
                    key={l.id}
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      typeDot[l.type],
                      l.change?.kind === 'canceled' && 'opacity-40',
                    )}
                  />
                ))}
                {list.length > 4 && (
                  <span className="text-[8px] font-semibold leading-none">+{list.length - 4}</span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {view === 'day' ? (
        <>
          <div className="mb-3 mt-1 flex items-center justify-between">
            <h2 className="text-base font-bold sm:text-lg">
              {DAY_NAMES[day === 7 ? 0 : day]}
              {isCurrentWeek && day === todayDay && (
                <span className="ml-2 text-xs font-semibold text-primary">сегодня</span>
              )}
            </h2>
            <span className="text-xs text-muted">
              {dayLessons.length} {plural(dayLessons.length, 'пара', 'пары', 'пар')}
            </span>
          </div>
          {dayLessons.length ? (
            <div className="space-y-2">
              {dayLessons.map((l) => (
                <LessonCard
                  key={l.id}
                  lesson={l}
                  nowSec={isCurrentWeek && day === todayDay ? nowSec : undefined}
                  passed={isCurrentWeek && day === todayDay && toMinutes(l.end) < nowMin}
                  assessment={assessmentFor(addDays(weekStart, day - 1), l) || undefined}
                />
              ))}
            </div>
          ) : (
            <div className="card px-5 py-6 text-center">
              <p className="text-sm font-semibold">Пар нет</p>
              <SleepingKotik className="mt-3 h-[142px]" />
            </div>
          )}

          {deadlinesOn(addDays(weekStart, day - 1)).length > 0 && (
            <div className="mt-3 space-y-2">
              {deadlinesOn(addDays(weekStart, day - 1)).map((d) => (
                <DeadlineNote key={d.id} deadline={d} />
              ))}
            </div>
          )}
        </>
      ) : view === 'week' ? (
        <div className="space-y-4">
          {days.map((d) => {
            const date = addDays(weekStart, d - 1)
            const list = lessonsOn(date)
            const dayDeadlines = deadlinesOn(date)
            return (
              <section key={d}>
                <div className="mb-2 flex items-center gap-2">
                  <h2
                    className={cn(
                      'text-sm font-bold',
                      d === todayDay ? 'text-primary' : weekend(d) && 'text-danger',
                    )}
                  >
                    {DAY_NAMES[d === 7 ? 0 : d]}, {date.getDate()}
                  </h2>
                  {isCurrentWeek && d === todayDay && <Badge tone="info">сегодня</Badge>}
                </div>
                <div className="space-y-2">
                  {list.length ? (
                    list.map((l) => (
                      <LessonCard
                        key={l.id}
                        lesson={l}
                        compact
                        nowSec={isCurrentWeek && d === todayDay ? nowSec : undefined}
                        passed={isCurrentWeek && d === todayDay && toMinutes(l.end) < nowMin}
                        assessment={assessmentFor(date, l) || undefined}
                      />
                    ))
                  ) : (
                    <div className="card px-4 py-5 text-center">
                      <p className="text-sm font-semibold">Пар нет</p>
                    </div>
                  )}
                  {dayDeadlines.map((deadline) => (
                    <DeadlineNote key={deadline.id} deadline={deadline} compact />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="card p-2.5">
          <div className="mb-1 grid grid-cols-7 gap-1">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((label, i) => (
              <span
                key={label}
                className={cn(
                  'text-center text-[10px] font-semibold uppercase',
                  i >= 5 ? 'text-danger' : 'text-muted',
                )}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthCells.map((date) => {
              const outside = date.getMonth() !== monthStart.getMonth()
              const wd = isoDay(date)
              const list = lessonsOn(date)
              const isToday = sameDay(date, now)
              return (
                <button
                  key={date.toDateString()}
                  type="button"
                  onClick={() => openDay(date)}
                  aria-label={date.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                  })}
                  className={cn(
                    'flex min-h-[52px] flex-col items-center rounded-lg border px-0.5 py-1.5 transition-colors',
                    outside
                      ? 'border-transparent opacity-45 hover:border-border'
                      : 'border-border bg-surface hover:border-primary/40',
                    weekend(wd) && 'text-danger',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold',
                      isToday ? 'bg-primary-solid text-white' : weekend(wd) && 'text-danger',
                    )}
                  >
                    {date.getDate()}
                  </span>
                  <span className="mt-1 flex h-1.5 items-center justify-center gap-[3px]">
                    {list.slice(0, 3).map((l) => (
                      <span
                        key={l.id}
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          typeDot[l.type],
                          l.change?.kind === 'canceled' && 'opacity-40',
                        )}
                      />
                    ))}
                    {list.length > 3 && (
                      <span className="text-[8px] font-semibold leading-none">
                        +{list.length - 3}
                      </span>
                    )}
                  </span>
                  {deadlinesOn(date).length > 0 && (
                    <span className="mt-0.5 h-0.5 w-3 rounded-full bg-danger" aria-hidden />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
