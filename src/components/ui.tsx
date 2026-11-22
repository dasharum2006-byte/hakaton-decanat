import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn, avatarStyle, initials } from '../lib/utils'
import { REQUEST_STATUS_META, useData } from '../lib/store'
import type { LessonType, RequestStatus } from '../lib/types'

export type Tone = 'default' | 'info' | 'ok' | 'warn' | 'danger'

/** Красочный бейдж типа занятия */
const lessonTypeClasses: Record<LessonType, string> = {
  Лекция: 'bg-blue-700 text-white border-blue-700 dark:bg-blue-400 dark:text-blue-950 dark:border-blue-400',
  Практика: 'bg-orange-500 text-white border-orange-500',
  Лабораторная: 'bg-violet-400 text-white border-violet-400',
  Семинар: 'bg-blue-900 text-white border-blue-900 dark:bg-blue-400 dark:text-blue-950 dark:border-blue-400',
  Консультация: 'bg-pink-500 text-white border-pink-500 dark:bg-pink-400 dark:text-pink-950 dark:border-pink-400',
  Зачёт: 'bg-red-500 text-white border-red-500',
  Экзамен: 'bg-red-500 text-white border-red-500',
}

const toneClasses: Record<Tone, string> = {
  default: 'bg-surface-2 text-muted border-border',
  info: 'bg-info-bg text-primary border-primary/20',
  ok: 'bg-ok-bg text-ok border-ok/25',
  warn: 'bg-warn-bg text-warn border-warn/25',
  danger: 'bg-danger-bg text-danger border-danger/25',
}

export function Badge({
  children,
  tone = 'default',
  className,
  icon,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
  icon?: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none',
        toneClasses[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}

export function LessonTypeBadge({ type }: { type: LessonType }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none',
        lessonTypeClasses[type],
      )}
    >
      {type}
    </span>
  )
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  const meta = REQUEST_STATUS_META[status]
  return <Badge tone={meta.tone}>{meta.label}</Badge>
}

export function Avatar({
  name,
  hue = 250,
  size = 'md',
  className,
  src,
}: {
  name: string
  hue?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Пользовательская иконка (data-URL PNG) вместо инициалов */
  src?: string | null
}) {
  const sizes = {
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-16 w-16 text-xl',
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white shadow-sm',
        sizes[size],
        className,
      )}
      style={avatarStyle(hue)}
      aria-hidden
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
      ) : (
        initials(name)
      )}
    </span>
  )
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}

export function Section({
  title,
  action,
  children,
  className,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('mb-6', className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon?: ReactNode
  title: string
  text?: string
  action?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
      {icon && (
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted">
          {icon}
        </div>
      )}
      <p className="font-semibold">{title}</p>
      {text && <p className="max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function ProgressBar({
  value,
  tone = 'primary',
  className,
  trackClassName,
}: {
  value: number
  tone?: 'primary' | 'ok' | 'warn' | 'danger'
  className?: string
  /** Класс фона «дорожки» (по умолчанию светло-серый) */
  trackClassName?: string
}) {
  const colors: Record<string, string> = {
    primary: 'bg-primary',
    ok: 'bg-ok',
    warn: 'bg-warn',
    danger: 'bg-danger',
  }
  return (
    <div
      className={cn(
        'h-2 w-full overflow-hidden rounded-full',
        trackClassName ?? 'bg-surface-2',
        className,
      )}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-500', colors[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex rounded-xl border border-border bg-surface-2 p-1',
        className,
      )}
      role="tablist"
    >
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
            value === o.value
              ? 'bg-surface text-fg shadow-sm'
              : 'text-muted hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Закрыть"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-pop relative z-10 flex max-h-[90dvh] w-full flex-col rounded-t-3xl bg-surface shadow-2xl sm:max-w-lg sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <h2 className="text-base font-bold">{title}</h2>
          <button className="btn-ghost -mr-2 px-2 py-1" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-border px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/** Демо-счётчик уведомлений хранится в store, здесь только хелпер */
export function UnreadDot({ className }: { className?: string }) {
  const { unreadCount } = useData()
  if (!unreadCount) return null
  return (
    <span
      className={cn(
        'absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white',
        className,
      )}
    >
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )
}
