import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellOff, CheckCheck, CalendarDays, FileText, Megaphone, Timer } from 'lucide-react'
import { useData, notifyKindLabel } from '../lib/store'
import { cn, timeAgo } from '../lib/utils'
import { EmptyState, PageHeader, Segmented } from '../components/ui'

const icons = {
  news: Megaphone,
  schedule: CalendarDays,
  request: FileText,
  deadline: Timer,
} as const

type Accent = 'move' | 'cancel' | 'deadline' | 'default'

/** Цвет уведомления: перенос — жёлтый, отмена — красный, дедлайн — красная линия слева */
function accentFor(n: { kind: string; title: string }): Accent {
  if (n.kind === 'deadline') return 'deadline'
  if (n.kind === 'schedule') {
    if (/отмен/i.test(n.title)) return 'cancel'
    if (/перенос|замен/i.test(n.title)) return 'move'
  }
  return 'default'
}

/** Классы для карточки уведомления по его типу */
const accentCard: Record<Accent, string> = {
  move: 'border-warn/30 bg-warn-bg',
  cancel: 'border-danger/30 bg-danger-bg',
  deadline: 'border-l-4 border-l-danger',
  default: '',
}

/** Классы для кружка с иконкой */
const accentDot: Record<Accent, string> = {
  move: 'bg-warn-bg text-warn',
  cancel: 'bg-danger-bg text-danger',
  deadline: 'bg-danger-bg text-danger',
  default: '',
}

/** Цвет подписи с типом уведомления */
const accentLabel: Record<Accent, string> = {
  move: 'text-warn',
  cancel: 'text-danger',
  deadline: 'text-danger',
  default: '',
}

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
            const accent = accentFor(n)
            return (
              <button
                key={n.id}
                onClick={() => open(n.id, n.href)}
                className={cn(
                  'card flex w-full items-start gap-3 p-3.5 text-left transition-transform hover:-translate-y-0.5',
                  accentCard[accent],
                  !n.read && accent === 'default' && 'border-primary/40 bg-primary/15',
                  !n.read && 'ring-1 ring-primary/20',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    accent !== 'default'
                      ? accentDot[accent]
                      : n.read
                        ? 'bg-surface-2 text-muted'
                        : 'bg-primary/10 text-primary',
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
                  <span
                    className={cn(
                      'mt-1 block text-[10px] uppercase tracking-wide',
                      accentLabel[accent] || 'text-muted',
                    )}
                  >
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

    </div>
  )
}
