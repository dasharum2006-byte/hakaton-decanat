import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Clock, Inbox, Search } from 'lucide-react'
import { useData } from '../lib/store'
import { requestTypes, students } from '../data/seed'
import { cn, timeAgo } from '../lib/utils'
import { PageHeader, Segmented, StatusBadge } from '../components/ui'
import { RequestIcon } from '../components/request-ui'
import type { RequestStatus } from '../lib/types'

type Filter = 'all' | 'new' | 'in_progress' | 'ready'

export function StaffDashboard() {
  const { requests, setStatus } = useData()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const sorted = useMemo(
    () => [...requests].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [requests],
  )

  const counts = useMemo(
    () => ({
      new: requests.filter((r) => r.status === 'new').length,
      in_progress: requests.filter((r) => r.status === 'in_progress').length,
      signed: requests.filter((r) => r.status === 'signed').length,
      ready: requests.filter((r) => r.status === 'ready').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
    }),
    [requests],
  )

  const list = sorted.filter((r) => {
    if (filter === 'new' && r.status !== 'new') return false
    if (filter === 'in_progress' && r.status !== 'in_progress' && r.status !== 'signed') return false
    if (filter === 'ready' && r.status !== 'ready') return false
    if (query) {
      const owner = students.find((s) => s.id === r.studentId)
      const haystack = `${r.number} ${owner?.name ?? ''} ${owner?.group ?? ''}`.toLowerCase()
      if (!haystack.includes(query.toLowerCase())) return false
    }
    return true
  })

  const nextAction: Partial<Record<RequestStatus, { label: string; next: RequestStatus; comment: string }>> = {
    new: { label: 'Взять в работу', next: 'in_progress', comment: 'Принята в работу специалистом деканата' },
    in_progress: { label: 'Подписать', next: 'signed', comment: 'Подписана у директора института' },
    signed: { label: 'Готово к выдаче', next: 'ready', comment: 'Готова к выдаче, кабинет 231' },
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Заявки студентов"
        
        
      />

      <section className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat icon={<Inbox size={15} />} label="Новые" value={counts.new} tone="info" />
        <Stat icon={<Clock size={15} />} label="В работе" value={counts.in_progress + counts.signed} tone="warn" />
        <Stat icon={<CheckCircle2 size={15} />} label="Готовы" value={counts.ready} tone="ok" />
        <Stat icon={<ArrowRight size={15} />} label="Отклонены" value={counts.rejected} tone="danger" />
      </section>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Все' },
            { value: 'new', label: `Новые${counts.new ? ` · ${counts.new}` : ''}` },
            { value: 'in_progress', label: 'В работе' },
            { value: 'ready', label: 'Готовые' },
          ]}
        />
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-9"
            placeholder="Номер или студент"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Поиск заявок"
          />
        </div>
      </div>

      <div className="space-y-2">
        {list.length ? (
          list.map((r) => {
            const type = requestTypes.find((t) => t.id === r.typeId)
            const owner = students.find((s) => s.id === r.studentId)
            const action = nextAction[r.status]
            return (
              <article key={r.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-primary">
                    {type && <RequestIcon name={type.icon} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{type?.title ?? 'Заявка'}</p>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {r.number} · {timeAgo(r.createdAt)}
                    </p>
                    <p className="mt-1 text-[12px] font-medium">
                      {owner?.name} <span className="text-muted">· {owner?.group}</span>
                    </p>
                  </div>
                  <Link
                    to={`/requests/${r.id}`}
                    className="btn-ghost shrink-0 px-2 py-1 text-[11px]"
                    aria-label="Открыть заявку"
                  >
                    Открыть <ArrowRight size={13} />
                  </Link>
                </div>
                {action && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
                    <button
                      className="btn-primary px-3 py-2 text-xs"
                      onClick={() => setStatus(r.id, action.next, action.comment)}
                    >
                      {action.label}
                    </button>
                    {r.status !== 'ready' && (
                      <button
                        className="btn-soft px-3 py-2 text-xs text-danger hover:text-danger"
                        onClick={() => setStatus(r.id, 'rejected', 'Не хватает документов — свяжитесь с деканатом')}
                      >
                        Отклонить
                      </button>
                    )}
                  </div>
                )}
              </article>
            )
          })
        ) : (
          <div className="card p-8 text-center text-sm text-muted">Заявок по этому фильтру нет</div>
        )}
      </div>

     
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: 'info' | 'warn' | 'ok' | 'danger'
}) {
  const tones = {
    info: 'bg-info-bg text-primary',
    warn: 'bg-warn-bg text-warn',
    ok: 'bg-ok-bg text-ok',
    danger: 'bg-danger-bg text-danger',
  }
  return (
    <div className="card p-3.5">
      <span className={cn('inline-flex h-7 w-7 items-center justify-center rounded-full', tones[tone])}>
        {icon}
      </span>
      <p className="mt-1.5 text-2xl font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
    </div>
  )
}
