import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellOff, CheckCheck, CalendarDays, FileText, Megaphone, Timer } from 'lucide-react'
import { useData, notifyKindLabel } from '../lib/store'
import { cn, timeAgo } from '../lib/utils'
import { EmptyState, PageHeader, Segmented } from '../components/ui'

const icons = {
  news: Megaphone,
  schedule: CalendarDays,
  request: FileText,
  deadline: Timer,
} as const

export function Notifications() {
  const { myNotifications, markRead, markAllRead, unreadCount } = useData()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const navigate = useNavigate()

  const list =
    filter === 'unread' ? myNotifications.filter((n) => !n.read) : myNotifications

  const open = (id: string, href?: string) => {
    markRead(id)
    if (href) navigate(href.replace(/^#/, ''))
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Уведомления"
        subtitle={unreadCount ? `Непрочитанных: ${unreadCount}` : 'Всё прочитано'}
        right={
          unreadCount > 0 ? (
            <button className="btn-soft px-3 py-2 text-xs" onClick={markAllRead}>
              <CheckCheck size={15} />
              <span className="hidden sm:inline">Прочитать все</span>
            </button>
          ) : undefined
        }
      />

      <div className="mb-4">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Все' },
            { value: 'unread', label: `Непрочитанные${unreadCount ? ` · ${unreadCount}` : ''}` },
          ]}
        />
      </div>

      {list.length ? (
        <div className="space-y-2">
          {list.map((n) => {
            const Icon = icons[n.kind]
            return (
              <button
                key={n.id}
                onClick={() => open(n.id, n.href)}
                className={cn(
                  'card flex w-full items-start gap-3 p-3.5 text-left transition-transform hover:-translate-y-0.5',
                  !n.read && 'border-primary/30 bg-info-bg/40',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                    n.read ? 'bg-surface-2 text-muted' : 'bg-primary/10 text-primary',
                  )}
                >
                  <Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{n.title}</span>
                    {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-muted">{n.body}</span>
                  <span className="mt-1 block text-[10px] uppercase tracking-wide text-muted">
                    {notifyKindLabel(n.kind)} · {timeAgo(n.at)}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={<BellOff size={22} />}
          title={filter === 'unread' ? 'Непрочитанных нет' : 'Уведомлений пока нет'}
          text="Здесь появятся объявления деканата, изменения в расписании и статусы заявок."
        />
      )}

      <p className="mt-6 flex items-start gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-[11px] leading-relaxed text-muted">
        <Bell size={15} className="mt-0.5 shrink-0 text-primary" />
        Уведомления создаются внутри прототипа. Push-рассылок и внешних сервисов нет —
        ключи и персональные данные не покидают демо.
      </p>
    </div>
  )
}
