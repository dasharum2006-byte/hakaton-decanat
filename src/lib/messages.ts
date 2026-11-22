import { useCallback, useEffect, useState } from 'react'
import { uid } from './utils'

/** Сообщение между студентом и преподавателем */
export interface TeacherMessage {
  id: string
  /** Преподаватель в коротком виде, как в расписании: «Мельник О. В.» */
  teacherName: string
  studentId: string
  subject: string
  from: 'student' | 'teacher'
  text: string
  at: string
  /** Прочитано преподавателем (для бейджа непрочитанных) */
  readByTeacher: boolean
}

const KEY = 'dekanat.messages.v1'
const EVENT = 'dekanat-messages-change'

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()

/** Демо-переписка, чтобы в кабинете преподавателя сразу было что показать */
const DEFAULT_MESSAGES: TeacherMessage[] = [
  {
    id: 'msg_seed_1',
    teacherName: 'Мельник О. В.',
    studentId: 's_anna',
    subject: 'История России',
    from: 'student',
    text: 'Здравствуйте! Подскажите, когда можно пересдать итоговую работу?',
    at: hoursAgo(5),
    readByTeacher: false,
  },
  {
    id: 'msg_seed_2',
    teacherName: 'Мельник О. В.',
    studentId: 's_anna',
    subject: 'История России',
    from: 'teacher',
    text: 'Добрый день! Можно в четверг после пары, аудитория 208.',
    at: hoursAgo(4),
    readByTeacher: true,
  },
  {
    id: 'msg_seed_3',
    teacherName: 'Мельник О. В.',
    studentId: 's_mark',
    subject: 'История России',
    from: 'student',
    text: 'Добрый день! Уточните, пожалуйста, тему для доклада.',
    at: hoursAgo(26),
    readByTeacher: true,
  },
  {
    id: 'msg_seed_4',
    teacherName: 'Гринёв П. С.',
    studentId: 's_anna',
    subject: 'Базы данных',
    from: 'student',
    text: 'Здравствуйте! Можно сдать лабораторную позже срока?',
    at: hoursAgo(2),
    readByTeacher: false,
  },
]

function readAll(): TeacherMessage[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_MESSAGES
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return DEFAULT_MESSAGES
    return list as TeacherMessage[]
  } catch {
    return DEFAULT_MESSAGES
  }
}

function writeAll(list: TeacherMessage[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* переполнение хранилища игнорируем */
  }
  window.dispatchEvent(new Event(EVENT))
}

const surname = (name: string) => name.split(' ')[0]

/** Переписка студента с преподавателями */
export function useMessages() {
  const [messages, setMessages] = useState<TeacherMessage[]>(readAll)

  useEffect(() => {
    const sync = () => setMessages(readAll())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const send = useCallback(
    (input: Omit<TeacherMessage, 'id' | 'at' | 'readByTeacher'>) => {
      const message: TeacherMessage = {
        ...input,
        id: uid('msg'),
        at: new Date().toISOString(),
        readByTeacher: input.from === 'teacher',
      }
      writeAll([...readAll(), message])
      return message
    },
    [],
  )

  const unreadForTeacher = useCallback(
    (teacherName: string) =>
      readAll().filter(
        (m) =>
          m.from === 'student' &&
          !m.readByTeacher &&
          m.teacherName.startsWith(surname(teacherName)),
      ).length,
    [],
  )

  /** Помечает прочитанными все сообщения преподавателя или только одну переписку */
  const markReadForTeacher = useCallback(
    (teacherName: string, studentId?: string, subject?: string) => {
      const prefix = surname(teacherName)
      let changed = false
      const next = readAll().map((m) => {
        if (
          m.from === 'student' &&
          !m.readByTeacher &&
          m.teacherName.startsWith(prefix) &&
          (!studentId || m.studentId === studentId) &&
          (!subject || m.subject === subject)
        ) {
          changed = true
          return { ...m, readByTeacher: true }
        }
        return m
      })
      if (changed) writeAll(next)
    },
    [],
  )

  return { messages, send, unreadForTeacher, markReadForTeacher }
}

/** Сколько непрочитанных сообщений у преподавателя (для бейджа в меню) */
export function countUnreadForTeacher(teacherName: string): number {
  const prefix = teacherName.split(' ')[0]
  return readAll().filter(
    (m) => m.from === 'student' && !m.readByTeacher && m.teacherName.startsWith(prefix),
  ).length
}
