import { Link } from 'react-router-dom'
import { ArrowLeftRight, MapPin, TriangleAlert, UserRound } from 'lucide-react'
import { Badge, LessonTypeBadge } from './ui'
import { cn } from '../lib/utils'
import type { Lesson, LessonType } from '../lib/types'

/** Цвет точки: лекция — насыщенный синий, практика — тёплый оранжевый,
 *  лабораторная — мягкий фиолетовый, семинар — тёмно-синий,
 *  консультация — розовый */
export const typeDot: Record<LessonType, string> = {
  Лекция: 'bg-blue-700 dark:bg-blue-400',
  Практика: 'bg-orange-500',
  Лабораторная: 'bg-violet-400',
  Семинар: 'bg-blue-900 dark:bg-blue-400',
  Консультация: 'bg-pink-500 dark:bg-pink-400',
  Зачёт: 'bg-red-500',
  Экзамен: 'bg-red-500',
}

/** Время занятия в секундах от начала суток */
export const timeToSec = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h * 3600 + m * 60
}

export function LessonCard({
  lesson,
  nowSec,
  passed,
  assessment,
  compact = false,
}: {
  lesson: Lesson
  /** Секунды от начала суток; передаётся только для сегодняшнего дня */
  nowSec?: number
  passed?: boolean
  /** Работа из основной системы: контрольная, тестирование, коллоквиум */
  assessment?: string
  compact?: boolean
}) {
  const canceled = lesson.change?.kind === 'canceled'
  const startSec = timeToSec(lesson.start)
  const endSec = timeToSec(lesson.end)
  const active = nowSec !== undefined && !canceled && nowSec >= startSec && nowSec < endSec
  const progress = active ? Math.min(1, (nowSec - startSec) / (endSec - startSec)) : 0

  return (
    <article
      className={cn(
        'card relative overflow-hidden p-3.5',
        canceled && 'opacity-70',
        passed && !canceled && 'opacity-55',
        active && 'border-primary/35 bg-info-bg',
        compact && 'p-3',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-16 shrink-0 text-center">
          <p className="text-base font-bold leading-none">{lesson.start}</p>
          <p className="mt-1 text-xs text-muted">{lesson.end}</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className={cn('text-sm font-semibold leading-tight', canceled && 'line-through')}>
              {lesson.subject}
            </h3>
            <LessonTypeBadge type={lesson.type} />
            {lesson.change && !canceled && lesson.change.kind === 'substitute' && (
              <Badge tone="warn">
                <ArrowLeftRight size={11} />
                замена
              </Badge>
            )}
            {assessment && (
              <Badge tone="info" className="ml-auto">
                {assessment}
              </Badge>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
            <Link
              to={`/campus?room=${encodeURIComponent(lesson.room)}`}
              className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 transition-colors hover:text-primary"
              aria-label={`Где находится аудитория ${lesson.room}`}
            >
              <MapPin size={12} /> ауд. {lesson.room}
            </Link>
            <span className="inline-flex items-center gap-1">
              <UserRound size={12} /> {lesson.teacher}
            </span>
          </div>
          {lesson.change && (
            <p
              className={cn(
                'mt-2 flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-[11px] leading-snug',
                canceled ? 'bg-danger-bg text-danger' : 'bg-warn-bg text-warn',
              )}
            >
              <TriangleAlert size={12} className="mt-0.5 shrink-0" />
              {canceled ? 'Отменено' : lesson.change.note}
            </p>
          )}
        </div>
      </div>
      {active && (
        <div
          className="absolute inset-x-0 bottom-0 h-1 bg-primary/15"
          role="progressbar"
          aria-label="Пара идёт"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <div
            className="h-full bg-primary-solid transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </article>
  )
}
