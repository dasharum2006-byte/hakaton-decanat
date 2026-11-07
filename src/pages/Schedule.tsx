import { useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  CalendarDays,
  Clock,
  MapPin,
  TriangleAlert,
  UserRound,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { DAY_NAMES, DAY_SHORT, addDays, cn, startOfWeek, toMinutes } from '../lib/utils'
import { Badge, PageHeader, Segmented } from '../components/ui'
import type { Lesson } from '../lib/types'

const typeTone: Record<string, string> = {
  Лекция: 'info',
  Семинар: 'default',
  Лабораторная: 'ok',
  Практика: 'warn',
  Консультация: 'default',
  Зачёт: 'danger',
  Экзамен: 'danger',
}

function LessonCard({
  lesson,
  passed,
  compact = false,
}: {
  lesson: Lesson
  passed?: boolean
  compact?: boolean
}) {
  const canceled = lesson.change?.kind === 'canceled'
  return (
    <article
      className={cn(
        'card relative overflow-hidden p-3.5',
        canceled && 'opacity-70',
        passed && !canceled && 'opacity-55',
        compact && 'p-3',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-14 shrink-0 text-center">
          <p className="text-sm font-bold leading-none">{lesson.start}</p>
          <p className="mt-1 text-[10px] text-muted">{lesson.end}</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className={cn('text-sm font-semibold leading-tight', canceled && 'line-through')}>
              {lesson.subject}
            </h3>
            <Badge tone={(typeTone[lesson.type] as never) ?? 'default'}>{lesson.type}</Badge>
            {lesson.change && (
              <Badge tone={canceled ? 'danger' : 'warn'}>
                {canceled ? <XCircle size={11} /> : <ArrowLeftRight size={11} />}
                {canceled ? 'отменено' : lesson.change.kind === 'moved' ? 'перенос' : 'замена'}
              </Badge>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} /> ауд. {lesson.room}
            </span>
            <span className="inline-flex items-center gap-1">
              <UserRound size={12} /> {lesson.teacher}
            </span>
          </div>
          {lesson.change && (
            <p
              className={cn(
                'mt-2 flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-[11px] leading-snug',
                canceled ? 'bg-danger-bg text-danger' : 'bg-warn-bg text-warn',
              )}
            >
              <TriangleAlert size={12} className="mt-0.5 shrink-0" />
              {lesson.change.note}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

export function Schedule() {
  const { student } = useAuth()
  const now = new Date()
  const todayDay = now.getDay() === 0 ? 7 : now.getDay()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const [view, setView] = useState<'day' | 'week'>('day')
  const [day, setDay] = useState(todayDay)

  const weekStart = useMemo(() => startOfWeek(now), [])
  const days = [1, 2, 3, 4, 5, 6]

  if (!student) return null

  const lessonsOf = (d: number) =>
    student.schedule
      .filter((l) => l.day === d)
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))

  const dayLessons = lessonsOf(day)
  const totalWeek = student.schedule.length

  return (
    <div className="animate-rise">
      <PageHeader
        title="Расписание"
        subtitle={`${student.group} · ${totalWeek} пар на неделе`}
        right={
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: 'day', label: 'День' },
              { value: 'week', label: 'Неделя' },
            ]}
          />
        }
      />

      {/* Полоса дней */}
      <div className="mb-4 grid grid-cols-6 gap-1.5">
        {days.map((d) => {
          const date = addDays(weekStart, d - 1)
          const isToday = d === todayDay
          const active = view === 'day' && d === day
          const count = lessonsOf(d).length
          return (
            <button
              key={d}
              onClick={() => {
                setDay(d)
                setView('day')
              }}
              className={cn(
                'flex flex-col items-center rounded-xl border px-1 py-2 transition-all',
                active
                  ? 'border-primary bg-primary text-primary-fg shadow-md shadow-primary/20'
                  : 'border-border bg-surface text-muted hover:border-primary/40 hover:text-fg',
              )}
              aria-pressed={active}
            >
              <span className="text-[10px] font-semibold uppercase">{DAY_SHORT[d]}</span>
              <span className={cn('text-sm font-bold', !active && isToday && 'text-primary')}>
                {date.getDate()}
              </span>
              <span
                className={cn(
                  'mt-1 h-1 w-1 rounded-full',
                  count > 0 ? (active ? 'bg-white' : 'bg-primary/60') : 'bg-transparent',
                )}
              />
            </button>
          )
        })}
      </div>

      {view === 'day' ? (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">
              {DAY_NAMES[day === 7 ? 0 : day]}
              {day === todayDay && <span className="ml-2 text-xs font-semibold text-primary">сегодня</span>}
            </h2>
            <span className="text-xs text-muted">
              {dayLessons.length} {dayLessons.length === 1 ? 'пара' : 'пар'}
            </span>
          </div>
          {dayLessons.length ? (
            <div className="space-y-2">
              {dayLessons.map((l) => (
                <LessonCard
                  key={l.id}
                  lesson={l}
                  passed={day === todayDay && toMinutes(l.end) < nowMin}
                />
              ))}
            </div>
          ) : (
            <div className="card px-5 py-10 text-center">
              <CalendarDays className="mx-auto mb-2 text-muted" size={26} />
              <p className="text-sm font-semibold">Пар нет</p>
              <p className="mt-1 text-xs text-muted">Свободный день — отдохните или закройте долги.</p>
            </div>
          )}

          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3">
            <Clock size={16} className="mt-0.5 shrink-0 text-primary" />
            <p className="text-[11px] leading-relaxed text-muted">
              <span className="font-semibold text-fg">Изменения подсвечены.</span> Переносы,
              замены и отмены приходят из деканата — в расписании и в уведомлениях.
            </p>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {days.map((d) => {
            const list = lessonsOf(d)
            return (
              <section key={d}>
                <div className="mb-2 flex items-center gap-2">
                  <h2 className={cn('text-sm font-bold', d === todayDay && 'text-primary')}>
                    {DAY_NAMES[d === 7 ? 0 : d]}
                  </h2>
                  <span className="text-[11px] text-muted">
                    {addDays(weekStart, d - 1).getDate()} число
                  </span>
                  {d === todayDay && <Badge tone="info">сегодня</Badge>}
                  {!list.length && <span className="text-[11px] text-muted">— пар нет</span>}
                </div>
                <div className="space-y-2">
                  {list.map((l) => (
                    <LessonCard
                      key={l.id}
                      lesson={l}
                      compact
                      passed={d === todayDay && toMinutes(l.end) < nowMin}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
