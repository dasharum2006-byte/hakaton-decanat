import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { students } from '../data/seed'
import {
  DAY_NAMES,
  DAY_SHORT,
  academicWeekNumber,
  addDays,
  cn,
  isoDay,
  plural,
  startOfWeek,
  weekParity,
} from '../lib/utils'
import { LessonTypeBadge, PageHeader, Segmented } from '../components/ui'
import { SleepingKotik } from '../components/SleepingKotik'
import { typeDot } from '../components/lesson-card'
import type { Lesson } from '../lib/types'

type View = 'day' | 'week' | 'month'

interface OwnLesson {
  lesson: Lesson
  group: string
}

const weekend = (day: number) => day === 6 || day === 7

export function TeacherSchedule() {
  const { teacher } = useAuth()
  const [view, setView] = useState<View>('day')
  const [anchor, setAnchor] = useState(() => new Date())
  const [day, setDay] = useState(() => isoDay())

  /** Все пары преподавателя из расписаний групп (без повторов) */
  const myLessons = useMemo<OwnLesson[]>(() => {
    if (!teacher) return []
    // В расписании преподаватель записан кратко: «Мельник О. В.» — сверяем фамилию
    const surname = teacher.name.split(' ')[0]
    const seen = new Set<string>()
    const list: OwnLesson[] = []
    for (const s of students) {
      for (const lesson of s.schedule) {
        if (!lesson.teacher.startsWith(surname)) continue
        const key = `${s.group}|${lesson.day}|${lesson.start}|${lesson.subject}|${lesson.room}`
        if (seen.has(key)) continue
        seen.add(key)
        list.push({ lesson, group: s.group })
      }
    }
    return list.sort((a, b) => a.lesson.start.localeCompare(b.lesson.start))
  }, [teacher])

  const weekStart = startOfWeek(anchor)
  const today = new Date()
  const isCurrentWeek = weekStart.getTime() === startOfWeek(today).getTime()
  const todayDay = isoDay(today)
  const days = [1, 2, 3, 4, 5, 6, 7]

  const lessonsOn = (date: Date) => {
    const weekday = isoDay(date)
    const parity = weekParity(date)
    return myLessons.filter(
      ({ lesson }) =>
        lesson.day === weekday && (!lesson.parity || lesson.parity === parity),
    )
  }

  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const monthCells = useMemo(() => {
    const firstWeekday = isoDay(monthStart)
    const gridStart = addDays(monthStart, -(firstWeekday - 1))
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  }, [anchor])

  const shift = (dir: number) => {
    setAnchor((prev) => {
      if (view === 'month') {
        return new Date(prev.getFullYear(), prev.getMonth() + dir, 1)
      }
      return addDays(prev, dir * 7)
    })
  }

  const resetToToday = () => {
    setAnchor(new Date())
    setDay(isoDay())
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

  const periodLabel =
    view === 'month'
      ? `${monthStart.toLocaleDateString('ru-RU', { month: 'long' })} ${monthStart.getFullYear()}`
      : academicWeekNumber(weekStart) < 1
        ? 'до семестра'
        : `${academicWeekNumber(weekStart)} неделя`
  const isCurrentPeriod = view === 'month' ? sameDay(monthStart, today) : isCurrentWeek

  if (!teacher) return null

  const dayDate = addDays(weekStart, day - 1)
  const dayLessons = myLessons.filter(
    ({ lesson }) =>
      lesson.day === day && (!lesson.parity || lesson.parity === weekParity(dayDate)),
  )

  const LessonRow = ({ lesson, group }: OwnLesson) => (
    <div className="card flex items-center gap-3 p-3.5">
      <div className="w-16 shrink-0 text-center">
        <p className="text-base font-bold leading-none">{lesson.start}</p>
        <p className="mt-1 flex items-center justify-center gap-0.5 text-xs text-muted">
          <Clock size={9} /> {lesson.end}
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{lesson.subject}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted">
          <span>{group}</span>
          <span className="inline-flex items-center gap-0.5">
            <MapPin size={10} /> ауд. {lesson.room}
          </span>
        </p>
      </div>
      <LessonTypeBadge type={lesson.type} />
    </div>
  )

  return (
    <div className="animate-rise">
      <PageHeader
        title="Расписание"
        subtitle={`${teacher.shortName} · ${teacher.subjects.join(' · ')}`}
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
          onClick={() => shift(-1)}
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
          onClick={() => shift(1)}
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
                !active &&
                  isWeekendDay &&
                  'border-border bg-surface text-danger hover:border-primary/40',
                !active &&
                  !isWeekendDay &&
                  'border-border bg-surface text-muted hover:border-primary/40 hover:text-fg',
              )}
              aria-pressed={active}
            >
              <span className="text-[10px] font-semibold uppercase">{DAY_SHORT[d % 7]}</span>
              <span className={cn('text-sm font-bold', !active && isToday && 'text-primary')}>
                {date.getDate()}
              </span>
              <span className="mt-1 flex h-1.5 items-center justify-center gap-[3px]">
                {list.slice(0, 4).map(({ lesson }) => (
                  <span
                    key={`${lesson.id}-${lesson.room}`}
                    className={cn('h-1.5 w-1.5 rounded-full', typeDot[lesson.type])}
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
              {dayLessons.map((item) => (
                <LessonRow key={`${item.group}-${item.lesson.id}`} {...item} />
              ))}
            </div>
          ) : (
            <div className="card px-5 py-6 text-center">
              <p className="text-sm font-semibold">Пар нет</p>
              <SleepingKotik className="mt-3 h-[142px]" />
            </div>
          )}
        </>
      ) : view === 'week' ? (
        <div className="space-y-4">
          {days.map((d) => {
            const date = addDays(weekStart, d - 1)
            const list = lessonsOn(date)
            return (
              <section key={d}>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <h2 className="text-sm font-bold">
                    {DAY_NAMES[d === 7 ? 0 : d]}, {date.getDate()}{' '}
                    {date.toLocaleDateString('ru-RU', { month: 'short' })}
                    {isCurrentWeek && d === todayDay && (
                      <span className="ml-2 text-[11px] font-semibold text-primary">сегодня</span>
                    )}
                  </h2>
                  <span className="text-[11px] text-muted">
                    {list.length ? `${list.length} ${plural(list.length, 'пара', 'пары', 'пар')}` : 'нет пар'}
                  </span>
                </div>
                {list.length ? (
                  <div className="space-y-2">
                    {list.map((item) => (
                      <LessonRow key={`${item.group}-${item.lesson.id}`} {...item} />
                    ))}
                  </div>
                ) : (
                  <p className="card p-3 text-[12px] text-muted">Пар нет</p>
                )}
              </section>
            )
          })}
        </div>
      ) : (
        <div className="card p-3">
          <div className="grid grid-cols-7 gap-1 pb-1 text-center">
            {DAY_SHORT.map((label) => (
              <span
                key={label}
                className={cn(
                  'text-[10px] font-semibold uppercase',
                  label === 'Сб' || label === 'Вс' ? 'text-danger' : 'text-muted',
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
              const isToday = sameDay(date, today)
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
                    {list.slice(0, 3).map(({ lesson }) => (
                      <span
                        key={`${lesson.id}-${lesson.room}`}
                        className={cn('h-1.5 w-1.5 rounded-full', typeDot[lesson.type])}
                      />
                    ))}
                    {list.length > 3 && (
                      <span className="text-[8px] font-semibold leading-none">
                        +{list.length - 3}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
