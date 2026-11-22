import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Building2, Search, X } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { cn, isoDay, weekParity } from '../lib/utils'
import {
  CAMPUS,
  CAMPUS_FLOORS,
  findRoom,
  normalizeRoom,
  type CampusRoom,
  type FloorId,
} from '../data/campus'
import { LessonTypeBadge } from '../components/ui'
import { PinchZoom } from '../components/PinchZoom'
import { BackLink } from '../components/BackLink'
import cateat from '../cateat.png'

const KIND_LABEL: Record<NonNullable<CampusRoom['kind']>, string> = {
  canteen: 'Столовая',
  gym: 'Спортзал',
}

export function Campus() {
  const { student } = useAuth()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [debug, setDebug] = useState<{ x: number; y: number } | null>(null)
  const isEdit = params.get('edit') === '1'
  const floorsRef = useRef<HTMLDivElement>(null)
  // Из меню «Карта» кнопка «Назад» не нужна: пользователь пришёл из навигации
  const fromNav = Boolean((location.state as { fromNav?: boolean } | null)?.fromNav)

  const found = findRoom(params.get('room') ?? '')
  const floorParam = Number(params.get('floor'))
  const floorId: FloorId = found
    ? found.floor.id
    : CAMPUS_FLOORS.some((f) => f.id === floorParam)
      ? (floorParam as FloorId)
      : 1
  const floor = CAMPUS_FLOORS.find((f) => f.id === floorId) ?? CAMPUS_FLOORS[0]
  const selected = found && found.floor.id === floor.id ? normalizeRoom(found.room.code) : null

  /** Пары на сегодня (с учётом чётности недели) */
  const todayLessons = useMemo(() => {
    const day = isoDay()
    const parity = weekParity()
    return (student?.schedule ?? []).filter(
      (l) => l.day === day && (!l.parity || l.parity === parity),
    )
  }, [student?.schedule])

  const todayByRoom = useMemo(() => {
    const map = new Map<string, typeof todayLessons>()
    for (const lesson of todayLessons) {
      const code = normalizeRoom(lesson.room)
      const list = map.get(code) ?? []
      list.push(lesson)
      map.set(code, list)
    }
    return map
  }, [todayLessons])

  const selectedRoom = selected ? floor.rooms.find((r) => normalizeRoom(r.code) === selected) : null
  const selectedLessons = selected ? (todayByRoom.get(selected) ?? []) : []

  useEffect(() => {
    const box = floorsRef.current
    const active = box?.querySelector<HTMLButtonElement>('[data-active="true"]')
    active?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
  }, [floor.id])

  function openRoom(code: string) {
    const hit = findRoom(code)
    if (!hit) {
      setNotFound(true)
      return
    }
    setNotFound(false)
    setQuery('')
    setParams({ room: normalizeRoom(hit.room.code), floor: String(hit.floor.id) }, { replace: true })
  }

  function onMapClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!isEdit) {
      // Клик по пустому месту схемы снимает выделение с аудитории
      if (selected) {
        setNotFound(false)
        setParams({ floor: String(floor.id) }, { replace: true })
      }
      return
    }
    const box = e.currentTarget.getBoundingClientRect()
    const x = Number((((e.clientX - box.left) / box.width) * 100).toFixed(1))
    const y = Number((((e.clientY - box.top) / box.height) * 100).toFixed(1))
    setDebug({ x, y })
    // координаты для src/data/campus.ts
    console.log(`{ x: ${x}, y: ${y} }`)
  }

  return (
    <div>
      <header className="mb-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          {!fromNav ? (
            <BackLink fallback="/schedule" className="-ml-2 mb-0!" />
          ) : (
            <span aria-hidden />
          )}
          <form
            className="flex w-[190px] shrink-0 gap-1.5 sm:w-[240px]"
            onSubmit={(e) => {
              e.preventDefault()
              openRoom(query)
            }}
          >
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Номер аудитории</span>
              <Search
                size={15}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                className="input px-2 py-1.5 pl-7 text-[13px]"
                placeholder="Аудитория: 401"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setNotFound(false)
                }}
                inputMode="text"
                autoComplete="off"
              />
            </label>
            <button
              type="submit"
              className="btn-primary shrink-0 px-2.5 py-1.5"
              aria-label="Найти аудиторию"
            >
              <Search size={15} />
            </button>
          </form>
        </div>

        <div className="min-w-0">
          <h1 className="text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">Карта корпусов</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] font-medium text-fg/80">
            <span className="inline-flex items-center gap-1">
              <Building2 size={13} /> {CAMPUS.building}
            </span>
            <span className="text-fg/30" aria-hidden>
              ·
            </span>
            <span>{CAMPUS.address}</span>
          </p>
        </div>

      </header>

      {notFound && (
        <p className="mb-3 flex items-center gap-1.5 text-[12px] text-danger">
          <X size={13} /> Такой аудитории нет на карте. Попробуй номер из расписания.
        </p>
      )}

      {/* Этажи */}
      <div className="mb-3">
        <div ref={floorsRef} className="flex gap-1.5 overflow-x-auto pb-1 [mask-image:linear-gradient(90deg,transparent,black_10px,black_calc(100%-10px),transparent)]">
        {CAMPUS_FLOORS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setNotFound(false)
              setParams({ floor: String(f.id) }, { replace: true })
            }}
            data-active={f.id === floor.id}
            className={cn(
              'shrink-0 rounded-full border px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors',
              f.id === floor.id
                ? 'border-primary/30 bg-info-bg text-primary'
                : 'border-border bg-surface text-muted hover:text-fg',
            )}
            aria-pressed={f.id === floor.id}
          >
            {f.title}
          </button>
        ))}
        </div>

      </div>

      {/* Схема этажа */}
      <PinchZoom className="card p-1.5">
        <div className="relative mx-auto w-[92%] select-none" onClick={onMapClick}>
          <img
            src={floor.image}
            alt={`Схема: ${CAMPUS.building}, ${floor.title}`}
            className="block w-full rounded-xl"
            draggable={false}
          />
          {floor.rooms.map((room) => {
            const code = normalizeRoom(room.code)
            const isSelected = selected === code
            const hasToday = todayByRoom.has(code)
            return (
              <button
                key={room.code}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (isEdit) return
                  openRoom(room.code)
                }}
                aria-pressed={isSelected}
                aria-label={`${room.kind ? KIND_LABEL[room.kind] : 'Аудитория'} ${room.code}${
                  hasToday ? ', сегодня есть пары' : ''
                }`}
                style={{
                  left: `${room.x}%`,
                  top: `${room.y}%`,
                  width: `${room.w}%`,
                  height: `${room.h}%`,
                }}
                className={cn(
                  'absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/20 ring-4 ring-primary/15'
                    : 'border-transparent hover:border-primary/40 hover:bg-primary/10',
                )}
              >
                {hasToday && (
                  <span
                    className="pointer-events-none absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-white/70"
                    aria-hidden
                  />
                )}
              </button>
            )
          })}
          {isEdit && debug && (
            <span
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-mono text-white"
              style={{ left: `${debug.x}%`, top: `${debug.y}%` }}
            >
              {debug.x}, {debug.y}
            </span>
          )}
        </div>
      </PinchZoom>

      {isEdit && (
        <p className="mt-2 rounded-xl bg-warn-bg px-3 py-2 text-[11px] leading-snug text-warn">
          Режим подгонки: клик по карте печатает <code>x, y</code> в консоль — вставь значения в
          <code> src/data/campus.ts</code>. Убери <code>?edit=1</code>, когда закончишь.
        </p>
      )}

      {/* Легенда */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden /> есть пары сегодня
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded border-2 border-primary bg-primary/20" aria-hidden />
          выбрано
        </span>
      </div>

      {/* Пары в выбранной аудитории */}
      {selectedRoom && (
        <section className="mt-4">
          <div className="card p-4">
            {selectedLessons.length > 0 ? (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Сегодня в этой аудитории
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {selectedLessons.map((l) => (
                    <li key={l.id} className="flex items-center gap-2 text-[13px]">
                      <span className="font-mono text-[12px] font-semibold tabular-nums">
                        {l.start}–{l.end}
                      </span>
                      <span className="truncate font-medium">{l.subject}</span>
                      <LessonTypeBadge type={l.type} />
                    </li>
                  ))}
                </ul>
              </>
            ) : selectedRoom.kind === 'canteen' ? (
              <div className="flex items-center justify-center gap-2">
                <p className="shrink-0 text-[13px] font-semibold leading-snug text-primary">
                  Приятного аппетита
                </p>
                <img
                  src={cateat}
                  alt="В столовой сегодня пар нет — котик ест"
                  className="block h-[120px] w-auto max-w-full translate-x-2"
                  draggable={false}
                />
              </div>
            ) : (
              <p className="text-[13px] text-muted">Сегодня в этой аудитории пар нет.</p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
