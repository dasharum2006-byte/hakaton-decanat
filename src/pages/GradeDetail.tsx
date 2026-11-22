import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  BookMarked,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Download,
  ExternalLink,
  FileText,
  MapPin,
  MessageCircle,
  Paperclip,
  Pencil,
  Trash2,
  UserRound,
  UserRoundCheck,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { disciplineInfo } from '../lib/grades'
import { cn, deadlineLabel, daysUntil, formatDate, formatDateTime, formatTime, plural } from '../lib/utils'
import { Badge, Modal, ProgressBar } from '../components/ui'
import { BackLink } from '../components/BackLink'
import { useMessages } from '../lib/messages'
import { ALLOWED_EXTENSIONS, useAttachments } from '../lib/attachments'
import { toast } from '../lib/toast'
import kotik from '../Kotik.png'
import type { DisciplineInfo } from '../lib/grades'
import type { Grade } from '../lib/types'

function ExamCard({
  info,
  examDays,
  control,
}: {
  info: DisciplineInfo
  examDays: number
  control: Grade['control']
}) {
  const title = control === 'Зачёт' ? 'Зачёт' : control === 'Курсовая' ? 'Защита курсовой' : 'Экзамен'
  const passedLabel =
    control === 'Зачёт'
      ? 'Зачёт получен'
      : control === 'Курсовая'
        ? 'Курсовая защищена'
        : 'Экзамен сдан'
  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <CalendarClock size={16} className="text-primary" /> {title}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-semibold text-fg">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} /> {formatTime(info.examAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} /> ауд. {info.examRoom}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="text-[13px] font-bold">
            {formatDate(info.examAt, { weekday: 'short' })}
          </p>
          {info.examPassed ? (
            <Badge tone="ok" icon={<CheckCircle2 size={12} />}>
              {passedLabel}
            </Badge>
          ) : (
            <Badge
              tone={examDays <= 3 ? 'danger' : examDays <= 7 ? 'warn' : 'info'}
              icon={<CalendarClock size={12} />}
            >
              {examDays <= 7
                ? deadlineLabel(info.examAt)
                : `через ${examDays} ${plural(examDays, 'день', 'дня', 'дней')}`}
            </Badge>
          )}
        </div>
      </div>
    </section>
  )
}

/** Баллы: ≥75% — зелёный, 50–74% — жёлтый, ниже 50% — красный */
function scoreTone(score: number, max: number) {
  const percent = max ? (score / max) * 100 : 0
  if (percent >= 75) return 'bg-ok-bg text-ok'
  if (percent >= 50) return 'bg-warn-bg text-warn'
  return 'bg-danger-bg text-danger'
}

function scoreLabel(score: number, max: number) {
  const percent = max ? (score / max) * 100 : 0
  if (percent >= 75) return 'зачтено'
  if (percent >= 50) return 'нужно добрать'
  return 'не зачтено'
}

function ScorePill({ score, max }: { score: number; max: number }) {
  return (
    <span
      className={cn('shrink-0 rounded-lg px-2 py-1 text-[12px] font-bold', scoreTone(score, max))}
      title={scoreLabel(score, max)}
    >
      {score}
      <span className="text-[10px] font-semibold opacity-70"> / {max}</span>
    </span>
  )
}

function AwaitingPill() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warn-bg px-2 py-1 text-[10px] font-semibold leading-none text-warn">
      <Clock size={11} /> ждёт проверки
    </span>
  )
}

function ActionButtons({ grade }: { grade: Grade }) {
  const { student } = useAuth()
  const { messages, send } = useMessages()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')

  const thread = student
    ? messages
        .filter(
          (m) =>
            m.studentId === student.id &&
            m.teacherName === grade.teacher &&
            m.subject === grade.subject,
        )
        .sort((a, b) => +new Date(a.at) - +new Date(b.at))
    : []

  const close = () => {
    setOpen(false)
    setMessage('')
  }

  const submit = () => {
    if (!message.trim() || !student) return
    send({
      teacherName: grade.teacher,
      studentId: student.id,
      subject: grade.subject,
      from: 'student',
      text: message.trim(),
    })
    setMessage('')
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <button type="button" className="btn-primary w-full" onClick={() => setOpen(true)}>
          <MessageCircle size={16} /> Написать преподавателю
        </button>
      </div>

      <Modal
        open={open}
        onClose={close}
        title="Обращение преподавателю"
        footer={
          <div className="flex gap-2">
            <button type="button" className="btn-soft flex-1" onClick={close}>
              Закрыть
            </button>
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={submit}
              disabled={!message.trim()}
            >
              Отправить
            </button>
          </div>
        }
      >
        <p className="text-[12px] text-muted">
          Получатель: <span className="font-semibold text-fg">{grade.teacher}</span> ·{' '}
          {grade.subject}
        </p>

        {thread.length > 0 && (
          <div className="mt-3 max-h-52 space-y-2 overflow-y-auto rounded-xl border border-border bg-surface p-2.5">
            {thread.map((m) => (
              <div
                key={m.id}
                className={
                  m.from === 'student'
                    ? 'ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-[13px] leading-snug text-primary-fg'
                    : 'mr-auto max-w-[85%] rounded-2xl rounded-bl-md bg-surface-2 px-3 py-2 text-[13px] leading-snug text-fg'
                }
              >
                <p className="whitespace-pre-line">{m.text}</p>
                <p className="mt-1 text-[11px] opacity-70">
                  {m.from === 'student' ? 'Вы' : grade.teacher.split(' ')[0]} ·{' '}
                  {formatDateTime(m.at)}
                </p>
              </div>
            ))}
          </div>
        )}

        <textarea
          id="appeal-message"
          className="input mt-3 min-h-28 resize-y"
          placeholder="Например: когда можно пересдать итоговую работу?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-label="Сообщение преподавателю"
        />
      </Modal>
    </>
  )
}

function TeacherCard({ grade }: { grade: Grade }) {
  return (
    <Link
      to={`/grades/${grade.id}/teacher`}
      className="card mt-3 flex items-center gap-3 p-4 transition-colors hover:border-primary/30 hover:bg-info-bg/40"
      aria-label={`Расписание преподавателя ${grade.teacher}`}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-primary"
        aria-hidden
      >
        <UserRound size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted">
          Преподаватель
        </span>
        <span className="mt-0.5 block truncate text-sm font-bold">{grade.teacher}</span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-muted" />
    </Link>
  )
}


/** Котик-поздравление для закрытых дисциплин */
function PassedCatCard() {
  return (
    <section className="card p-4 text-center">
      <img
        src={kotik}
        alt="Котик гордится тобой"
        className="mx-auto block w-full max-w-[220px]"
        draggable={false}
      />
      <p className="mt-2 text-sm font-bold text-primary">Молодец, я тобой горжусь.</p>
    </section>
  )
}


/** Демо-материалы дисциплины */
const METHOD_MATERIALS = [
  'Методичка 1',
  'Методичка 2',
  'Подготовка к тесту 1',
  'Подготовка к тесту 2',
  'Презентация для 1 практической',
  'Презентация для 2 практической',
]

const BOOKS = [
  { title: 'Конспект лекций', meta: 'Учебное пособие · 2024' },
  { title: 'Сборник задач и упражнений', meta: 'Практикум · 2023' },
  { title: 'Краткий курс для подготовки к экзамену', meta: 'Методические материалы · 2025' },
]

/** Скачивает демонстрационный файл материала (текстовый) */
function downloadMaterial(name: string, subject: string) {
  const content = [
    name,
    `Дисциплина: ${subject}`,
    '',
    'Демонстрационный файл прототипа «Деканат+».',
    'Материал вымышлен и создан только для показа сценария скачивания.',
  ].join('\n')
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${name}.txt`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  toast({ title: 'Файл скачан', body: name, tone: 'success' })
}

export function GradeDetail() {
  const { id } = useParams()
  const { student } = useAuth()
  const grade = student?.grades.find((g) => g.id === id)

  if (!student || !grade) {
    return (
      <div className="animate-rise">
        <BackLink to="/grades" label="Учёба" className="mb-4" />
        <div className="card p-6 text-center">
          <p className="text-sm font-bold">Дисциплина не найдена</p>
          <p className="mt-1 text-[12px] text-muted">
            Возможно, ссылка устарела — вернитесь к списку дисциплин.
          </p>
          <Link to="/grades" className="btn-primary mt-3">
            К дисциплинам
          </Link>
        </div>
      </div>
    )
  }

  const info = disciplineInfo(student, grade)
  const examDays = daysUntil(info.examAt)
  const attendancePercent = info.attendance.percent
  const { forWork, attach, detach } = useAttachments(student.id, grade.id)
  const [pendingWork, setPendingWork] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const pickFile = (workId: string) => {
    setPendingWork(workId)
    fileInputRef.current?.click()
  }

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !pendingWork) return
    const error = attach(pendingWork, file)
    if (error) {
      toast({ title: 'Не удалось прикрепить файл', body: error, tone: 'danger' })
    } else {
      toast({ title: 'Работа прикреплена', body: file.name, tone: 'success' })
    }
    setPendingWork(null)
  }

  const removeFile = (workId: string) => {
    detach(workId)
    toast({ title: 'Файл удалён из работы' })
  }

  return (
    <div className="animate-rise">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
        onChange={onFilePicked}
        aria-hidden
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <BackLink to="/grades" label="Учёба" className="mb-0!" />
        <h1 className="min-w-0 text-right text-xl font-bold leading-tight tracking-tight sm:text-2xl">
          {grade.subject}
        </h1>
      </div>

      <div className="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-start min-[900px]:gap-5">
        <div className="min-w-0 flex-1 space-y-3">
          {/* Посещаемость */}
          <section className="card p-3.5">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <UserRoundCheck size={16} className="text-primary" /> Посещаемость
              </h2>
              <p className="shrink-0 text-sm font-semibold">
                {info.attendance.attended} из {info.attendance.total}
                <span
                  className={cn(
                    'ml-1.5 font-extrabold',
                    attendancePercent >= 85
                      ? 'text-ok'
                      : attendancePercent >= 70
                        ? 'text-warn'
                        : 'text-danger',
                  )}
                >
                  {attendancePercent}%
                </span>
              </p>
            </div>
            <ProgressBar value={attendancePercent} tone="ok" />
          </section>

          {/* Работы и баллы вместо «Что нужно для зачёта» */}
          <section className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <ClipboardList size={16} className="text-primary" /> Работы и баллы
            </h2>
            <ul className="divide-y divide-border">
              {info.works.map((w) => {
                const file = forWork(w.id)
                const attached = Boolean(file) || w.score !== null
                return (
                  <li key={w.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold">{w.title}</span>
                        <span className="mt-0.5 block text-[11px] text-muted">
                          {formatDate(w.at, { day: 'numeric', month: 'short' })}
                        </span>
                      </span>
                      {w.score === null ? (
                        w.note === 'ждёт проверки' ? (
                          <AwaitingPill />
                        ) : (
                          <span className="shrink-0 rounded-full bg-danger-bg px-2 py-1 text-[10px] font-semibold leading-none text-danger">
                            не сдано
                          </span>
                        )
                      ) : (
                        <ScorePill score={w.score} max={w.max} />
                      )}
                    </div>

                    <div className="mt-1.5 flex items-center gap-2 text-[11px] font-semibold">
                      {file ? (
                        <>
                          <Paperclip size={12} className="shrink-0 text-primary" />
                          <span className="min-w-0 flex-1 truncate text-muted">{file.name}</span>
                          <button
                            type="button"
                            className="shrink-0 text-primary hover:underline"
                            onClick={() => pickFile(w.id)}
                          >
                            <Pencil size={13} aria-label="Заменить файл" />
                          </button>
                          <button
                            type="button"
                            className="shrink-0 text-danger hover:underline"
                            onClick={() => removeFile(w.id)}
                          >
                            <Trash2 size={13} aria-label="Удалить файл" />
                          </button>
                        </>
                      ) : attached ? (
                        <>
                          <Paperclip size={12} className="shrink-0 text-ok" />
                          <span className="text-ok">Прикреплён</span>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => pickFile(w.id)}
                        >
                          Прикрепить
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* Методички */}
          <section className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <FileText size={16} className="text-primary" /> Методички
            </h2>
            <ul className="divide-y divide-border">
              {METHOD_MATERIALS.map((title) => (
                <li key={title} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{title}</span>
                  <button
                    type="button"
                    className="btn-ghost shrink-0 px-2 py-1.5"
                    onClick={() => downloadMaterial(`${title} — ${grade.subject}`, grade.subject)}
                    aria-label={`Скачать: ${title}`}
                  >
                    <Download size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Книги */}
          <section className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <BookMarked size={16} className="text-primary" /> Книги
            </h2>
            <ul className="divide-y divide-border">
              {BOOKS.map((book) => (
                <li key={book.title} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-primary">
                    <BookOpen size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{book.title}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted">{book.meta}</span>
                  </span>
                  <button
                    type="button"
                    className="btn-ghost shrink-0 px-2 py-1.5"
                    onClick={() => downloadMaterial(`${book.title} — ${grade.subject}`, grade.subject)}
                    aria-label={`Скачать: ${book.title}`}
                  >
                    <Download size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Литература */}
          <section className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <ExternalLink size={16} className="text-primary" /> Литература
            </h2>
            <ul className="divide-y divide-border">
              <li>
                <a
                  href={`https://ru.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(grade.subject)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 py-2.5 text-[13px] font-semibold hover:text-primary"
                >
                  <span className="min-w-0 flex-1 truncate">Статьи по теме: {grade.subject}</span>
                  <ExternalLink size={15} className="shrink-0" />
                </a>
              </li>
              <li>
                <a
                  href={`https://cyberleninka.ru/search?q=${encodeURIComponent(grade.subject)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 py-2.5 text-[13px] font-semibold hover:text-primary"
                >
                  <span className="min-w-0 flex-1 truncate">Научные статьи в «КиберЛенинке»</span>
                  <ExternalLink size={15} className="shrink-0" />
                </a>
              </li>
            </ul>
          </section>

          {/* На телефоне дата экзамена — сразу под работами */}
          <div className="min-[900px]:hidden">
            <ExamCard info={info} examDays={examDays} control={grade.control} />
          </div>

          {grade.status === 'closed' && (
            <div className="min-[900px]:hidden">
              <PassedCatCard />
            </div>
          )}

          {/* Кнопка «Написать преподавателю» — в самом низу */}
          <div className="min-[900px]:hidden">
            <ActionButtons grade={grade} />
          </div>
        </div>

        {/* Правая колонка: на компьютере закреплена */}
        <div className="min-[900px]:w-[300px] min-[900px]:shrink-0">
          <div className="min-[900px]:sticky min-[900px]:top-6">
            <div className="hidden min-[900px]:block">
              <ExamCard info={info} examDays={examDays} control={grade.control} />
              <TeacherCard grade={grade} />
              {grade.status === 'closed' && (
                <div className="mt-3">
                  <PassedCatCard />
                </div>
              )}
              <div className="mt-3">
                <ActionButtons grade={grade} />
              </div>
            </div>
          </div>
          {/* Зазор под плавающую кнопку «Спросить» */}
          <div className="hidden min-[900px]:block min-[900px]:h-24" aria-hidden />
        </div>
      </div>

      {/* Зазор под плавающую кнопку и нижнюю полосу на телефоне */}
      <div className="h-16 min-[900px]:hidden" aria-hidden />
    </div>
  )
}
