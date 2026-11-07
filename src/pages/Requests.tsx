import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, FilePlus2, Inbox, Sparkles } from 'lucide-react'
import { useData } from '../lib/store'
import { requestTypes } from '../data/seed'
import { formatDate, timeAgo, timeUntil } from '../lib/utils'
import { EmptyState, PageHeader, Segmented, StatusBadge } from '../components/ui'
import { RequestIcon, StageBar } from '../components/request-ui'

type Filter = 'active' | 'all' | 'done'

export function Requests() {
  const { myRequests } = useData()
  const [filter, setFilter] = useState<Filter>('active')

  const list = useMemo(() => {
    if (filter === 'active')
      return myRequests.filter((r) => r.status !== 'ready' && r.status !== 'rejected')
    if (filter === 'done') return myRequests.filter((r) => r.status === 'ready' || r.status === 'rejected')
    return myRequests
  }, [myRequests, filter])

  const activeCount = myRequests.filter((r) => r.status !== 'ready' && r.status !== 'rejected').length

  return (
    <div className="animate-rise">
      <PageHeader
        title="Заявки и справки"
        subtitle="Справки, вызовы и заявления — без очередей в деканат"
        right={
          <Link to="/requests/new" className="btn-primary px-3 py-2 text-xs sm:text-sm">
            <FilePlus2 size={16} />
            <span className="hidden sm:inline">Новая заявка</span>
            <span className="sm:hidden">Создать</span>
          </Link>
        }
      />

      <div className="mb-3 flex items-center justify-between gap-2">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'active', label: `Активные${activeCount ? ` · ${activeCount}` : ''}` },
            { value: 'all', label: 'Все' },
            { value: 'done', label: 'Завершённые' },
          ]}
        />
      </div>

      {list.length ? (
        <div className="mb-7 space-y-2.5">
          {list.map((r) => {
            const type = requestTypes.find((t) => t.id === r.typeId)
            return (
              <Link
                key={r.id}
                to={`/requests/${r.id}`}
                className="card block p-4 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info-bg text-primary">
                    {type && <RequestIcon name={type.icon} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{type?.title ?? 'Заявка'}</p>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {r.number} · создана {timeAgo(r.createdAt)}
                    </p>
                  </div>
                  <ArrowRight size={16} className="mt-2 shrink-0 text-muted" />
                </div>
                <div className="mt-3">
                  <StageBar status={r.status} />
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted">
                    <span>
                      {r.status === 'ready'
                        ? 'Можно забирать в каб. 231'
                        : r.status === 'rejected'
                          ? r.staffComment ?? 'Отклонена'
                          : `Готовность: ${timeUntil(new Date(new Date(r.createdAt).getTime() + r.etaDays * 86400000).toISOString())}`}
                    </span>
                    <span>{formatDate(new Date(new Date(r.createdAt).getTime() + r.etaDays * 86400000).toISOString(), { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="mb-7">
          <EmptyState
            icon={<Inbox size={22} />}
            title={filter === 'active' ? 'Активных заявок нет' : 'Здесь пока пусто'}
            text={
              filter === 'active'
                ? 'Справка об обучении оформляется за пару минут — и сразу видно статус.'
                : 'Создайте первую заявку — она появится здесь со статусом и таймлайном.'
            }
            action={
              <Link to="/requests/new" className="btn-primary">
                Создать заявку
              </Link>
            }
          />
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Что можно заказать</h2>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted">
          <Sparkles size={12} /> без очереди
        </span>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {requestTypes.map((t) => (
          <Link
            key={t.id}
            to={`/requests/new?type=${t.id}`}
            className="card flex items-start gap-3 p-4 transition-transform hover:-translate-y-0.5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-primary">
              <RequestIcon name={t.icon} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">{t.title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted">{t.description}</p>
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {t.eta}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-6 rounded-2xl border border-border bg-surface px-4 py-3 text-[11px] leading-relaxed text-muted">
        <span className="font-semibold text-fg">Демо-режим.</span> Новая заявка автоматически
        проходит статусы за минуту, чтобы был виден процесс. В реальном сервисе статусы
        меняет сотрудник деканата.
      </p>
    </div>
  )
}
