import { useMemo, useState } from 'react'
import { ArrowLeft, MessageCircle, Send } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { teachers } from '../data/seed'
import { useMessages } from '../lib/messages'
import { cn, formatDateTime, timeAgo } from '../lib/utils'
import { Avatar, EmptyState, PageHeader } from '../components/ui'

const surname = (name: string) => name.split(' ')[0]

interface Conversation {
  key: string
  teacherName: string
  subject: string
  messages: ReturnType<typeof useMessages>['messages']
  last: ReturnType<typeof useMessages>['messages'][number]
}

export function StudentMessages() {
  const { student } = useAuth()
  const { messages, send } = useMessages()
  const [selected, setSelected] = useState<string | null>(null)
  const [text, setText] = useState('')

  /** Переписки студента, сгруппированные по преподавателю и дисциплине */
  const conversations = useMemo<Conversation[]>(() => {
    if (!student) return []
    const map = new Map<string, Conversation['messages']>()
    for (const m of messages) {
      if (m.studentId !== student.id) continue
      const key = `${m.teacherName}|${m.subject}`
      const list = map.get(key)
      if (list) list.push(m)
      else map.set(key, [m])
    }
    return [...map.entries()]
      .map(([key, list]) => {
        const sorted = [...list].sort((a, b) => +new Date(a.at) - +new Date(b.at))
        return {
          key,
          teacherName: sorted[0].teacherName,
          subject: sorted[0].subject,
          messages: sorted,
          last: sorted[sorted.length - 1],
        }
      })
      .sort((a, b) => +new Date(b.last.at) - +new Date(a.last.at))
  }, [messages, student])

  const current = conversations.find((c) => c.key === selected) ?? null

  const reply = () => {
    if (!current || !student || !text.trim()) return
    send({
      teacherName: current.teacherName,
      studentId: student.id,
      subject: current.subject,
      from: 'student',
      text: text.trim(),
    })
    setText('')
  }

  if (!student) return null

  return (
    <div className="animate-rise">
      {current ? (
        <>
          <button
            type="button"
            className="btn-soft mb-3 inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm"
            onClick={() => setSelected(null)}
          >
            <ArrowLeft size={16} /> Все чаты
          </button>

          <PageHeader title={current.teacherName} subtitle={current.subject} />

          <div className="flex min-h-[calc(100dvh-300px)] flex-col">
            <div className="card mb-3 flex-1 space-y-2 bg-surface p-3">
              {current.messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed',
                    m.from === 'student'
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
                placeholder="Написать преподавателю…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    reply()
                  }
                }}
                aria-label="Сообщение преподавателю"
              />
              <button
                type="button"
                className="btn-primary h-11 w-11 shrink-0 rounded-xl p-0"
                onClick={reply}
                disabled={!text.trim()}
                aria-label="Отправить сообщение"
              >
                <Send size={17} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <PageHeader title="Чаты" subtitle="Переписка с преподавателями" />

          {conversations.length ? (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.key}
                  type="button"
                  onClick={() => setSelected(conv.key)}
                  className="card flex w-full items-center gap-3 p-3.5 text-left transition-transform hover:-translate-y-0.5"
                >
                  <Avatar name={conv.teacherName} hue={teacherHue(conv.teacherName)} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{conv.teacherName}</span>
                      <span className="shrink-0 text-[11px] font-medium text-muted">
                        {conv.subject}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted">
                      {conv.last.from === 'student' ? 'Вы: ' : ''}
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
              title="Переписок пока нет"
              text="Откройте дисциплину и нажмите «Написать преподавателю» — переписка появится здесь."
            />
          )}
        </>
      )}
    </div>
  )
}

/** Цвет аватара преподавателя (стабильный для одного и того же ФИО) */
function teacherHue(name: string) {
  const t = teachers.find((x) => x.name.startsWith(surname(name)))
  if (t) return t.avatarHue
  let h = 0
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) % 360
  return h
}
