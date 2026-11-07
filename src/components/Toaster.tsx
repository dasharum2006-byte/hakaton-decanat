import { useEffect, useState } from 'react'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { subscribeToasts, type ToastItem } from '../lib/toast'
import { cn } from '../lib/utils'

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    return subscribeToasts((t) => {
      setItems((prev) => [...prev.slice(-2), t])
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== t.id))
      }, 4800)
    })
  }, [])

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[calc(84px+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:items-end">
      {items.map((t) => {
        const Icon = t.tone === 'success' ? CheckCircle2 : t.tone === 'warn' ? TriangleAlert : Info
        return (
          <div
            key={t.id}
            className={cn(
              'animate-rise pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-surface px-4 py-3 shadow-xl',
              t.tone === 'success' && 'border-ok/30',
              t.tone === 'warn' && 'border-warn/30',
              !t.tone && 'border-border',
            )}
            role="status"
          >
            <Icon
              size={18}
              className={cn(
                'mt-0.5 shrink-0',
                t.tone === 'success' ? 'text-ok' : t.tone === 'warn' ? 'text-warn' : 'text-primary',
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">{t.title}</p>
              {t.body && <p className="mt-0.5 text-xs leading-snug text-muted">{t.body}</p>}
            </div>
            <button
              className="text-muted hover:text-fg"
              onClick={() => setItems((prev) => prev.filter((i) => i.id !== t.id))}
              aria-label="Закрыть уведомление"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
