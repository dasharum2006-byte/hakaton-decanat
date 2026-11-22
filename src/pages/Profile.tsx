import { useEffect, useState } from 'react'
import {
  BookOpen,
  Download,
  GraduationCap,
  LogOut,
  Mail,
  Plus,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  UserRound,
  Users,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/store'
import { Avatar, Badge, Modal, PageHeader } from '../components/ui'
import { fileToAvatar, removeAvatar, saveAvatar, useAvatar } from '../lib/avatar'
import { toast } from '../lib/toast'
import { gpa } from '../lib/assistant'
import { formatGpa, plural } from '../lib/utils'
import kittens from '../kittens2.png'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

export function Profile() {
  const { account, student, logout } = useAuth()
  const { resetDemo } = useData()
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null)
  const [installHelp, setInstallHelp] = useState(false)
  const [iconOpen, setIconOpen] = useState(false)
  const [iconDraft, setIconDraft] = useState<string | null>(null)
  const [iconError, setIconError] = useState<string | null>(null)
  const [iconBusy, setIconBusy] = useState(false)
  const avatarSrc = useAvatar(account?.id)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!account) return null

  const pickIcon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setIconError(null)
    setIconBusy(true)
    try {
      setIconDraft(await fileToAvatar(file))
    } catch (err) {
      setIconDraft(null)
      setIconError(err instanceof Error ? err.message : 'Не удалось загрузить изображение')
    } finally {
      setIconBusy(false)
    }
  }

  const applyIcon = () => {
    if (!iconDraft) return
    try {
      saveAvatar(account.id, iconDraft)
      toast({ title: 'Иконка профиля обновлена', tone: 'success' })
      setIconOpen(false)
      setIconDraft(null)
    } catch (err) {
      setIconError(err instanceof Error ? err.message : 'Не удалось сохранить иконку')
    }
  }

  const dropIcon = () => {
    removeAvatar(account.id)
    setIconDraft(null)
    setIconOpen(false)
    toast({ title: 'Иконка профиля сброшена' })
  }

  const debts = student?.grades.filter((g) => g.status === 'debt').length ?? 0

  return (
    <div className="animate-rise">
      <div className="hidden lg:block">
        <PageHeader title="Профиль" />
      </div>

      <section className="card mb-3 overflow-hidden">
        <div className="relative h-32 overflow-hidden bg-surface-2 sm:h-44">
          <img
            src={kittens}
            alt=""
            aria-hidden
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div className="px-4 pb-4">
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <button
              type="button"
              onClick={() => {
                setIconDraft(null)
                setIconError(null)
                setIconOpen(true)
              }}
              className="relative z-10 inline-flex shrink-0 rounded-full ring-4 ring-surface transition-opacity hover:opacity-90"
              aria-label="Изменить иконку профиля"
              title="Изменить иконку профиля"
            >
              <Avatar
                name={account.shortName}
                hue={account.avatarHue}
                size="lg"
                className="h-[72px] w-[72px] text-xl"
                src={avatarSrc}
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary-solid text-white shadow">
                <Plus size={15} strokeWidth={3} />
              </span>
            </button>
            <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <h2 className="min-w-0 text-lg font-bold leading-tight">{account.name}</h2>
              <div className="shrink-0">
                {account.role === 'student' ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/25 bg-info-bg px-2.5 py-1.5 text-[12px] font-semibold leading-none text-primary">
                    <GraduationCap size={13} />
                    Группа {student?.group}
                  </span>
                ) : account.role === 'teacher' ? (
                  <Badge tone="info">
                    <BookOpen size={12} />
                    преподаватель
                  </Badge>
                ) : (
                  <Badge tone="ok">
                    <ShieldCheck size={12} />
                    сотрудник
                  </Badge>
                )}
              </div>
            </div>

            <p className="w-full pl-[84px] text-sm leading-snug text-muted">
              {account.role === 'student'
                ? student?.program
                : account.role === 'teacher'
                  ? account.position
                  : 'Сотрудник деканата'}
            </p>
          </div>

          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            {account.role === 'student' && student ? (
              <>
                <InfoRow icon={<GraduationCap size={16} />} label="Факультет" value={student.faculty} />
                <InfoRow icon={<BookOpen size={16} />} label="Курс" value={`${student.course} курс`} />
                <InfoRow icon={<UserRound size={16} />} label="Куратор" value={student.curator} />
                <InfoRow icon={<Mail size={16} />} label="Почта" value={account.email} />
                <InfoRow icon={<Users size={16} />} label="Зачётная книжка" value={student.studentCard} />
                <InfoRow
                  icon={<BookOpen size={16} />}
                  label="Успеваемость"
                  value={`средний ${formatGpa(gpa(student.grades))} · ${debts ? `${debts} ${plural(debts, 'долг', 'долга', 'долгов')}` : 'без долгов'}`}
                />
              </>
            ) : account.role === 'teacher' ? (
              <>
                <InfoRow icon={<ShieldCheck size={16} />} label="Должность" value={account.position} />
                <InfoRow icon={<GraduationCap size={16} />} label="Институт" value={account.faculty} />
                <InfoRow
                  icon={<BookOpen size={16} />}
                  label="Дисциплины"
                  value={account.subjects.join(', ')}
                />
                <InfoRow icon={<Mail size={16} />} label="Почта" value={account.email} />
              </>
            ) : (
              <>
                <InfoRow
                  icon={<ShieldCheck size={16} />}
                  label="Должность"
                  value={account.role === 'staff' ? account.position : '—'}
                />
                <InfoRow
                  icon={<GraduationCap size={16} />}
                  label="Институт"
                  value={account.role === 'staff' ? account.faculty : '—'}
                />
                <InfoRow icon={<Mail size={16} />} label="Почта" value={account.email} />
              </>
            )}
          </dl>
        </div>
      </section>

      <section className="card mb-3 divide-y divide-border">
        <button
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
          onClick={async () => {
            if (installEvent) {
              await installEvent.prompt()
              setInstallEvent(null)
              return
            }
            setInstallHelp(true)
          }}
        >
          <Download size={18} className="text-primary" />
          <span className="flex-1 text-sm font-medium">Скачать мобильную версию</span>
          <span className="text-[11px] font-semibold text-primary">PWA</span>
        </button>

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

      <Modal
        open={iconOpen}
        onClose={() => {
          setIconOpen(false)
          setIconDraft(null)
          setIconError(null)
        }}
        title="Иконка профиля"
        footer={
          <div className="flex gap-2">
            {avatarSrc && (
              <button type="button" className="btn-soft flex-1 py-2.5" onClick={dropIcon}>
                Вернуть букву
              </button>
            )}
            <button
              type="button"
              className="btn-primary flex-1 py-2.5"
              onClick={applyIcon}
              disabled={!iconDraft || iconBusy}
            >
              Сохранить
            </button>
          </div>
        }
      >
        <div className="flex items-center gap-3">
          <Avatar
            name={account.shortName}
            hue={account.avatarHue}
            size="lg"
            className="h-20 w-20 text-2xl"
            src={iconDraft ?? avatarSrc}
          />
          <div className="min-w-0 flex-1">
            <label className="btn-soft inline-flex cursor-pointer items-center gap-2 px-3 py-2 text-[12px]">
              <Plus size={15} />
              {iconBusy ? 'Проверяем…' : 'Выбрать файл'}
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={pickIcon}
                disabled={iconBusy}
              />
            </label>
            <p className="mt-2 text-[11px] leading-snug text-muted">
              Только PNG или JPEG, до 2 МБ.
            </p>
          </div>
        </div>
        {iconError && (
          <p className="mt-3 rounded-xl border border-danger/30 bg-danger-bg px-3 py-2 text-[12px] font-medium text-danger">
            {iconError}
          </p>
        )}
      </Modal>

      <Modal
        open={installHelp}
        onClose={() => setInstallHelp(false)}
        title="Установка на телефон"
        footer={
          <button className="btn-primary w-full py-2.5" onClick={() => setInstallHelp(false)}>
            Понятно
          </button>
        }
      >
        <div className="space-y-2 text-[13px] leading-relaxed">
          <p className="flex items-start gap-2">
            <Smartphone size={16} className="mt-0.5 shrink-0 text-primary" />
            Кабинет работает как приложение (PWA) и открывается с главного экрана без адресной строки.
          </p>
          <p className="text-muted">
            <span className="font-semibold text-fg">Android / Chrome:</span> меню ⋮ → «Установить
            приложение» или «Добавить на главный экран».
          </p>
          <p className="text-muted">
            <span className="font-semibold text-fg">iPhone / Safari:</span> кнопка «Поделиться» →
            «На экран «Домой»».
          </p>
          <p className="text-muted">
            <span className="font-semibold text-fg">Компьютер / Chrome:</span> значок установки в
            адресной строке.
          </p>
        </div>
      </Modal>
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
    <div className="flex items-center gap-2.5 rounded-xl border border-primary/15 bg-info-bg px-3 py-2">
      <span className="shrink-0 text-primary/80">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-primary">{label}</dt>
        <dd className="truncate text-[14px] font-medium">{value}</dd>
      </div>
    </div>
  )
}
