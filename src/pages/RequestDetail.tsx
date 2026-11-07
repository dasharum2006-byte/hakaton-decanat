import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarClock,
  FileText,
  MapPin,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/store'
import { requestTypes, students } from '../data/seed'
import { formatDate, formatDateTime, plural } from '../lib/utils'
import { Badge, PageHeader, StatusBadge } from '../components/ui'
import { RequestIcon, RequestTimeline } from '../components/request-ui'
import { Forbidden } from './Forbidden'

export function RequestDetail() {
  const { id } = useParams()
  const { account, student } = useAuth()
  const { getRequest, cancelRequest, setStatus } = useData()

  const req = id ? getRequest(id) : undefined

  if (!req) {
    return (
      <div className="card mx-auto mt-6 max-w-md p-6 text-center">
        <FileText className="mx-auto mb-2 text-muted" size={26} />
        <h1 className="text-lg font-bold">Заявка не найдена</h1>
        <p className="mt-1 text-sm text-muted">Возможно, ссылка устарела или заявка была удалена.</p>
        <Link to="/requests" className="btn-primary mt-4">
          К заявкам
        </Link>
      </div>
    )
  }

  const isStaff = account?.role === 'staff'
  if (!isStaff && student && req.studentId !== student.id) {
    return <Forbidden />
  }

  const type = requestTypes.find((t) => t.id === req.typeId)
  const owner = students.find((s) => s.id === req.studentId)
  const etaDate = new Date(new Date(req.createdAt).getTime() + req.etaDays * 86400000).toISOString()
  const inWork = req.status === 'new' || req.status === 'in_progress'
  const statusText =
    req.status === 'ready'
      ? 'Документ готов — можно забирать в кабинете 231'
      : req.status === 'rejected'
        ? req.staffComment ?? 'Заявка отклонена'
        : req.status === 'signed'
          ? 'Подписана, готовится к выдаче'
          : `Ориентировочная готовность: ${formatDate(etaDate, { day: 'numeric', month: 'long' })}`

  return (
    <div className="animate-rise">
      <Link to={isStaff ? '/staff' : '/requests'} className="btn-ghost -ml-2 mb-3">
        <ArrowLeft size={16} />
        {isStaff ? 'Все заявки' : 'Мои заявки'}
      </Link>

      <PageHeader
        title={type?.title ?? 'Заявка'}
        subtitle={`${req.number} · создана ${formatDateTime(req.createdAt)}`}
        right={<StatusBadge status={req.status} />}
      />

      <section className="card mb-3 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-info-bg text-primary">
            {type && <RequestIcon name={type.icon} size={20} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{statusText}</p>
            <p className="mt-0.5 text-[11px] text-muted">
              {req.status === 'ready' || req.status === 'rejected'
                ? 'Заявка завершена'
                : `Срок обработки: ${req.etaDays} ${plural(req.etaDays, 'рабочий день', 'рабочих дня', 'рабочих дней')}`}
            </p>
          </div>
        </div>
        {inWork && (
          <button
            className="btn-soft mt-3 w-full py-2 text-xs text-danger hover:text-danger"
            onClick={() => cancelRequest(req.id)}
          >
            <XCircle size={14} />
            Отменить заявку
          </button>
        )}
      </section>

      {isStaff && owner && (
        <section className="card mb-3 p-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Заявитель
          </p>
          <p className="inline-flex items-center gap-2 text-sm font-semibold">
            <UserRound size={15} className="text-muted" />
            {owner.name}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            {owner.group} · {owner.course} курс · зачётка {owner.studentCard}
          </p>
        </section>
      )}

      <section className="card mb-3 p-4">
        <h2 className="mb-3 text-sm font-bold">Этапы</h2>
        <RequestTimeline events={req.events} current={req.status} />
        {inWork && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-surface-2 px-3 py-2 text-[11px] leading-relaxed text-muted">
            <CalendarClock size={14} className="mt-0.5 shrink-0" />
            В демо статус обновляется автоматически каждые 20 секунд — можно наблюдать,
            не обновляя страницу.
          </p>
        )}
      </section>

      <section className="card mb-3 p-4">
        <h2 className="mb-3 text-sm font-bold">Данные заявки</h2>
        <dl className="space-y-2">
          {type?.fields.map((f) => (
            <div key={f.name} className="flex items-start justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0">
              <dt className="text-[11px] uppercase tracking-wide text-muted">{f.label}</dt>
              <dd className="max-w-[60%] text-right text-sm">
                {req.fields[f.name]?.trim() ? req.fields[f.name] : <span className="text-muted">—</span>}
              </dd>
            </div>
          ))}
          {req.staffComment && (
            <div className="flex items-start justify-between gap-4 border-t border-border pt-2">
              <dt className="text-[11px] uppercase tracking-wide text-muted">Комментарий деканата</dt>
              <dd className="max-w-[60%] text-right text-sm">{req.staffComment}</dd>
            </div>
          )}
        </dl>
      </section>

      <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-ok" />
        <p className="text-[11px] leading-relaxed text-muted">
          Заявка доступна только её автору{isStaff ? ' и сотрудникам деканата' : ''}.
          Если открыть ссылку из другого аккаунта, сервер вернёт отказ.
        </p>
      </div>

      {isStaff && (
        <section className="card mt-3 p-4">
          <h2 className="mb-2 text-sm font-bold">Изменить статус (демо)</h2>
          <p className="mb-2 text-[11px] text-muted">
            В реальном сервисе действия доступны сотрудникам деканата по ролям.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(['in_progress', 'signed', 'ready', 'rejected'] as const).map((s) => (
              <button
                key={s}
                className="chip"
                onClick={() =>
                  setStatus(
                    req.id,
                    s,
                    s === 'ready'
                      ? 'Готова к выдаче, кабинет 231'
                      : s === 'signed'
                        ? 'Подписана у директора'
                        : s === 'rejected'
                          ? 'Не хватает документов'
                          : 'Принята в работу специалистом деканата',
                  )
                }
              >
                {s === 'in_progress' ? 'В работе' : s === 'signed' ? 'Подписана' : s === 'ready' ? 'Готова' : 'Отклонить'}
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="mt-4 flex items-center gap-2 text-[11px] text-muted">
        <MapPin size={13} />
        Выдача документов: кабинет 231, пн–пт 10:00–17:00
      </div>
      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
        <Badge tone="default">{req.number}</Badge>
        <span>— номер для обращения в деканат</span>
      </div>
    </div>
  )
}
