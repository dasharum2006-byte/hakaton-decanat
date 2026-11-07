import type {
  AppNotification,
  Deadline,
  Grade,
  Lesson,
  RequestType,
  Staff,
  Student,
  StudentRequest,
} from '../lib/types'
import { isoDay, uid } from '../lib/utils'

const now = new Date()

const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString()
const hoursAgo = (h: number) => minutesAgo(h * 60)
const daysAgo = (d: number) => minutesAgo(d * 60 * 24)
const inDays = (d: number, hour = 18) => {
  const date = new Date(now)
  date.setDate(date.getDate() + d)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

export const DEMO_PASSWORD = 'demo1234'
export const STAFF_PASSWORD = 'staff1234'

/** SHA-256 от demo1234 / staff1234 — пароли не хранятся в открытом виде */
const STUDENT_HASH =
  '0ead2060b65992dca4769af601a1b3a35ef38cfad2c2c465bb160ea764157c5d'
const STAFF_HASH =
  '02defbfb8190f9d0719ef7a23da2049bd2e61442bc14021a6d8a4ae35ca334b7'

const L = (
  id: string,
  day: number,
  start: string,
  end: string,
  subject: string,
  type: Lesson['type'],
  room: string,
  teacher: string,
  change?: Lesson['change'],
): Lesson => ({ id, day, start, end, subject, type, room, teacher, change })

// ────────────────────────── Анна: группа ИВТ-23-1 ──────────────────────────

const annaSchedule: Lesson[] = [
  L('a1', 1, '09:00', '10:30', 'Математический анализ', 'Лекция', '412', 'Белова Е. А.'),
  L('a2', 1, '10:40', '12:10', 'Базы данных', 'Лабораторная', '305', 'Гринёв П. С.'),
  L('a3', 1, '12:40', '14:10', 'Философия', 'Семинар', '208', 'Мельник О. В.'),
  L('a4', 2, '09:00', '10:30', 'Компьютерные сети', 'Лекция', '401', 'Зотов А. Р.'),
  L('a5', 2, '10:40', '12:10', 'Компьютерные сети', 'Лабораторная', '310', 'Зотов А. Р.', {
    kind: 'substitute',
    note: 'Замена: занятие проведёт Ким И. П.',
  }),
  L('a6', 2, '12:40', '14:10', 'Физическая культура', 'Практика', 'Спортзал 2', 'Гусев Д. Н.'),
  L('a7', 3, '10:40', '12:10', 'Программирование на Kotlin', 'Лекция', '305', 'Романов К. И.'),
  L('a8', 3, '12:40', '14:10', 'Программирование на Kotlin', 'Лабораторная', '306', 'Романов К. И.'),
  L('a9', 3, '14:20', '15:50', 'Проектная деятельность', 'Практика', 'Коворкинг', 'Орлов С. А.'),
  L('a10', 4, '09:00', '10:30', 'Математический анализ', 'Практика', '412', 'Белова Е. А.'),
  L('a11', 4, '10:40', '12:10', 'Базы данных', 'Лекция', '412', 'Гринёв П. С.', {
    kind: 'moved',
    note: 'Перенос: вместо 401 аудитории — 412',
  }),
  L('a12', 4, '12:40', '14:10', 'Английский язык', 'Практика', '117', 'Смит Дж.'),
  L('a13', 5, '09:00', '10:30', 'Физика', 'Лекция', '210', 'Дьяконов В. В.'),
  L('a14', 5, '10:40', '12:10', 'Физика', 'Лабораторная', '112', 'Дьяконов В. В.'),
  L('a15', 5, '12:40', '14:10', 'История России', 'Семинар', '208', 'Мельник О. В.'),
  L('a16', 6, '10:40', '12:10', 'Проектная деятельность', 'Практика', '305', 'Орлов С. А.'),
  L('a17', 6, '12:40', '14:10', 'Физическая культура', 'Практика', 'Спортзал 2', 'Гусев Д. Н.', {
    kind: 'canceled',
    note: 'Отменено: самостоятельная подготовка',
  }),
]

const annaGrades: Grade[] = [
  { id: 'g1', subject: 'Математический анализ', teacher: 'Белова Е. А.', credits: 5, control: 'Экзамен', grade: '5', score: 92, status: 'closed', semester: 'Осень 2026' },
  { id: 'g2', subject: 'Базы данных', teacher: 'Гринёв П. С.', credits: 4, control: 'Экзамен', grade: '5', score: 88, status: 'closed', semester: 'Осень 2026' },
  { id: 'g3', subject: 'Программирование на Kotlin', teacher: 'Романов К. И.', credits: 4, control: 'Зачёт', grade: 'Зачтено', status: 'closed', semester: 'Осень 2026' },
  { id: 'g4', subject: 'Компьютерные сети', teacher: 'Зотов А. Р.', credits: 4, control: 'Экзамен', grade: '4', score: 78, status: 'closed', semester: 'Осень 2026' },
  { id: 'g5', subject: 'Физика', teacher: 'Дьяконов В. В.', credits: 3, control: 'Зачёт', grade: 'Зачтено', status: 'closed', semester: 'Осень 2026' },
  { id: 'g6', subject: 'Философия', teacher: 'Мельник О. В.', credits: 2, control: 'Зачёт', grade: 'Зачтено', status: 'closed', semester: 'Осень 2026' },
  { id: 'g7', subject: 'История России', teacher: 'Мельник О. В.', credits: 2, control: 'Зачёт', status: 'in-progress', semester: 'Осень 2026' },
  { id: 'g8', subject: 'Проектная деятельность', teacher: 'Орлов С. А.', credits: 5, control: 'Зачёт', status: 'in-progress', semester: 'Осень 2026' },
  { id: 'g9', subject: 'Курсовая работа', teacher: 'Романов К. И.', credits: 5, control: 'Курсовая', status: 'in-progress', semester: 'Осень 2026' },
]

const annaDeadlines: Deadline[] = [
  { id: 'd1', title: 'Курсовая: глава 2', subject: 'Курсовая работа', at: inDays(3, 18), kind: 'курсовая' },
  { id: 'd2', title: 'Контрольная по матанализу', subject: 'Математический анализ', at: inDays(5, 10), kind: 'контрольная' },
  { id: 'd3', title: 'Защита проекта', subject: 'Проектная деятельность', at: inDays(9, 14), kind: 'проект' },
  { id: 'd4', title: 'Зачёт по истории', subject: 'История России', at: inDays(14, 10), kind: 'зачёт' },
  { id: 'd5', title: 'Экзамен: базы данных', subject: 'Базы данных', at: inDays(18, 9), kind: 'экзамен' },
]

// ────────────────────────── Марк: группа ПИ-24-2 ──────────────────────────

const markSchedule: Lesson[] = [
  L('m1', 1, '12:40', '14:10', 'Алгебра и геометрия', 'Лекция', '318', 'Тарасов И. И.'),
  L('m2', 1, '14:20', '15:50', 'Основы программирования', 'Лабораторная', '309', 'Романов К. И.'),
  L('m3', 2, '09:00', '10:30', 'Дискретная математика', 'Лекция', '318', 'Тарасов И. И.'),
  L('m4', 2, '10:40', '12:10', 'Английский язык', 'Практика', '117', 'Смит Дж.'),
  L('m5', 2, '12:40', '14:10', 'Физическая культура', 'Практика', 'Спортзал 1', 'Гусев Д. Н.'),
  L('m6', 3, '09:00', '10:30', 'Основы программирования', 'Лекция', '309', 'Романов К. И.'),
  L('m7', 3, '10:40', '12:10', 'История России', 'Семинар', '208', 'Мельник О. В.'),
  L('m8', 4, '12:40', '14:10', 'Алгебра и геометрия', 'Практика', '318', 'Тарасов И. И.'),
  L('m9', 4, '14:20', '15:50', 'Дискретная математика', 'Семинар', '318', 'Тарасов И. И.', {
    kind: 'moved',
    note: 'Перенос: занятие начнётся в 15:00',
  }),
  L('m10', 5, '09:00', '10:30', 'Web-технологии', 'Лекция', '305', 'Орлов С. А.'),
  L('m11', 5, '10:40', '12:10', 'Web-технологии', 'Лабораторная', '306', 'Орлов С. А.'),
  L('m12', 5, '12:40', '14:10', 'Физика', 'Лекция', '210', 'Дьяконов В. В.'),
  L('m13', 6, '10:40', '12:10', 'Курсовая работа', 'Консультация', '305', 'Орлов С. А.'),
]

const markGrades: Grade[] = [
  { id: 'mg1', subject: 'Алгебра и геометрия', teacher: 'Тарасов И. И.', credits: 4, control: 'Экзамен', grade: '4', score: 71, status: 'closed', semester: 'Осень 2026' },
  { id: 'mg2', subject: 'Основы программирования', teacher: 'Романов К. И.', credits: 4, control: 'Экзамен', grade: '5', score: 86, status: 'closed', semester: 'Осень 2026' },
  { id: 'mg3', subject: 'История России', teacher: 'Мельник О. В.', credits: 2, control: 'Зачёт', grade: 'Зачтено', status: 'closed', semester: 'Осень 2026' },
  { id: 'mg4', subject: 'Web-технологии', teacher: 'Орлов С. А.', credits: 4, control: 'Зачёт', status: 'in-progress', semester: 'Осень 2026' },
  { id: 'mg5', subject: 'Физика', teacher: 'Дьяконов В. В.', credits: 3, control: 'Зачёт', status: 'in-progress', semester: 'Осень 2026' },
  { id: 'mg6', subject: 'Дискретная математика', teacher: 'Тарасов И. И.', credits: 4, control: 'Экзамен', status: 'debt', semester: 'Осень 2026' },
  { id: 'mg7', subject: 'Курсовая работа', teacher: 'Орлов С. А.', credits: 5, control: 'Курсовая', status: 'in-progress', semester: 'Осень 2026' },
]

const markDeadlines: Deadline[] = [
  { id: 'md1', title: 'Курсовая: черновик', subject: 'Курсовая работа', at: inDays(2, 18), kind: 'курсовая' },
  { id: 'md2', title: 'Пересдача дискретной математики', subject: 'Дискретная математика', at: inDays(6, 11), kind: 'экзамен' },
  { id: 'md3', title: 'Лабораторная №4', subject: 'Web-технологии', at: inDays(4, 23), kind: 'контрольная' },
  { id: 'md4', title: 'Зачёт по физике', subject: 'Физика', at: inDays(12, 10), kind: 'зачёт' },
]

// ────────────────────────── Аккаунты ──────────────────────────

export const students: Student[] = [
  {
    id: 's_anna',
    login: 'anna',
    passwordHash: STUDENT_HASH,
    role: 'student',
    name: 'Соколова Анна Дмитриевна',
    shortName: 'Анна',
    email: 'a.sokolova@student.example.edu',
    avatarHue: 252,
    faculty: 'Институт цифровых технологий',
    program: '09.03.01 «Информатика и вычислительная техника»',
    course: 3,
    group: 'ИВТ-23-1',
    studentCard: '23-ИВТ-0417',
    curator: 'Ким Ирина Павловна',
    admissionYear: 2023,
    schedule: annaSchedule,
    grades: annaGrades,
    deadlines: annaDeadlines,
  },
  {
    id: 's_mark',
    login: 'mark',
    passwordHash: STUDENT_HASH,
    role: 'student',
    name: 'Ветров Марк Сергеевич',
    shortName: 'Марк',
    email: 'm.vetrov@student.example.edu',
    avatarHue: 18,
    faculty: 'Институт цифровых технологий',
    program: '09.03.02 «Программная инженерия»',
    course: 2,
    group: 'ПИ-24-2',
    studentCard: '24-ПИ-0158',
    curator: 'Орлов Сергей Андреевич',
    admissionYear: 2024,
    schedule: markSchedule,
    grades: markGrades,
    deadlines: markDeadlines,
  },
]

export const staff: Staff[] = [
  {
    id: 'st_1',
    login: 'dekanat',
    passwordHash: STAFF_HASH,
    role: 'staff',
    name: 'Ким Ирина Павловна',
    shortName: 'Ирина',
    email: 'i.kim@example.edu',
    avatarHue: 152,
    position: 'Специалист деканата',
    faculty: 'Институт цифровых технологий',
  },
]

export const accounts = [...students, ...staff]

// ────────────────────────── Заявки ──────────────────────────

export const requestTypes: RequestType[] = [
  {
    id: 'r_edu',
    title: 'Справка об обучении',
    description: 'Подтверждает, что вы учитесь: для военкомата, банка или по месту требования.',
    icon: 'file',
    eta: '1 рабочий день',
    etaDays: 1,
    fields: [
      { name: 'purpose', label: 'Куда нужна справка', type: 'select', options: ['По месту требования', 'Военкомат', 'Банк', 'Работодатель'], required: true },
      { name: 'form', label: 'Форма', type: 'select', options: ['Стандартная', 'С печатью и подписью', 'На английском языке'], required: true },
      { name: 'comment', label: 'Комментарий (необязательно)', type: 'textarea', placeholder: 'Например: нужен оригинал с синей печатью' },
    ],
  },
  {
    id: 'r_scholarship',
    title: 'Справка о стипендии',
    description: 'Сумма и период выплат — для соцподдержки, банка или налогового вычета.',
    icon: 'wallet',
    eta: '2 рабочих дня',
    etaDays: 2,
    fields: [
      { name: 'period', label: 'Период', type: 'select', options: ['Текущий семестр', 'Последние 6 месяцев', 'Последние 12 месяцев'], required: true },
      { name: 'purpose', label: 'Куда', type: 'select', options: ['По месту требования', 'Банк', 'Соцзащита'], required: true },
      { name: 'comment', label: 'Комментарий (необязательно)', type: 'textarea' },
    ],
  },
  {
    id: 'r_session',
    title: 'Вызов на сессию',
    description: 'Официальный вызов с датами сессии — для работодателя или по месту требования.',
    icon: 'calendar',
    eta: '2 рабочих дня',
    etaDays: 2,
    fields: [
      { name: 'purpose', label: 'Куда', type: 'select', options: ['Работодатель', 'По месту требования'], required: true },
      { name: 'delivery', label: 'Как получить', type: 'select', options: ['Электронно (PDF)', 'Бумажный оригинал'], required: true },
      { name: 'comment', label: 'Комментарий (необязательно)', type: 'textarea' },
    ],
  },
  {
    id: 'r_retake',
    title: 'Заявление на пересдачу',
    description: 'Запись на пересдачу зачёта или экзамена в дополнительную сессию.',
    icon: 'repeat',
    eta: '3 рабочих дня',
    etaDays: 3,
    fields: [
      { name: 'subject', label: 'Дисциплина', type: 'select', options: ['Дискретная математика', 'История России', 'Физика', 'Web-технологии'], required: true },
      { name: 'teacher', label: 'Преподаватель', type: 'select', options: ['Тарасов И. И.', 'Мельник О. В.', 'Дьяконов В. В.', 'Орлов С. А.'], required: true },
      { name: 'reason', label: 'Причина', type: 'textarea', placeholder: 'Коротко опишите ситуацию', required: true },
    ],
  },
  {
    id: 'r_academic',
    title: 'Академический отпуск',
    description: 'Заявление на академический отпуск по медицинским или семейным обстоятельствам.',
    icon: 'pause',
    eta: '5 рабочих дней',
    etaDays: 5,
    fields: [
      { name: 'reason', label: 'Основание', type: 'select', options: ['Медицинские показания', 'Семейные обстоятельства'], required: true },
      { name: 'period', label: 'Период', type: 'select', options: ['1 семестр', '1 год'], required: true },
      { name: 'comment', label: 'Комментарий', type: 'textarea', placeholder: 'Документы приложите в деканате' },
    ],
  },
  {
    id: 'r_social',
    title: 'Справка для соцстипендии',
    description: 'Подтверждение статуса студента для оформления социальной стипендии.',
    icon: 'heart',
    eta: '2 рабочих дня',
    etaDays: 2,
    fields: [
      { name: 'purpose', label: 'Куда', type: 'select', options: ['Соцзащита', 'По месту требования'], required: true },
      { name: 'comment', label: 'Комментарий (необязательно)', type: 'textarea' },
    ],
  },
]

export function requestTypeById(id: string): RequestType | undefined {
  return requestTypes.find((t) => t.id === id)
}

export const initialRequests: StudentRequest[] = [
  {
    id: 'req_1001',
    number: 'Д-2026-1001',
    typeId: 'r_edu',
    studentId: 's_anna',
    createdAt: daysAgo(2),
    etaDays: 1,
    fields: { purpose: 'Военкомат', form: 'С печатью и подписью', comment: 'Нужен оригинал' },
    status: 'ready',
    staffComment: 'Справка подписана, можно забрать в каб. 231',
    events: [
      { id: uid('ev'), status: 'new', at: daysAgo(2), comment: 'Заявка создана' },
      { id: uid('ev'), status: 'in_progress', at: daysAgo(2), comment: 'Принята в работу специалистом' },
      { id: uid('ev'), status: 'signed', at: daysAgo(1), comment: 'Подписана у директора' },
      { id: uid('ev'), status: 'ready', at: hoursAgo(4), comment: 'Готова к выдаче, каб. 231' },
    ],
  },
  {
    id: 'req_1002',
    number: 'Д-2026-1002',
    typeId: 'r_session',
    studentId: 's_anna',
    createdAt: hoursAgo(20),
    etaDays: 2,
    fields: { purpose: 'Работодатель', delivery: 'Электронно (PDF)' },
    status: 'in_progress',
    events: [
      { id: uid('ev'), status: 'new', at: hoursAgo(20), comment: 'Заявка создана' },
      { id: uid('ev'), status: 'in_progress', at: hoursAgo(18), comment: 'Принята в работу специалистом' },
    ],
  },
  {
    id: 'req_2001',
    number: 'Д-2026-2001',
    typeId: 'r_retake',
    studentId: 's_mark',
    createdAt: daysAgo(1),
    etaDays: 3,
    fields: { subject: 'Дискретная математика', teacher: 'Тарасов И. И.', reason: 'Не сдал в основную сессию по болезни' },
    status: 'signed',
    events: [
      { id: uid('ev'), status: 'new', at: daysAgo(1), comment: 'Заявка создана' },
      { id: uid('ev'), status: 'in_progress', at: daysAgo(1), comment: 'Принята в работу специалистом' },
      { id: uid('ev'), status: 'signed', at: hoursAgo(6), comment: 'Согласовано с преподавателем' },
    ],
  },
  {
    id: 'req_2003',
    number: 'Д-2026-2003',
    typeId: 'r_session',
    studentId: 's_mark',
    createdAt: hoursAgo(2),
    etaDays: 2,
    fields: { purpose: 'Работодатель', delivery: 'Электронно (PDF)' },
    status: 'new',
    events: [
      { id: uid('ev'), status: 'new', at: hoursAgo(2), comment: 'Заявка создана' },
    ],
  },
  {
    id: 'req_2002',
    number: 'Д-2026-2002',
    typeId: 'r_social',
    studentId: 's_mark',
    createdAt: daysAgo(6),
    etaDays: 2,
    fields: { purpose: 'Соцзащита' },
    status: 'rejected',
    staffComment: 'Не хватает копии паспорта — создайте заявку заново с документом',
    events: [
      { id: uid('ev'), status: 'new', at: daysAgo(6), comment: 'Заявка создана' },
      { id: uid('ev'), status: 'in_progress', at: daysAgo(6), comment: 'Принята в работу специалистом' },
      { id: uid('ev'), status: 'rejected', at: daysAgo(5), comment: 'Не хватает документов' },
    ],
  },
]

// ────────────────────────── Уведомления ──────────────────────────

export const initialNotifications: AppNotification[] = [
  {
    id: 'n1',
    studentId: 'all',
    kind: 'news',
    title: 'Демо-режим: данные вымышленные',
    body: 'Это концепт для конкурса, а не официальный сервис вуза. Все ФИО, оценки и заявки — тестовые.',
    at: minutesAgo(90),
    read: false,
  },
  {
    id: 'n2',
    studentId: 's_anna',
    kind: 'schedule',
    title: 'Перенос занятия',
    body: 'Базы данных (лекция) в четверг — в аудитории 412 вместо 401.',
    at: hoursAgo(3),
    read: false,
    href: '#/schedule',
  },
  {
    id: 'n3',
    studentId: 's_anna',
    kind: 'request',
    title: 'Справка готова',
    body: 'Заявка Д-2026-1001 «Справка об обучении» готова к выдаче, каб. 231.',
    at: hoursAgo(4),
    read: false,
    href: '#/requests/req_1001',
  },
  {
    id: 'n4',
    studentId: 's_mark',
    kind: 'deadline',
    title: 'Дедлайн через 2 дня',
    body: 'Курсовая работа: черновик — сдать до пятницы, 18:00.',
    at: hoursAgo(7),
    read: false,
    href: '#/grades',
  },
  {
    id: 'n5',
    studentId: 's_mark',
    kind: 'request',
    title: 'Нужны документы',
    body: 'По заявке Д-2026-2002 не хватает копии паспорта.',
    at: daysAgo(5),
    read: true,
    href: '#/requests/req_2002',
  },
  {
    id: 'n6',
    studentId: 's_anna',
    kind: 'news',
    title: 'Зачётная неделя',
    body: 'С 22 по 27 декабря — зачётная неделя. Расписание зачётов появится в кабинете.',
    at: daysAgo(1),
    read: true,
  },
]

export const todayLessonCount = (s: Student) =>
  s.schedule.filter((l) => l.day === isoDay()).length
