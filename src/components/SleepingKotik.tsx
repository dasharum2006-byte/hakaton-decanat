import { useEffect, useState } from 'react'
import { cn } from '../lib/utils'
import sleep1 from '../sleepkotik1.png'
import sleep2 from '../sleepkotik2.png'
import sleep3 from '../sleep.png'

/**
 * Кадры анимации «котик спит».
 * hold — сколько кадр держится до плавного перехода к следующему.
 * Порядок: 1 → 2 → 3 → 2 → 1 → снова 1 и по кругу, каждый кадр по 1 секунде.
 */
const FRAMES: { src: string; hold: number }[] = [
  { src: sleep1, hold: 1000 },
  { src: sleep2, hold: 1000 },
  { src: sleep3, hold: 1000 },
  { src: sleep2, hold: 1000 },
  { src: sleep1, hold: 1000 },
]

const SOURCES = [...new Set(FRAMES.map((f) => f.src))]

/** Плавная анимация спящего котика для пустых состояний расписания. */
export function SleepingKotik({ className }: { className?: string }) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const id = window.setTimeout(
      () => setFrame((f) => (f + 1) % FRAMES.length),
      FRAMES[frame].hold,
    )
    return () => window.clearTimeout(id)
  }, [frame])

  return (
    <div className={cn('relative mx-auto w-full', className)} aria-hidden>
      {SOURCES.map((src) => {
        const active = FRAMES[frame].src === src
        return (
          <img
            key={src}
            src={src}
            alt=""
            draggable={false}
            className={cn(
              'absolute left-1/2 top-0 h-full w-auto max-w-none -translate-x-1/2 select-none',
              'transition-opacity duration-300 ease-in-out',
              active ? 'opacity-100' : 'opacity-0',
            )}
          />
        )
      })}
    </div>
  )
}
