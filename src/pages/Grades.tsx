import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Atom,
  Binary,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CodeXml,
  Crown,
  Database,
  Feather,
  Globe,
  Network,
  Shapes,
  Sigma,
  Workflow,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { gpa } from '../lib/assistant'
import { gradeCircleClass, gradeCircleLabel } from '../lib/grades'
import { cn, deadlineLabel, daysUntil, formatDate, formatGpa, plural } from '../lib/utils'
import { PageHeader, Segmented } from '../components/ui'
import type { Grade } from '../lib/types'

type Filter = 'all' | 'closed' | 'progress' | 'debt'

/** Иконка предмета вместо кружка с «…» у дисциплин в процессе */
function subjectIcon(subject: string) {
  const size = 19
  if (/курсовая/i.test(subject)) return <BookOpen size={size} />
  if (/проектная/i.test(subject)) return <Workflow size={size} />
  if (/история/i.test(subject)) return <Crown size={size} />
  if (/математический анализ/i.test(subject)) return <Sigma size={size} />
  if (/алгебра|геометрия/i.test(subject)) return <Shapes size={size} />
  if (/базы данных/i.test(subject)) return <Database size={size} />
  if (/программирование|kotlin/i.test(subject)) return <CodeXml size={size} />
  if (/сети/i.test(subject)) return <Network size={size} />
  if (/web/i.test(subject)) return <Globe size={size} />
  if (/физика/i.test(subject)) return <Atom size={size} />
  if (/философия/i.test(subject)) return <Feather size={size} />
  if (/дискретная/i.test(subject)) return <Binary size={size} />
  return <BookOpen size={size} />
}

/** Кольцо прогресса зачётных единиц */
function CreditsRing({ closed, total }: { closed: number; total: number }) {
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const ratio = total ? Math.min(1, closed / total) : 0
  return (
    <div
      className="relative h-[96px] w-[96px] shrink-0"
      role="img"
      aria-label={`Закрыто ${closed} из ${total} зачётных единиц`}
    >
      <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90" aria-hidden>
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          strokeWidth="9"
          className="stroke-surface-2"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          className="stroke-ok transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold leading-none">{closed}</span>
        <span className="mt-1 text-[10px] font-semibold text-muted">из {total} з.е.</span>
      </div>
    </div>
  )
}

function DisciplineCard({ grade, tone }: { grade: Grade; tone?: 'info' | 'danger' }) {
  const passed = grade.status === 'closed' && grade.grade === 'Зачтено'
  const inProgress = grade.status === 'in-progress'
  return (
    <Link
      to={`/grades/${grade.id}`}
      className={cn(
        'card flex items-center gap-3 p-3.5 transition-transform hover:-translate-y-0.5',
        tone === 'info' && 'border-primary/25 bg-info-bg',
        tone === 'danger' && 'border-danger/30 bg-danger-bg',
      )}
    >
      <span
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold',
          inProgress ? 'bg-white text-primary' : gradeCircleClass(grade),
        )}
        aria-hidden
      >
        {inProgress ? subjectIcon(grade.subject) : gradeCircleLabel(grade)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{grade.subject}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted">
          {grade.control} · {grade.teacher}
        </span>
      </span>
      {passed && <span className="shrink-0 text-[11px] font-bold text-ok">Зачтено</span>}
      <ChevronRight size={16} className="shrink-0 text-muted" />
    </Link>
  )
}

function ProgressCard({
  closed,
  total,
  average,
  debts,
}: {
  closed: number
  total: number
  average: number
  debts: number
}) {
  const noDebts = debts === 0
  return (
    <section className="card p-4">
      <h2 className="text-base font-bold">Как у меня дела</h2>
      <div className="mt-3 flex items-center gap-4">
        <CreditsRing closed={closed} total={total} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Средний балл
          </p>
          <p className="mt-1">
            <span className="text-2xl font-extrabold leading-none">{formatGpa(average)}</span>
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted">
            {closed} из {total} зачётных единиц закрыто
          </p>
        </div>
      </div>

      <div
        className={cn(
          'mt-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold leading-snug',
          noDebts ? 'bg-ok-bg text-ok' : 'bg-danger-bg text-danger',
        )}
      >
        <div className="flex items-start gap-2">
          {noDebts ? (
            <CheckCircle2 size={16} className="mt-px shrink-0" aria-hidden />
          ) : (
            <AlertTriangle size={16} className="mt-px shrink-0" aria-hidden />
          )}
          <span className="min-w-0 flex-1">
            {noDebts
              ? 'Долгов нет'
              : `${debts} ${plural(debts, 'долг', 'долга', 'долгов')} · Пересдача в дополнительную сессию`}
          </span>
        </div>

        {!noDebts && (
          <Link
            to="/requests/new?type=r_retake"
            className="btn-danger mt-1.5 w-full px-3 py-2 text-xs"
          >
            Заявление на пересдачу
          </Link>
        )}
      </div>
    </section>
  )
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
    const average = gpa(grades)
    return {
      grades,
      closed,
      inProgress,
      debts,
      totalCredits,
      closedCredits,
      average,
    }
  }, [student])

  if (!student || !stats) return null

  const filtered = stats.grades.filter((g) => {
    if (filter === 'closed') return g.status === 'closed'
    if (filter === 'progress') return g.status === 'in-progress'
    if (filter === 'debt') return g.status === 'debt'
    return true
  })

  const todo = student.deadlines
    .filter((d) => daysUntil(d.at) >= 0)
    .sort((a, b) => +new Date(a.at) - +new Date(b.at))
    .slice(0, 3)

  return (
    <div className="animate-rise">
      <PageHeader
        title="Учёба"
        subtitle={`${student.group} · ${student.course} курс · осень 2026`}
      />

      <div className="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-start min-[900px]:gap-5">
        {/* Правая колонка: главная карточка и дедлайны. На мобильном — сверху */}
        <div className="min-[900px]:order-2 min-[900px]:w-[320px] min-[900px]:shrink-0">
          <div className="space-y-3 min-[900px]:sticky min-[900px]:top-6">
            <ProgressCard
              closed={stats.closedCredits}
              total={stats.totalCredits}
              average={stats.average}
              debts={stats.debts.length}
            />

            <section className="card p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-base font-bold">Нужно сделать</h2>
                <Link
                  to="/deadlines"
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Все дедлайны
                </Link>
              </div>
              {todo.length ? (
                <ul className="space-y-1">
                  {todo.map((d) => {
                    const days = daysUntil(d.at)
                    const urgent = days <= 1
                    return (
                      <li key={d.id}>
                        <Link
                          to="/deadlines"
                          className="-mx-1 flex items-start gap-2 rounded-lg px-1 py-1.5 transition-colors hover:bg-surface-2"
                        >
                          <span
                            className={cn(
                              'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                              urgent ? 'bg-danger' : days <= 3 ? 'bg-warn' : 'bg-border',
                            )}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold leading-tight">
                              {d.title}
                            </span>
                            <span className="mt-0.5 block truncate text-[11px] text-muted">
                              {d.subject} · {formatDate(d.at, { weekday: 'short' })}
                            </span>
                          </span>
                          <span
                            className={cn(
                              'shrink-0 text-[11px] font-bold first-letter:uppercase',
                              urgent ? 'text-danger' : 'text-muted',
                            )}
                          >
                            {deadlineLabel(d.at)}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-[12px] text-muted">Ближайших дедлайнов нет.</p>
              )}
            </section>
          </div>
          {/* Зазор, чтобы плавающая кнопка «Спросить» не накрывала колонку */}
          <div className="hidden min-[900px]:block min-[900px]:h-24" aria-hidden />
        </div>

        {/* Левая колонка: фильтры и дисциплины */}
        <div className="min-w-0 flex-1 min-[900px]:order-1">
          <div className="mb-3">
            <Segmented
              value={filter}
              onChange={setFilter}
              className="flex w-full [&>button]:flex-1 [&>button]:whitespace-nowrap [&>button]:px-1.5"
              options={[
                { value: 'all', label: 'Все' },
                { value: 'progress', label: 'В процессе' },
                { value: 'closed', label: 'Закрытые' },
                { value: 'debt', label: 'Долги' },
              ]}
            />
          </div>

          {filter === 'all' ? (
            <div className="space-y-4">
              {stats.debts.length > 0 && (
                <section>
                  <div className="mb-2 flex items-center gap-2">
                    <h2 className="text-sm font-bold text-danger">Долги</h2>
                  </div>
                  <div className="space-y-2">
                    {stats.debts.map((g) => (
                      <DisciplineCard key={g.id} grade={g} tone="danger" />
                    ))}
                  </div>
                </section>
              )}

              <section>
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-sm font-bold">В процессе</h2>
                </div>
                {stats.inProgress.length ? (
                  <div className="space-y-2">
                    {stats.inProgress.map((g) => (
                      <DisciplineCard key={g.id} grade={g} tone="info" />
                    ))}
                  </div>
                ) : (
                  <p className="card p-4 text-[12px] text-muted">
                    Все дисциплины закрыты — можно отдыхать.
                  </p>
                )}
              </section>

              <section>
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-sm font-bold">Закрытые</h2>
                </div>
                {stats.closed.length ? (
                  <div className="space-y-2">
                    {stats.closed.map((g) => (
                      <DisciplineCard key={g.id} grade={g} />
                    ))}
                  </div>
                ) : (
                  <p className="card p-4 text-[12px] text-muted">Закрытых дисциплин пока нет.</p>
                )}
              </section>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.length ? (
                filtered.map((g) => (
                  <DisciplineCard
                    key={g.id}
                    grade={g}
                    tone={
                      g.status === 'debt' ? 'danger' : g.status === 'in-progress' ? 'info' : undefined
                    }
                  />
                ))
              ) : (
                <div className="card p-6 text-center text-sm text-muted">
                  <CheckCircle2 className="mx-auto mb-2 text-ok" size={22} />
                  В этой категории пусто
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Зазор под плавающую кнопку «Спросить» на телефоне */}
      <div className="h-16 min-[900px]:hidden" aria-hidden />
    </div>
  )
}
