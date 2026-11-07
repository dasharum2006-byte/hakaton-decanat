import type { Deadline, Grade, Lesson, Student, StudentRequest } from './types'
import { DAY_NAMES, formatDate, fromMinutes, isoDay, plural, toMinutes } from './utils'

export interface AssistantCtx {
  student: Student
  requests: StudentRequest[]
}

export interface AssistantReply {
  text: string
  chips?: string[]
}

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е')

const has = (text: string, ...words: string[]) => words.some((w) => text.includes(w))

function lessonLine(l: Lesson): string {
  const change = l.change
    ? l.change.kind === 'canceled'
      ? ` ⛔ отменено (${l.change.note})`
      : l.change.kind === 'moved'
        ? ` ⚠️ перенос (${l.change.note})`
        : ` ⚠️ замена (${l.change.note})`
    : ''
  return `• ${l.start}–${l.end} · ${l.subject} (${l.type.toLowerCase()}) · ауд. ${l.room} · ${l.teacher}${change}`
}

function lessonsText(lessons: Lesson[], emptyText: string): string {
  if (!lessons.length) return emptyText
  return lessons
    .slice()
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
    .map(lessonLine)
    .join('\n')
}

function lessonsForDay(student: Student, day: number): Lesson[] {
  return student.schedule.filter((l) => l.day === day)
}

function nextLesson(student: Student): { lesson: Lesson; dayOffset: number } | null {
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const today = isoDay(now)
  const todayLessons = lessonsForDay(student, today)
    .filter((l) => toMinutes(l.end) > nowMin)
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
  if (todayLessons.length) return { lesson: todayLessons[0], dayOffset: 0 }
  for (let offset = 1; offset <= 7; offset++) {
    const day = ((today - 1 + offset) % 7) + 1
    const list = lessonsForDay(student, day)
      .filter((l) => !l.change || l.change.kind !== 'canceled')
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
    if (list.length) return { lesson: list[0], dayOffset: offset }
  }
  return null
}

function freeWindows(lessons: Lesson[]): string[] {
  const sorted = lessons
    .filter((l) => !l.change || l.change.kind !== 'canceled')
    .slice()
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
  if (!sorted.length) return ['весь день свободен']
  const windows: string[] = []
  let cursor = toMinutes(sorted[0].start)
  for (const l of sorted) {
    const start = toMinutes(l.start)
    if (start - cursor >= 30) windows.push(`${fromMinutes(cursor)}–${fromMinutes(start)}`)
    cursor = Math.max(cursor, toMinutes(l.end))
  }
  if (17 * 60 + 30 - cursor >= 30) windows.push(`${fromMinutes(cursor)}–17:30`)
  return windows
}

function averageScore(grades: Grade[]): number {
  const scored = grades.filter((g) => g.status === 'closed' && g.score)
  if (!scored.length) return 0
  return scored.reduce((sum, g) => sum + (g.score ?? 0), 0) / scored.length
}

function gradeValue(g: Grade): number {
  if (g.score) return g.score >= 85 ? 5 : g.score >= 70 ? 4 : 3
  if (g.grade === '5') return 5
  if (g.grade === '4') return 4
  if (g.grade === '3') return 3
  return 0
}

function gpa(grades: Grade[]): number {
  const graded = grades.filter((g) => g.status === 'closed' && gradeValue(g) > 0)
  if (!graded.length) return 0
  const total = graded.reduce((s, g) => s + gradeValue(g) * g.credits, 0)
  const credits = graded.reduce((s, g) => s + g.credits, 0)
  return total / credits
}

function deadlinesText(deadlines: Deadline[]): string {
  const upcoming = deadlines
    .filter((d) => new Date(d.at).getTime() > Date.now())
    .sort((a, b) => +new Date(a.at) - +new Date(b.at))
    .slice(0, 4)
  if (!upcoming.length) return 'Ближайших дедлайнов нет — можно выдохнуть 🎉'
  return upcoming
    .map((d) => `• ${d.title} — ${formatDate(d.at, { weekday: 'short' })}, до ${d.at.slice(11, 16)}`)
    .join('\n')
}

function activeRequestsText(requests: StudentRequest[]): string {
  const active = requests.filter((r) => r.status !== 'rejected' && r.status !== 'ready')
  if (!active.length) return 'Активных заявок нет. Могу помочь создать новую — просто скажите «заказать справку».'
  const statusLabel: Record<string, string> = {
    new: 'создана',
    in_progress: 'в работе',
    signed: 'подписана',
  }
  return active
    .map((r) => `• ${r.number} — ${statusLabel[r.status] ?? r.status}`)
    .join('\n')
}

const REQUEST_HINTS: { keys: string[]; typeId: string; title: string }[] = [
  { keys: ['об обучении', 'обучени', 'военкомат', 'студенческий'], typeId: 'r_edu', title: 'справку об обучении' },
  { keys: ['стипенди', 'соцстипенд'], typeId: 'r_scholarship', title: 'справку о стипендии' },
  { keys: ['сесси', 'вызов'], typeId: 'r_session', title: 'вызов на сессию' },
  { keys: ['пересдач', 'пересдать'], typeId: 'r_retake', title: 'заявление на пересдачу' },
  { keys: ['академ', 'отпуск'], typeId: 'r_academic', title: 'заявление на академический отпуск' },
  { keys: ['соц', 'социальн'], typeId: 'r_social', title: 'справку для соцстипендии' },
]

export function assistantReply(input: string, ctx: AssistantCtx): AssistantReply {
  const text = norm(input.trim())
  const { student, requests } = ctx

  if (!text) return { text: 'Напишите вопрос — например, «что у меня сегодня?»', chips: [] }

  // Приветствие
  if (has(text, 'привет', 'здравствуй', 'хай', 'добрый день', 'доброе утро')) {
    return {
      text: `Привет, ${student.shortName}! Я помощник деканата. Знаю ваше расписание, оценки и заявки — спрашивайте.\n\nНапример: «что сегодня?», «когда окна?», «мои долги».`,
      chips: ['Что сегодня?', 'Когда окна?', 'Мои долги', 'Заказать справку'],
    }
  }

  // Что умеешь
  if (has(text, 'что умеешь', 'помощь', 'help', 'команды')) {
    return {
      text: 'Я умею:\n• показывать расписание на сегодня, завтра и неделю;\n• находить окна между парами;\n• рассказывать про оценки, долги и средний балл;\n• напоминать о дедлайнах;\n• создавать заявки на справки и заявления;\n• показывать статусы ваших заявок.\n\nПросто напишите вопрос своими словами.',
      chips: ['Что сегодня?', 'Мои оценки', 'Мои заявки', 'Заказать справку'],
    }
  }

  // Создание заявки
  if (has(text, 'закаж', 'заказать', 'созда', 'оформ', 'нужна справка', 'нужен вызов', 'подать')) {
    const hint = REQUEST_HINTS.find((h) => h.keys.some((k) => text.includes(k)))
    if (hint) {
      return {
        text: `Могу оформить ${hint.title}. Проверьте данные в форме — займёт меньше минуты, а статус будет виден здесь же.`,
        chips: [`create:${hint.typeId}`, 'Мои заявки', 'Отмена'],
      }
    }
    return {
      text: 'Что нужно оформить? Выберите — или напишите своими словами.',
      chips: [
        'create:r_edu',
        'create:r_scholarship',
        'create:r_session',
        'create:r_retake',
      ],
    }
  }

  // Статусы заявок
  if (has(text, 'статус', 'мои заявки', 'заявк', 'справка готова', 'готов ли')) {
    return {
      text: `Ваши активные заявки:\n${activeRequestsText(requests)}`,
      chips: ['Открыть заявки', 'Заказать справку'],
    }
  }

  // Окна
  if (has(text, 'окн', 'свободн', 'перерыв', 'между пар')) {
    const day = has(text, 'завтра') ? (isoDay() % 7) + 1 : isoDay()
    const lessons = lessonsForDay(student, day)
    const windows = freeWindows(lessons)
    const dayLabel = day === isoDay() ? 'Сегодня' : DAY_NAMES[day === 7 ? 0 : day]
    return {
      text: `${dayLabel} свободные окна: ${windows.join(', ')}.\n\n${lessonsText(lessons, 'Занятий нет.')}`,
      chips: ['Что сегодня?', 'Мои заявки'],
    }
  }

  // Расписание на сегодня
  if (has(text, 'сегодня', 'сейчас', 'что у меня') && !has(text, 'завтра', 'недел')) {
    const lessons = lessonsForDay(student, isoDay())
    const next = nextLesson(student)
    const nextText =
      next && next.dayOffset === 0
        ? `\n\nБлижайшее: ${next.lesson.subject} в ${next.lesson.start}, ауд. ${next.lesson.room}.`
        : ''
    return {
      text: `Сегодня, ${DAY_NAMES[isoDay() === 7 ? 0 : isoDay()].toLowerCase()}:\n${lessonsText(lessons, 'Пар нет — свободный день 🎉')}${nextText}`,
      chips: ['Когда окна?', 'Что завтра?', 'Мои долги'],
    }
  }

  // Расписание на завтра
  if (has(text, 'завтра')) {
    const day = (isoDay() % 7) + 1
    const lessons = lessonsForDay(student, day)
    return {
      text: `Завтра, ${DAY_NAMES[day === 7 ? 0 : day].toLowerCase()}:\n${lessonsText(lessons, 'Пар нет — можно посвятить день себе 🎉')}`,
      chips: ['Что сегодня?', 'Когда окна?'],
    }
  }

  // Следующая пара
  if (has(text, 'следующ', 'ближайш', 'скоро пара', 'сколько до пары')) {
    const next = nextLesson(student)
    if (!next) return { text: 'В ближайшие дни занятий нет.', chips: ['Что сегодня?'] }
    const dayText =
      next.dayOffset === 0 ? 'сегодня' : next.dayOffset === 1 ? 'завтра' : DAY_NAMES[next.lesson.day === 7 ? 0 : next.lesson.day].toLowerCase()
    return {
      text: `Следующая пара ${dayText}: ${next.lesson.subject}, ${next.lesson.start}–${next.lesson.end}, ауд. ${next.lesson.room}, ${next.lesson.teacher}.`,
      chips: ['Что сегодня?', 'Когда окна?'],
    }
  }

  // Долги
  if (has(text, 'долг', 'хвост', 'пересдач', 'не сдал')) {
    const debts = student.grades.filter((g) => g.status === 'debt')
    if (!debts.length) {
      return {
        text: 'Долгов нет — красота! Все дисциплины закрыты или в процессе.',
        chips: ['Мои оценки', 'Что сдать?'],
      }
    }
    return {
      text: `Долги (${debts.length}):\n${debts.map((g) => `• ${g.subject} — ${g.control.toLowerCase()}, ${g.credits} з.е.`).join('\n')}\n\nМогу сразу оформить заявление на пересдачу.`,
      chips: ['create:r_retake', 'Мои оценки'],
    }
  }

  // Оценки
  if (has(text, 'оценк', 'успева', 'средн', 'балл', 'зачет', 'зачёт', 'сесси', 'стипенди')) {
    const closed = student.grades.filter((g) => g.status === 'closed')
    const debts = student.grades.filter((g) => g.status === 'debt')
    const inProgress = student.grades.filter((g) => g.status === 'in-progress')
    const gpaValue = gpa(student.grades)
    return {
      text: `Успеваемость:\n• Средний балл: ${gpaValue.toFixed(2).replace('.', ',')}\n• Закрыто дисциплин: ${closed.length} из ${student.grades.length}\n• В процессе: ${inProgress.length}\n• Долгов: ${debts.length}\n\n${debts.length ? `Обратите внимание: ${debts.map((g) => g.subject).join(', ')}.` : 'Всё идёт по плану.'}`,
      chips: debts.length ? ['Мои долги', 'Что сдать?'] : ['Что сдать?', 'Мои заявки'],
    }
  }

  // Дедлайны
  if (has(text, 'дедлайн', 'сдать', 'когда сдавать', 'что сдать', 'курсов')) {
    return {
      text: `Ближайшие дедлайны:\n${deadlinesText(student.deadlines)}`,
      chips: ['Мои оценки', 'Мои заявки'],
    }
  }

  // Конкретный предмет / аудитория
  for (const lesson of student.schedule) {
    const subject = norm(lesson.subject)
    if (subject.length > 4 && text.includes(subject.split(' ')[0])) {
      const week = student.schedule
        .filter((l) => norm(l.subject).includes(subject.split(' ')[0]))
        .sort((a, b) => a.day - b.day || toMinutes(a.start) - toMinutes(b.start))
      return {
        text: `${lesson.subject} на этой неделе:\n${lessonsText(week, 'В расписании нет.')}`,
        chips: ['Что сегодня?', 'Когда окна?'],
      }
    }
  }

  // Сколько пар / нагрузка
  if (has(text, 'сколько пар', 'нагрузк', 'сколько занят')) {
    const week = student.schedule.filter((l) => !l.change || l.change.kind !== 'canceled')
    return {
      text: `На этой неделе ${week.length} ${plural(week.length, 'пара', 'пары', 'пар')}. Сегодня — ${lessonsForDay(student, isoDay()).length}.`,
      chips: ['Что сегодня?', 'Когда окна?'],
    }
  }

  // Fallback
  return {
    text: 'Пока не понял вопрос. Я лучше всего отвечаю про расписание, оценки, долги, дедлайны и заявки. Попробуйте так:',
    chips: ['Что сегодня?', 'Когда окна?', 'Мои оценки', 'Мои заявки'],
  }
}

export { gpa, averageScore }
