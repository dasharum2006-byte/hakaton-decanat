import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const DAY_NAMES = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
]

export const DAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

/** 1 = понедельник … 7 = воскресенье */
export function isoDay(date = new Date()): number {
  const d = date.getDay()
  return d === 0 ? 7 : d
}

export function startOfWeek(date = new Date()): Date {
  const d = new Date(date)
  const diff = isoDay(d) - 1
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function fromMinutes(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function formatDate(iso: string | Date, opts: Intl.DateTimeFormatOptions = {}) {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', ...opts })
}

export function formatDateTime(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

/** «5 минут назад», «вчера», «3 дня назад» */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return 'только что'
  if (min < 60) return `${min} ${plural(min, 'минуту', 'минуты', 'минут')} назад`
  const hours = Math.round(min / 60)
  if (hours < 24) return `${hours} ${plural(hours, 'час', 'часа', 'часов')} назад`
  const days = Math.round(hours / 24)
  if (days === 1) return 'вчера'
  if (days < 7) return `${days} ${plural(days, 'день', 'дня', 'дней')} назад`
  return formatDate(iso)
}

/** «через 2 дня», «завтра», «сегодня» */
export function timeUntil(iso: string): string {
  const target = new Date(iso)
  const now = new Date()
  const diffMs = target.getTime() - now.getTime()
  const days = Math.ceil(diffMs / 86400000)
  if (diffMs < 0) return 'просрочено'
  if (days <= 1) {
    const hours = Math.ceil(diffMs / 3600000)
    if (hours <= 1) return 'меньше часа'
    if (hours < 24) return `через ${hours} ${plural(hours, 'час', 'часа', 'часов')}`
    return 'завтра'
  }
  if (days < 7) return `через ${days} ${plural(days, 'день', 'дня', 'дней')}`
  return formatDate(iso)
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function avatarStyle(hue: number) {
  return {
    background: `linear-gradient(135deg, hsl(${hue} 78% 58%), hsl(${(hue + 40) % 360} 82% 52%))`,
  }
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export function formatGpa(value: number): string {
  return value.toFixed(2).replace('.', ',')
}
