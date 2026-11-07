import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Download,
  GraduationCap,
  LogOut,
  Mail,
  Moon,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  UserRound,
  Users,
} from 'lucide-react'
import { useAuth, useTheme } from '../lib/auth'
import { useData } from '../lib/store'
import { Avatar, Badge, PageHeader } from '../components/ui'
import { gpa } from '../lib/assistant'
import { formatGpa, plural } from '../lib/utils'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

export function Profile() {
  const { account, student, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { resetDemo, myRequests } = useData()
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!account) return null

  const debts = student?.grades.filter((g) => g.status === 'debt').length ?? 0

  return (
    <div className="animate-rise">
      <PageHeader title="Профиль" subtitle="Данные студента и настройки кабинета" />

      <section className="card mb-3 overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary to-accent" />
        <div className="px-4 pb-4">
          <div className="-mt-8 flex items-end justify-between gap-3">
            <Avatar name={account.shortName} hue={account.avatarHue} size="lg" />
            {account.role === 'student' ? (
              <Badge tone="info">
                <GraduationCap size={12} />
                {student?.group}
              </Badge>
            ) : (
              <Badge tone="ok">
                <ShieldCheck size={12} />
                сотрудник
              </Badge>
            )}
          </div>
          <h2 className="mt-2 text-lg font-bold leading-tight">{account.name}</h2>
          <p className="mt-0.5 text-[12px] text-muted">
            {account.role === 'student' ? student?.program : 'Сотрудник деканата'}
          </p>

          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            {account.role === 'student' && student ? (
              <>
                <InfoRow icon={<GraduationCap size={14} />} label="Факультет" value={student.faculty} />
                <InfoRow icon={<BookOpen size={14} />} label="Курс и группа" value={`${student.course} курс · ${student.group}`} />
                <InfoRow icon={<UserRound size={14} />} label="Куратор" value={student.curator} />
                <InfoRow icon={<Mail size={14} />} label="Почта" value={account.email} />
                <InfoRow icon={<Users size={14} />} label="Зачётная книжка" value={student.studentCard} />
                <InfoRow
                  icon={<Sparkles size={14} />}
                  label="Успеваемость"
                  value={`средний ${formatGpa(gpa(student.grades))} · ${debts ? `${debts} ${plural(debts, 'долг', 'долга', 'долгов')}` : 'без долгов'}`}
                />
              </>
            ) : (
              <>
                <InfoRow
                  icon={<ShieldCheck size={14} />}
                  label="Должность"
                  value={account.role === 'staff' ? account.position : '—'}
                />
                <InfoRow
                  icon={<GraduationCap size={14} />}
                  label="Институт"
                  value={account.role === 'staff' ? account.faculty : '—'}
                />
                <InfoRow icon={<Mail size={14} />} label="Почта" value={account.email} />
              </>
            )}
          </dl>
        </div>
      </section>

      <section className="card mb-3 divide-y divide-border">
        <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={18} className="text-muted" /> : <Moon size={18} className="text-muted" />}
          <span className="flex-1 text-sm font-medium">
            {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          </span>
          <span className="text-[11px] text-muted">{theme === 'dark' ? 'вкл' : 'выкл'}</span>
        </button>

        {installEvent && (
          <button
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
            onClick={async () => {
              await installEvent.prompt()
              setInstallEvent(null)
            }}
          >
            <Download size={18} className="text-muted" />
            <span className="flex-1 text-sm font-medium">Установить на телефон</span>
            <span className="text-[11px] text-primary">PWA</span>
          </button>
        )}

        {account.role === 'student' && (
          <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left" onClick={resetDemo}>
            <RotateCcw size={18} className="text-muted" />
            <span className="flex-1 text-sm font-medium">Сбросить демо-данные</span>
          </button>
        )}

        <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-danger" onClick={logout}>
          <LogOut size={18} />
          <span className="flex-1 text-sm font-medium">Выйти из аккаунта</span>
        </button>
      </section>

      <section className="card mb-3 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-info-bg text-primary">
            <Smartphone size={17} />
          </span>
          <div>
            <h3 className="text-sm font-bold">Это концепт, а не официальный сервис</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Прототип создан для конкурса «Цифровой деканат будущего». Все ФИО,
              преподаватели, оценки и документы вымышлены. Логотип вуза не используется.
              Данные хранятся только в этом браузере.
            </p>
          </div>
        </div>
      </section>

      <section className="card p-4">
        <h3 className="mb-2 text-sm font-bold">Как устроена безопасность</h3>
        <ul className="space-y-1.5 text-[11px] leading-relaxed text-muted">
          <li className="flex gap-2">
            <ShieldCheck size={13} className="mt-0.5 shrink-0 text-ok" />
            Пароли хранятся как SHA-256 хэши — открытого пароля в данных нет.
          </li>
          <li className="flex gap-2">
            <ShieldCheck size={13} className="mt-0.5 shrink-0 text-ok" />
            Заявки и профиль фильтруются по id из сессии, а не по адресу страницы.
          </li>
          <li className="flex gap-2">
            <ShieldCheck size={13} className="mt-0.5 shrink-0 text-ok" />
            Нет внешних API и ключей: помощник работает на локальных правилах.
          </li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/demo" className="chip">
            Тестовые аккаунты
          </Link>
          <Link to="/requests" className="chip">
            Мои заявки · {myRequests.length}
          </Link>
        </div>
      </section>

      <p className="mt-4 text-center text-[10px] text-muted">
        Деканат+ · прототип для конкурса · {new Date().getFullYear()}
      </p>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-surface-2 px-3 py-2">
      <span className="mt-0.5 shrink-0 text-muted">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[10px] uppercase tracking-wide text-muted">{label}</dt>
        <dd className="truncate text-[12px] font-medium">{value}</dd>
      </div>
    </div>
  )
}
