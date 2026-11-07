import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  RotateCcw,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { gpa } from '../lib/assistant'
import { cn, formatDate, formatGpa, plural, timeUntil } from '../lib/utils'
import { Badge, PageHeader, ProgressBar, Segmented } from '../components/ui'
import type { Grade } from '../lib/types'

type Filter = 'all' | 'closed' | 'progress' | 'debt'

const gradeTone = (g: Grade) => {
  if (g.status === 'debt') return 'danger'
  if (g.status === 'in-progress') return 'warn'
  if (g.grade === '5' || g.grade === 'Зачтено') return 'ok'
  if (g.grade === '4') return 'info'
  return 'default'
}

export function Grades() {
  const { student } = useAuth()
  const [filter, setFilter] = useState<Filter>('all')

  const stats = useMemo(() => {
    if (!student) return null
    const grades = student.grades
    const closed = grades.filter((g) => g.status === 'closed')
    const inProgress = grades.filter((g) => g.status === 'in-progress')
    const debts = grades.filter((g) => g.status === 'debt')
    const totalCredits = grades.reduce((s, g) => s + g.credits, 0)
    const closedCredits = closed.reduce((s, g) => s + g.credits, 0)
    return {
      grades,
      closed,
      inProgress,
      debts,
      totalCredits,
      closedCredits,
      progress: Math.round((closedCredits / totalCredits) * 100),
      average: gpa(grades),
    }
  }, [student])

  if (!student || !stats) return null

  const filtered = stats.grades.filter((g) => {
    if (filter === 'closed') return g.status === 'closed'
    if (filter === 'progress') return g.status === 'in-progress'
    if (filter === 'debt') return g.status === 'debt'
    return true
  })

  const upcoming = student.deadlines
    .filter((d) => new Date(d.at).getTime() > Date.now())
    .sort((a, b) => +new Date(a.at) - +new Date(b.at))

  const sessionTone = stats.debts.length ? 'danger' : stats.inProgress.length > 2 ? 'warn' : 'ok'

  return (
    <div className="animate-rise">
      <PageHeader
        title="Учёба"
        subtitle={`${student.group} · ${student.course} курс · осень 2026`}
      />

      <section className="mb-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
            <TrendingUp size={12} /> Средний балл
          </div>
          <p className="mt-1 text-2xl font-extrabold">{formatGpa(stats.average)}</p>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
            <GraduationCap size={12} /> Закрыто
          </div>
          <p className="mt-1 text-2xl font-extrabold">
            {stats.closedCredits}
            <span className="text-sm font-semibold text-muted"> / {stats.totalCredits} з.е.</span>
          </p>
        </div>
        <div className="card p-3.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
            <CalendarClock size={12} /> В процессе
          </div>
          <p className="mt-1 text-2xl font-extrabold">{stats.inProgress.length}</p>
        </div>
        <div className={cn('card p-3.5', stats.debts.length && 'border-danger/30')}>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
            <AlertTriangle size={12} /> Долги
          </div>
          <p
            className={cn(
              'mt-1 text-2xl font-extrabold',
              stats.debts.length ? 'text-danger' : 'text-ok',
            )}
          >
            {stats.debts.length}
          </p>
        </div>
      </section>

      <section className="card mb-4 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold">Здоровье сессии</h2>
          <Badge tone={sessionTone}>
            {sessionTone === 'ok' ? 'всё по плану' : sessionTone === 'warn' ? 'нужно внимание' : 'есть долги'}
          </Badge>
        </div>
        <ProgressBar value={stats.progress} tone={sessionTone === 'ok' ? 'ok' : sessionTone} />
        <p className="mt-2 text-[11px] text-muted">
          Закрыто {stats.progress}% зачётных единиц. До конца семестра —{' '}
          {plural(stats.inProgress.length, 'одна дисциплина', 'дисциплины', 'дисциплин')} в процессе.
        </p>
      </section>

      {stats.debts.length > 0 && (
        <section className="mb-4 rounded-2xl border border-danger/30 bg-danger-bg p-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 shrink-0 text-danger" size={18} />
            <div className="flex-1">
              <p className="text-sm font-bold text-danger">
                {stats.debts.length} {plural(stats.debts.length, 'долг', 'долга', 'долгов')} — лучше не откладывать
              </p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-danger/85">
                {stats.debts.map((d) => d.subject).join(', ')}. Пересдача в дополнительную сессию.
              </p>
              <Link to="/requests/new?type=r_retake" className="btn-primary mt-2.5 px-3 py-2 text-xs">
                <RotateCcw size={14} />
                Заявление на пересдачу
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Дисциплины</h2>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Все' },
            { value: 'closed', label: 'Закрытые' },
            { value: 'progress', label: 'В процессе' },
            { value: 'debt', label: 'Долги' },
          ]}
        />
      </div>

      <div className="mb-6 space-y-2">
        {filtered.length ? (
          filtered.map((g) => (
            <article key={g.id} className="card flex items-center gap-3 p-3.5">
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold',
                  g.status === 'closed' && 'bg-ok-bg text-ok',
                  g.status === 'in-progress' && 'bg-warn-bg text-warn',
                  g.status === 'debt' && 'bg-danger-bg text-danger',
                )}
              >
                {g.status === 'closed' ? (g.grade === 'Зачтено' ? 'З' : g.grade) : g.status === 'debt' ? '!' : '…'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{g.subject}</p>
                <p className="truncate text-[11px] text-muted">
                  {g.control} · {g.credits} з.е. · {g.teacher}
                </p>
              </div>
              <Badge tone={gradeTone(g)}>
                {g.status === 'closed' ? (g.grade ?? 'закрыто') : g.status === 'debt' ? 'долг' : 'в процессе'}
              </Badge>
            </article>
          ))
        ) : (
          <div className="card p-6 text-center text-sm text-muted">
            <CheckCircle2 className="mx-auto mb-2 text-ok" size={22} />
            В этой категории пусто
          </div>
        )}
      </div>

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Дедлайны</h2>
      <div className="space-y-2">
        {upcoming.length ? (
          upcoming.map((d) => (
            <article key={d.id} className="card flex items-center gap-3 p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted">
                <CalendarClock size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{d.title}</p>
                <p className="truncate text-[11px] text-muted">
                  {d.subject} · {formatDate(d.at, { weekday: 'short' })}, {d.at.slice(11, 16)}
                </p>
              </div>
              <Badge tone={new Date(d.at).getTime() - Date.now() < 3 * 86400000 ? 'warn' : 'default'}>
                {timeUntil(d.at)}
              </Badge>
            </article>
          ))
        ) : (
          <div className="card p-5 text-center text-sm text-muted">Ближайших дедлайнов нет</div>
        )}
      </div>
    </div>
  )
}
