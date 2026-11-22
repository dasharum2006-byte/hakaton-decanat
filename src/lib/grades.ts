import type { Grade, Student } from './types'
import { addDays } from './utils'

/** Цвет кружка с оценкой: 5 — зелёный, 4 — синий, 3 — жёлтый, в процессе — серый */
export function gradeCircleClass(g: Grade): string {
  if (g.status === 'in-progress') return 'bg-surface-2 text-muted'
  if (g.status === 'debt') return 'bg-danger-bg text-danger'
  if (g.grade === '5' || g.grade === 'Зачтено') return 'bg-ok-bg text-ok'
  if (g.grade === '4') return 'bg-info-bg text-primary'
  return 'bg-warn-bg text-warn'
}

export function gradeCircleLabel(g: Grade): string {
  if (g.status === 'in-progress') return '…'
  if (g.status === 'debt') return '!'
  if (g.grade === 'Зачтено') return '✓'
  return g.grade ?? '—'
}

export interface ControlWork {
  id: string
  title: string
  at: string
  score: number | null
  max: number
  note?: string
}

export interface AttendanceInfo {
  total: number
  attended: number
  missed: number
  percent: number
}

export interface DisciplineInfo {
  works: ControlWork[]
  attendance: AttendanceInfo
  examAt: string
  examRoom: string
  examPassed: boolean
  teacherRoom: string
  consultation: string
}

const hash = (value: string) => {
  let h = 7
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) % 997
  return h
}

const at = (dayOffset: number, hour: number) => {
  const d = addDays(new Date(), dayOffset)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

const clamp = (value: number, min = 40, max = 100) => Math.min(max, Math.max(min, value))

const CONSULT_DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница']
const CONSULT_SLOTS = [
  ['14:20', '15:50'],
  ['15:50', '17:20'],
  ['16:00', '17:30'],
]

const worksFor = (control: Grade['control']): string[] =>
  control === 'Курсовая'
    ? ['Тема и план', 'Глава 1', 'Глава 2']
    : control === 'Зачёт'
      ? ['Домашняя работа 1', 'Тест 1', 'Лабораторная работа', 'Итоговая контрольная работа']
      : [
          'Домашняя работа 1',
          'Тест 1',
          'Тест 2',
          'Лабораторная работа',
          'Итоговая контрольная работа',
        ]

/**
 * Демо-детализация дисциплины: контрольные, посещаемость и дата экзамена.
 * Значения выводятся детерминированно из оценки — при перезагрузке не меняются.
 */
export function disciplineInfo(student: Student, grade: Grade): DisciplineInfo {
  const h = hash(grade.id)
  const passed = grade.status === 'closed'
  const base =
    grade.status === 'debt'
      ? 55 + (h % 8)
      : (grade.score ?? (grade.grade === '4' ? 78 : grade.grade === '3' ? 66 : 88))

  const titles = worksFor(grade.control)
  const works: ControlWork[] = titles.map((title, i) => {
    const score =
      grade.status === 'in-progress' && i === titles.length - 1
        ? null
        : grade.status === 'in-progress' && i === titles.length - 2
          ? (h + i) % 3 === 0
            ? null
            : clamp(base + (h % 9) - 5 + i * 2)
          : grade.status === 'debt' && i === titles.length - 1
            ? null
            : clamp(base + [-(h % 6) - 2, -(h % 4), (h % 7) - 2, (h % 5) - 1, (h % 8) - 3][i % 5])
    const awaited = score === null && grade.status === 'in-progress'
    return {
      id: `${grade.id}_w${i}`,
      title,
      // сдано — в прошлом, ждёт проверки — вчера, не сдано — дедлайн ещё впереди
      at: score !== null ? at(-(20 - i * 6), 12) : awaited ? at(-1, 12) : at(3 + i, 18),
      score,
      max: 100,
      note: score === null ? (awaited ? 'ждёт проверки' : 'не сдано') : undefined,
    }
  })

  const total = 26 + (h % 8)
  const missed = passed ? 1 + (h % 2) : 2 + (h % 5)
  const attendance: AttendanceInfo = {
    total,
    attended: total - missed,
    missed,
    percent: Math.round(((total - missed) / total) * 100),
  }

  const examDeadline = student.deadlines
    .filter((d) => d.subject === grade.subject && (d.kind === 'экзамен' || d.kind === 'зачёт'))
    .sort((a, b) => +new Date(a.at) - +new Date(b.at))[0]

  const examAt =
    !passed && examDeadline
      ? examDeadline.at
      : passed
        ? at(-(14 + (h % 26)), 10)
        : at(4 + (h % 14), 10)

  const examRoom =
    student.schedule.find((l) => l.subject === grade.subject)?.room ?? `${300 + (h % 99)}`

  const teacherRoom =
    student.schedule.find((l) => l.teacher === grade.teacher)?.room ?? `${200 + (h % 99)}`
  const [consultFrom, consultTo] = CONSULT_SLOTS[h % CONSULT_SLOTS.length]
  const consultation = `${CONSULT_DAYS[h % CONSULT_DAYS.length]}, ${consultFrom}–${consultTo}`

  return {
    works,
    attendance,
    examAt,
    examRoom,
    examPassed: passed,
    teacherRoom,
    consultation,
  }
}
