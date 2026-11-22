import { Info } from 'lucide-react'
import { cn } from '../lib/utils'

export const CONCEPT_STRIP_TEXT =
  'Концепт для конкурса · Не официальный сервис вуза · Данные вымышленные'

/** Узкая полоска-дисклеймер для низа страниц. */
export function ConceptStrip({ className }: { className?: string }) {
  return (
    <div className={cn(className)}>
      <p className="mx-auto w-full max-w-3xl px-4 py-2 text-center text-[11px] font-medium leading-snug text-primary sm:px-5">
        {CONCEPT_STRIP_TEXT}
      </p>
    </div>
  )
}

/** Заметная плашка-дисклеймер для страницы входа. */
export function ConceptBanner() {
  return (
    <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-primary/30 bg-info-bg px-3.5 py-3 text-left">
      <Info size={18} className="mt-px shrink-0 text-primary" aria-hidden />
      <p className="text-[13px] font-semibold leading-snug text-fg">
        Концепт для конкурса, не официальный сервис вуза. Все данные вымышленные.
      </p>
    </div>
  )
}
