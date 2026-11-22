import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/utils'

const MIN_SCALE = 1
const MAX_SCALE = 3
/** Порог, после которого жест считается «перетаскиванием», а не кликом */
const DRAG_THRESHOLD = 8

/**
 * Масштабирование схемы двумя пальцами (pinch-to-zoom) и перетаскивание при увеличении.
 * Одинарный тап по элементам внутри остаётся обычным кликом.
 */
export function PinchZoom({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)

  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; scale: number; midX: number; midY: number; ox: number; oy: number } | null>(null)
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const moved = useRef(false)
  const scaleRef = useRef(1)

  useEffect(() => {
    scaleRef.current = scale
  }, [scale])

  useEffect(() => {
    const clampOffset = (x: number, y: number, s: number) => {
      const host = hostRef.current
      if (!host) return { x, y }
      const limitX = (host.clientWidth * (s - 1)) / 2
      const limitY = (host.clientHeight * (s - 1)) / 2
      return {
        x: Math.min(limitX, Math.max(-limitX, x)),
        y: Math.min(limitY, Math.max(-limitY, y)),
      }
    }

    const onMove = (e: PointerEvent) => {
      const point = pointers.current.get(e.pointerId)
      if (!point) return
      point.x = e.clientX
      point.y = e.clientY

      if (pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()]
        const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1
        const midX = (a.x + b.x) / 2
        const midY = (a.y + b.y) / 2
        if (!pinch.current) return
        const nextScale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, (pinch.current.scale * dist) / pinch.current.dist),
        )
        setScale(nextScale)
        setOffset(
          clampOffset(
            pinch.current.ox + (midX - pinch.current.midX),
            pinch.current.oy + (midY - pinch.current.midY),
            nextScale,
          ),
        )
        moved.current = true
        return
      }

      if (drag.current && scaleRef.current > 1) {
        const dx = e.clientX - drag.current.x
        const dy = e.clientY - drag.current.y
        if (Math.hypot(dx, dy) > DRAG_THRESHOLD) moved.current = true
        setOffset(
          clampOffset(drag.current.ox + dx, drag.current.oy + dy, scaleRef.current),
        )
      }
    }

    const onUp = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId)
      if (pointers.current.size < 2) pinch.current = null
      if (pointers.current.size === 0) {
        drag.current = null
        setDragging(false)
        if (scaleRef.current <= 1.02) {
          setScale(1)
          setOffset({ x: 0, y: 0 })
        }
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  const reset = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  return (
    <div
      ref={hostRef}
      className={cn('relative overflow-hidden', className)}
      style={{ touchAction: scale > 1 ? 'none' : 'pan-y' }}
    >
      <div
        ref={contentRef}
        className="select-none"
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
          transformOrigin: 'center center',
          transition: dragging ? 'none' : 'transform 120ms ease-out',
          willChange: 'transform',
        }}
        onPointerDown={(e) => {
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
          if (pointers.current.size >= 2) {
            const [a, b] = [...pointers.current.values()]
            pinch.current = {
              dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
              scale,
              midX: (a.x + b.x) / 2,
              midY: (a.y + b.y) / 2,
              ox: offset.x,
              oy: offset.y,
            }
            moved.current = true
            setDragging(true)
          } else {
            drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
            moved.current = false
            if (scale > 1) setDragging(true)
          }
        }}
        onClickCapture={(e) => {
          // После жеста не считаем отпускание пальца кликом по аудитории
          if (moved.current) {
            e.preventDefault()
            e.stopPropagation()
            moved.current = false
          }
        }}
      >
        {children}
      </div>

      {scale > 1 && (
        <button
          type="button"
          onClick={reset}
          className="absolute right-2 top-2 rounded-full border border-border bg-surface/90 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-sm backdrop-blur"
        >
          Сбросить масштаб
        </button>
      )}
    </div>
  )
}
