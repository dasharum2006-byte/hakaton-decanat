export type Role = 'student' | 'staff'

export type LessonType =
  | 'Лекция'
  | 'Семинар'
  | 'Лабораторная'
  | 'Практика'
  | 'Консультация'
  | 'Зачёт'
  | 'Экзамен'

export type ChangeKind = 'moved' | 'canceled' | 'substitute'

export interface LessonChange {
  kind: ChangeKind
  note: string
}

export interface Lesson {
  id: string
  /** 1 = понедельник … 7 = воскресенье */
  day: number
  start: string
  end: string
  subject: string
  type: LessonType
  room: string
  teacher: string
  change?: LessonChange
}

export type GradeStatus = 'closed' | 'in-progress' | 'debt'

export interface Grade {
  id: string
  subject: string
  teacher: string
  credits: number
  control: 'Экзамен' | 'Зачёт' | 'Курсовая'
  grade?: string
  score?: number
  status: GradeStatus
  semester: string
}

export interface Deadline {
  id: string
  title: string
  subject: string
  /** ISO строка */
  at: string
  kind: 'контрольная' | 'курсовая' | 'зачёт' | 'экзамен' | 'проект'
}

export interface BaseAccount {
  id: string
  login: string
  /** SHA-256 от пароля — в открытом виде пароли не хранятся */
  passwordHash: string
  role: Role
  name: string
  shortName: string
  email: string
  avatarHue: number
}

export interface Student extends BaseAccount {
  role: 'student'
  faculty: string
  program: string
  course: number
  group: string
  studentCard: string
  curator: string
  admissionYear: number
  schedule: Lesson[]
  grades: Grade[]
  deadlines: Deadline[]
}

export interface Staff extends BaseAccount {
  role: 'staff'
  position: string
  faculty: string
}

export type Account = Student | Staff

export type RequestStatus = 'new' | 'in_progress' | 'signed' | 'ready' | 'rejected'

export interface RequestEvent {
  id: string
  status: RequestStatus
  at: string
  comment: string
}

export interface StudentRequest {
  id: string
  number: string
  typeId: string
  studentId: string
  createdAt: string
  /** Дедлайн обработки в рабочих днях */
  etaDays: number
  fields: Record<string, string>
  status: RequestStatus
  events: RequestEvent[]
  /** Демо-режим: заявка сама проходит статусы, чтобы жюри увидело процесс */
  autoProgress?: boolean
  staffComment?: string
}

export type RequestFieldType = 'text' | 'textarea' | 'select'

export interface RequestField {
  name: string
  label: string
  type: RequestFieldType
  options?: string[]
  placeholder?: string
  required?: boolean
}

export interface RequestType {
  id: string
  title: string
  description: string
  icon: 'file' | 'wallet' | 'calendar' | 'repeat' | 'pause' | 'heart'
  eta: string
  etaDays: number
  fields: RequestField[]
}

export type NotificationKind = 'news' | 'schedule' | 'request' | 'deadline'

export interface AppNotification {
  id: string
  /** id студента или 'all' */
  studentId: string
  kind: NotificationKind
  title: string
  body: string
  at: string
  read: boolean
  href?: string
}
