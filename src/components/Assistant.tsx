import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUp, X } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/store'
import { assistantReply } from '../lib/assistant'
import { requestTypes } from '../data/seed'
import { cn, uid } from '../lib/utils'
import { Avatar } from './ui'
import kotikFace from '../assets/kotik-face.png'

interface ChatMessage {
  id: string
  role: 'user' | 'bot'
  text: string
  chips?: string[]
  at: string
}

function chipLabel(chip: string): string {
  if (chip.startsWith('create:')) {
    const id = chip.slice(7)
    return requestTypes.find((t) => t.id === id)?.title ?? 'Создать заявку'
  }
  if (chip.startsWith('nav:')) {
    return 'Открыть заявки'
  }
  return chip
}

function useChat(onNavigate?: () => void) {
  const { student } = useAuth()
  const { myRequests } = useData()
  const navigate = useNavigate()
  const key = `dekanat.chat.${student?.id ?? 'guest'}`

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = sessionStorage.getItem(key)
      if (raw) return JSON.parse(raw) as ChatMessage[]
    } catch {
      /* ignore */
    }
    return []
  })
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(messages.slice(-60)))
  }, [messages, key])

  const greeting = useMemo<ChatMessage>(
    () => ({
      id: 'greeting',
      role: 'bot',
      text: `Здравствуйте, ${student?.shortName ?? 'студент'}! Я помощник деканата.\n\nСпросите про расписание, оценки, долги или заявки — отвечу по вашим данным. Например: «что сегодня?» или «закажи справку об обучении».`,
      chips: ['Что сегодня?', 'Когда окна?', 'Мои заявки'],
      at: new Date().toISOString(),
    }),
    [student?.shortName],
  )

  const all = messages.length ? messages : [greeting]

  const send = (raw: string) => {
    const text = raw.trim()
    if (!text || !student) return

    if (text.startsWith('create:')) {
      const typeId = text.slice(7)
      const type = requestTypes.find((t) => t.id === typeId)
      setMessages((prev) => [
        ...prev,
        { id: uid('m'), role: 'user', text: `Оформить: ${type?.title ?? 'заявку'}`, at: new Date().toISOString() },
        {
          id: uid('m'),
          role: 'bot',
          text: `Открываю форму. Заполните пару полей — и заявка сразу появится в разделе «Заявки», а я буду показывать её статус.`,
          chips: ['nav:/requests'],
          at: new Date().toISOString(),
        },
      ])
      navigate(`/requests/new?type=${typeId}`)
      onNavigate?.()
      return
    }

    if (text.startsWith('nav:')) {
      navigate(text.slice(4))
      onNavigate?.()
      return
    }

    setMessages((prev) => [
      ...prev,
      { id: uid('m'), role: 'user', text, at: new Date().toISOString() },
    ])
    setTyping(true)
    window.setTimeout(() => {
      const reply = assistantReply(text, { student, requests: myRequests })
      setMessages((prev) => [
        ...prev,
        { id: uid('m'), role: 'bot', text: reply.text, chips: reply.chips, at: new Date().toISOString() },
      ])
      setTyping(false)
    }, 450)
  }

  return { messages: all, typing, send }
}

function ChatBody({
  compact = false,
  onNavigate,
}: {
  compact?: boolean
  onNavigate?: () => void
}) {
  const { messages, typing, send } = useChat(onNavigate)
  const [value, setValue] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, typing])

  const lastChips = [...messages].reverse().find((m) => m.role === 'bot' && m.chips?.length)?.chips

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={cn(
          'flex-1 space-y-3 overflow-y-auto px-4 py-4',
          compact ? 'max-h-[52dvh]' : '',
        )}
      >
        {messages.map((m) => (
          <div key={m.id} className={cn('flex gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            {m.role === 'bot' && (
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-border">
                <img src={kotikFace} alt="" className="h-full w-full object-cover" />
              </span>
            )}
            <div className={cn('max-w-[85%]', m.role === 'user' && 'max-w-[80%]')}>
              <div
                className={cn(
                  'whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'rounded-br-md bg-primary text-primary-fg'
                    : 'rounded-bl-md bg-surface-2 text-fg',
                )}
              >
                {m.text}
              </div>
              {m.role === 'bot' && m.chips && m.chips.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.chips.map((chip) => (
                    <button key={chip} className="chip" onClick={() => send(chip)}>
                      {chipLabel(chip)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-border">
              <img src={kotikFace} alt="" className="h-full w-full object-cover" />
            </span>
            <div className="flex gap-1 rounded-2xl rounded-bl-md bg-surface-2 px-3 py-3">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!typing && lastChips && (
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {lastChips.map((chip) => (
            <button key={chip} className="chip shrink-0" onClick={() => send(chip)}>
              {chipLabel(chip)}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex items-end gap-2 border-t border-border px-3 py-3"
        onSubmit={(e) => {
          e.preventDefault()
          send(value)
          setValue('')
        }}
      >
        <input
          className="input"
          placeholder="Спросите что-нибудь…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Сообщение помощнику"
        />
        <button
          type="submit"
          className="btn-primary h-11 w-11 shrink-0 rounded-xl p-0"
          aria-label="Отправить"
          disabled={!value.trim()}
        >
          <ArrowUp size={18} />
        </button>
      </form>
    </div>
  )
}

/** Плавающая кнопка + панель чата */
export function Assistant() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end sm:p-5">
          <button
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] sm:hidden"
            onClick={() => setOpen(false)}
            aria-label="Закрыть помощника"
          />
          <div className="animate-pop relative flex h-[85dvh] w-full flex-col rounded-t-3xl border border-border bg-surface shadow-2xl sm:h-[600px] sm:max-h-[80dvh] sm:w-[400px] sm:rounded-3xl">
            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-border">
                <img src={kotikFace} alt="" className="h-full w-full object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight">Декот</p>
              </div>
              <button className="btn-ghost px-2 py-1" onClick={() => setOpen(false)} aria-label="Закрыть">
                <X size={18} />
              </button>
            </div>
            <ChatBody compact onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(116px+env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-2 rounded-full bg-primary-solid px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:brightness-110 lg:bottom-6 lg:right-6"
        aria-label="Открыть помощника деканата"
      >
        <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white">
          <img src={kotikFace} alt="" className="h-full w-full object-cover" />
        </span>
        <span className="hidden sm:inline">Спросить</span>
      </button>
    </>
  )
}

/** Полноэкранная версия для страницы /assistant */
export function AssistantPageChat() {
  const { student } = useAuth()
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Avatar name={student?.shortName ?? '?'} hue={student?.avatarHue ?? 250} size="md" />
        <div>
          <h1 className="text-xl font-bold">Декот</h1>
        </div>
      </div>
      <div className="card flex h-[calc(100dvh-230px)] min-h-[420px] flex-col overflow-hidden lg:h-[calc(100dvh-220px)]">
        <ChatBody />
      </div>
    </div>
  )
}
