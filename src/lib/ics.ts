/** Экранирование значений в iCalendar */
const esc = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/[,;]/g, (m) => `\\${m}`)
    .replace(/\r?\n/g, '\\n')

/** 2026-11-10T07:00:00.000Z → 20261110T070000Z */
const icsDate = (date: Date) =>
  date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

export interface CalendarEvent {
  subject: string
  title: string
  room: string
  teacher: string
  at: string
  durationMinutes?: number
}

/**
 * Скачивает событие дисциплины файлом .ics — его можно открыть
 * в календаре на телефоне или компьютере.
 */
export function downloadCalendarEvent(event: CalendarEvent) {
  const start = new Date(event.at)
  const end = new Date(start.getTime() + (event.durationMinutes ?? 90) * 60_000)
  const fileName = `${event.subject.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')}.ics`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dekanat+//Ucheba//RU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${start.getTime()}-${Math.random().toString(36).slice(2, 8)}@dekanat.plus`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${esc(event.title)}`,
    `LOCATION:${esc(`ауд. ${event.room}`)}`,
    `DESCRIPTION:${esc(`${event.subject} · ${event.teacher} · Деканат+`)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(event.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  const blob = new Blob([`${lines.join('\r\n')}\r\n`], {
    type: 'text/calendar;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)

  return fileName
}
