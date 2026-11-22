import { useMemo } from 'react'
import { MapPin } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { students } from '../data/seed'
import { isoDay, weekParity } from '../lib/utils'
import { LessonTypeBadge, PageHeader } from '../components/ui'
import { SleepingKotik } from '../components/SleepingKotik'
import type { Lesson } from '../lib/types'

interface OwnLesson {
  lesson: Lesson
  group: string
}

/** Приветствие по времени суток */
function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 5) return 'Доброй ночи'
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export function TeacherCabinet() {
  const { teacher } = useAuth()

  /** Все пары преподавателя из расписаний групп (без повторов) */
  const myLessons = useMemo<OwnLesson[]>(() => {
    if (!teacher) return []
    // В расписании преподаватель записан кратко: «Мельник О. В.», поэтому сверяем фамилию
    const surname = teacher.name.split(' ')[0]
    const seen = new Set<string>()
    const list: OwnLesson[] = []
    for (const s of students) {
      for (const lesson of s.schedule) {
        if (!lesson.teacher.startsWith(surname)) continue
        const key = `${s.group}|${lesson.day}|${lesson.start}|${lesson.subject}|${lesson.room}`
        if (seen.has(key)) continue
        seen.add(key)
        list.push({ lesson, group: s.group })
      }
    }
    return list.sort(
      (a, b) => a.lesson.day - b.lesson.day || a.lesson.start.localeCompare(b.lesson.start),
    )
  }, [teacher])

  const today = isoDay()
  const parity = weekParity()
  const todayLessons = myLessons.filter(
    ({ lesson }) => lesson.day === today && (!lesson.parity || lesson.parity === parity),
  )

  if (!teacher) return null

  return (
    <div className="animate-rise">
      <PageHeader title={`${greeting()}, ${teacher.shortName}`} />

      {/* Расписание на сегодня */}
      <section className="mb-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-fg">Сегодня</h2>
        {todayLessons.length ? (
          <div className="space-y-2">
            {todayLessons.map(({ lesson, group }) => (
              <div key={`${group}-${lesson.id}`} className="card flex items-center gap-3 p-3.5">
                <div className="w-16 shrink-0 text-center">
                  <p className="text-base font-bold leading-none">{lesson.start}</p>
                  <p className="mt-1 text-xs text-muted">{lesson.end}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{lesson.subject}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted">
                    <span>{group}</span>
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin size={10} /> ауд. {lesson.room}
                    </span>
                  </p>
                </div>
                <LessonTypeBadge type={lesson.type} />
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-4 text-center">
            <p className="text-sm font-semibold">Сегодня пар нет</p>
            <SleepingKotik className="mt-3 h-[142px]" />
          </div>
        )}
      </section>

    </div>
  )
}
