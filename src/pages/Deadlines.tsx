import { CalendarClock, TriangleAlert } from 'lucide-react'
import { useAuth } from '../lib/auth'
import {
  deadlineLabel,
  deadlineTone,
  daysUntil,
  formatDate,
  formatTime,
  plural,
} from '../lib/utils'
import { Badge, PageHeader } from '../components/ui'
import { BackLink } from '../components/BackLink'
import type { Deadline } from '../lib/types'

interface Group {
  id: string
  title: string
  hint?: string
  items: Deadline[]
}

function groupDeadlines(deadlines: Deadline[]): Group[] {
  const groups: Group[] = [
    { id: 'overdue', title: 'Просрочено', items: [] },
    { id: 'today', title: 'Сегодня', items: [] },
    { id: 'tomorrow', title: 'Завтра', items: [] },
    { id: 'week', title: 'На этой неделе', items: [] },
    { id: 'later', title: 'Позже', items: [] },
  ]
  const byId = new Map(groups.map((g) => [g.id, g]))
  for (const d of deadlines) {
    const days = daysUntil(d.at)
    const id = days < 0 ? 'overdue' : days === 0 ? 'today' : days === 1 ? 'tomorrow' : days < 7 ? 'week' : 'later'
    byId.get(id)!.items.push(d)
  }
  for (const g of groups) {
    g.items.sort((a, b) => +new Date(a.at) - +new Date(b.at))
  }
  return groups.filter((g) => g.items.length > 0)
}

export function Deadlines() {
  const { student } = useAuth()
  if (!student) return null

  const sorted = [...student.deadlines].sort((a, b) => +new Date(a.at) - +new Date(b.at))
  const groups = groupDeadlines(sorted)
  const upcoming = sorted.filter((d) => daysUntil(d.at) >= 0)
  const nearest = upcoming[0]
  const overdue = sorted.filter((d) => daysUntil(d.at) < 0)

  return (
    <div className="animate-rise">
      <BackLink />

      <PageHeader
        title="Дедлайны"
        subtitle={`${student.group} · ${upcoming.length} ${plural(upcoming.length, 'дедлайн', 'дедлайна', 'дедлайнов')}${overdue.length ? ` · ${overdue.length} просрочено` : ''}`}
      />

      {nearest ? (
        <section className="card mb-4 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-primary">
              <CalendarClock size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Ближайший дедлайн
              </p>
              <p className="mt-0.5 truncate text-sm font-bold">{nearest.title}</p>
              <p className="truncate text-[11px] text-muted">
                {nearest.subject} · {formatDate(nearest.at, { weekday: 'short' })},{' '}
                {formatTime(nearest.at)}
              </p>
            </div>
            <Badge tone={deadlineTone(nearest.at)}>{deadlineLabel(nearest.at)}</Badge>
          </div>
        </section>
      ) : (
        <section className="card mb-4 p-4 text-center">
          <p className="text-sm font-semibold">Ближайших дедлайнов нет</p>
          <p className="mt-1 text-[12px] text-muted">Все работы сданы — можно выдохнуть.</p>
        </section>
      )}

      {groups.map((group) => (
        <section key={group.id} className="mb-4">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
            {group.title}
          </h2>
          <div className="space-y-2">
            {group.items.map((d) => {
              const isOverdue = daysUntil(d.at) < 0
              return (
                <article
                  key={d.id}
                  className={
                    'card flex items-center gap-3 p-3.5' + (isOverdue ? ' border-danger/30' : '')
                  }
                >
                  <span
                    className={
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full ' +
                      (isOverdue ? 'bg-danger-bg text-danger' : 'bg-surface-2 text-primary')
                    }
                  >
                    {isOverdue ? <TriangleAlert size={16} /> : <CalendarClock size={16} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{d.title}</p>
                    <p className="truncate text-[11px] text-muted">
                      {d.subject} · {formatDate(d.at, { weekday: 'short' })},{' '}
                      {formatTime(d.at)}
                    </p>
                  </div>
                  <Badge tone={deadlineTone(d.at)} className="shrink-0">
                    {deadlineLabel(d.at)}
                  </Badge>
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
