import {
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Heart,
  Inbox,
  PauseCircle,
  PenLine,
  RotateCcw,
  Wallet,
  XCircle,
} from 'lucide-react'
import { cn, formatDateTime } from '../lib/utils'
import { REQUEST_STATUS_META } from '../lib/store'
import type { RequestStatus, RequestType } from '../lib/types'

const icons = {
  file: FileText,
  wallet: Wallet,
  calendar: CalendarDays,
  repeat: RotateCcw,
  pause: PauseCircle,
  heart: Heart,
} as const

export function RequestIcon({ name, size = 18 }: { name: RequestType['icon']; size?: number }) {
  const Icon = icons[name] ?? FileText
  return <Icon size={size} />
}

const statusIcons = {
  new: Inbox,
  in_progress: Clock,
  signed: PenLine,
  ready: CheckCircle2,
  rejected: XCircle,
} as const

export function RequestStatusIcon({ status, size = 14 }: { status: RequestStatus; size?: number }) {
  const Icon = statusIcons[status]
  return <Icon size={size} />
}

export function RequestTimeline({
  events,
  current,
}: {
  events: { id: string; status: RequestStatus; at: string; comment: string }[]
  current: RequestStatus
}) {
  const order: RequestStatus[] = ['new', 'in_progress', 'signed', 'ready']
  const isRejected = current === 'rejected'

  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {events.map((e, i) => {
        const meta = REQUEST_STATUS_META[e.status]
        const active = i === events.length - 1
        const stepIndex = order.indexOf(e.status)
        return (
          <li key={e.id} className="relative">
            <span
              className={cn(
                'absolute -left-[30px] flex h-5 w-5 items-center justify-center rounded-full border-2',
                active
                  ? e.status === 'rejected'
                    ? 'border-danger bg-danger-bg text-danger'
                    : 'border-primary bg-primary text-primary-fg'
                  : 'border-border bg-surface text-muted',
              )}
            >
              <RequestStatusIcon status={e.status} size={11} />
            </span>
            <div className={cn('flex flex-wrap items-center gap-2', !active && 'opacity-70')}>
              <p className="text-sm font-semibold">{meta.label}</p>
              {active && !isRejected && stepIndex >= 0 && (
                <span className="rounded-full bg-info-bg px-2 py-0.5 text-[10px] font-semibold text-primary">
                  текущий статус
                </span>
              )}
            </div>
            <p className={cn('text-[12px] leading-snug', active ? 'text-fg' : 'text-muted')}>
              {e.comment}
            </p>
            <p className="mt-0.5 text-[10px] text-muted">{formatDateTime(e.at)}</p>
          </li>
        )
      })}
    </ol>
  )
}

export function StageBar({ status }: { status: RequestStatus }) {
  const order: RequestStatus[] = ['new', 'in_progress', 'signed', 'ready']
  const idx = order.indexOf(status)
  const rejected = status === 'rejected'
  return (
    <div className="flex gap-1" aria-hidden>
      {order.map((s, i) => (
        <div
          key={s}
          className={cn(
            'h-1.5 flex-1 rounded-full',
            rejected
              ? i === 0
                ? 'bg-danger'
                : 'bg-surface-2'
              : i <= idx
                ? 'bg-primary'
                : 'bg-surface-2',
          )}
        />
      ))}
    </div>
  )
}
