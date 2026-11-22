import { useMemo, useState } from 'react'
import { ArrowLeft, MessageCircle, Send } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { students } from '../data/seed'
import { useMessages, type TeacherMessage } from '../lib/messages'
import { cn, formatDateTime, timeAgo } from '../lib/utils'
import { Avatar, EmptyState, PageHeader } from '../components/ui'

const surname = (name: string) => name.split(' ')[0]

interface Conversation {
  key: string
  studentId: string
  subject: string
  teacherName: string
  messages: TeacherMessage[]
  last: TeacherMessage
  unread: number
}

export function TeacherMessages() {
  const { teacher } = useAuth()
  const { messages, send, markReadForTeacher } = useMessages()
  const [selected, setSelected] = useState<string | null>(null)
  const [text, setText] = useState('')

  /** Переписки этого преподавателя, сгруппированные по студенту и дисциплине */
  const conversations = useMemo<Conversation[]>(() => {
    if (!teacher) return []
    const prefix = surname(teacher.name)
    const map = new Map<string, TeacherMessage[]>()
    for (const m of messages) {
      if (!m.teacherName.startsWith(prefix)) continue
      const key = `${m.studentId}|${m.subject}`
      const list = map.get(key)
      if (list) list.push(m)
      else map.set(key, [m])
    }
    return [...map.entries()]
      .map(([key, list]) => {
        const sorted = [...list].sort((a, b) => +new Date(a.at) - +new Date(b.at))
        const [studentId] = key.split('|')
        return {
          key,
          studentId,
          subject: sorted[0].subject,
          teacherName: sorted[0].teacherName,
          messages: sorted,
          last: sorted[sorted.length - 1],
          unread: sorted.filter((m) => m.from === 'student' && !m.readByTeacher).length,
        }
      })
      .sort((a, b) => +new Date(b.last.at) - +new Date(a.last.at))
  }, [messages, teacher])

  const current = conversations.find((c) => c.key === selected) ?? null

  const openConversation = (conv: Conversation) => {
    setSelected(conv.key)
    if (teacher) markReadForTeacher(teacher.name, conv.studentId, conv.subject)
  }

  const reply = () => {
    if (!teacher || !current || !text.trim()) return
    send({
      teacherName: current.teacherName,
      studentId: current.studentId,
      subject: current.subject,
      from: 'teacher',
      text: text.trim(),
    })
    setText('')
  }

  if (!teacher) return null

  return (
    <div className="animate-rise">
      {current ? (
        <>
          <button
            type="button"
            className="btn-soft mb-3 inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm"
            onClick={() => setSelected(null)}
          >
            <ArrowLeft size={16} /> Все сообщения
          </button>

          <PageHeader
            title={studentName(current.studentId)}
            subtitle={studentGroup(current.studentId)}
          />

          <div className="flex min-h-[calc(100dvh-300px)] flex-col">
            <div className="card mb-3 flex-1 space-y-2 bg-surface p-3">
            {current.messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed',
                  m.from === 'teacher'
                    ? 'ml-auto rounded-br-md bg-primary text-primary-fg'
                    : 'mr-auto rounded-bl-md bg-surface-2 text-fg',
                )}
              >
                <p className="whitespace-pre-line">{m.text}</p>
                <p className="mt-1 text-right text-[10px] opacity-60">{formatDateTime(m.at)}</p>
              </div>
            ))}
          </div>

          <div className="sticky bottom-[calc(96px+env(safe-area-inset-bottom))] flex items-end gap-2 rounded-2xl border border-border bg-surface/95 p-2.5 backdrop-blur lg:bottom-4">
            <textarea
              className="input min-h-[44px] resize-none"
              rows={1}
              placeholder="Ответить студенту…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  reply()
                }
              }}
              aria-label="Ответ студенту"
            />
            <button
              type="button"
              className="btn-primary h-11 w-11 shrink-0 rounded-xl p-0"
              onClick={reply}
              disabled={!text.trim()}
              aria-label="Отправить ответ"
            >
              <Send size={17} />
            </button>
          </div>
          </div>
        </>
      ) : (
        <>
          <PageHeader title="Сообщения" subtitle="Обращения студентов" />

          {conversations.length ? (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.key}
                  type="button"
                  onClick={() => openConversation(conv)}
                  className="card flex w-full items-center gap-3 p-3.5 text-left transition-transform hover:-translate-y-0.5"
                >
                  <Avatar
                    name={studentName(conv.studentId).split(' ')[0]}
                    hue={students.find((s) => s.id === conv.studentId)?.avatarHue ?? 250}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">
                        {studentName(conv.studentId)}
                      </span>
                      <span className="shrink-0 text-[11px] font-medium text-muted">
                        {studentGroup(conv.studentId)}
                      </span>
                      {conv.unread > 0 && (
                        <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-fg">
                          {conv.unread}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted">
                      {conv.subject} · {conv.last.from === 'teacher' ? 'Вы: ' : ''}
                      {conv.last.text}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] font-medium text-muted">
                    {timeAgo(conv.last.at)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<MessageCircle size={22} />}
              title="Сообщений пока нет"
              text="Здесь появятся обращения студентов с выбранной дисциплины."
            />
          )}
        </>
      )}
    </div>
  )
}

function studentGroup(id: string) {
  return students.find((x) => x.id === id)?.group ?? ''
}

function studentName(id: string) {
  const s = students.find((x) => x.id === id)
  return s ? s.name : 'Студент'
}
