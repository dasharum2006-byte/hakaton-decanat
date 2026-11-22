import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  FileText,
  GraduationCap,
  Home,
  LogOut,
  Map,
  MessageCircle,
  Moon,
  RotateCcw,
  Sun,
  UserRound,
  Users,
} from 'lucide-react'
import { useAuth, useTheme } from '../lib/auth'
import { useData } from '../lib/store'
import { Avatar, UnreadDot } from './ui'
import { ConceptStrip } from './ConceptNote'
import { Assistant } from './Assistant'
import { cn } from '../lib/utils'
import { useAvatar } from '../lib/avatar'
import { useMessages } from '../lib/messages'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-solid text-white">
        <GraduationCap size={20} />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-base font-extrabold tracking-tight">Деканат+</span>
          <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wider text-muted">
            концепт
          </span>
        </span>
      )}
    </div>
  )
}

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  end?: boolean
}

export function AppShell() {
  const { account, student, teacher, logout } = useAuth()
  const avatarSrc = useAvatar(account?.id)
  const { messages } = useMessages()
  const { unreadCount, myRequests, resetDemo } = useData()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const isStaff = account?.role === 'staff'
  const isTeacher = account?.role === 'teacher'

  const teacherUnread =
    teacher && messages.some((m) => m.from === 'student' && !m.readByTeacher)
      ? messages.filter(
          (m) =>
            m.from === 'student' &&
            !m.readByTeacher &&
            m.teacherName.startsWith(teacher.name.split(' ')[0]),
        ).length
      : 0

  const activeRequests = myRequests.filter(
    (r) => r.status === 'new' || r.status === 'in_progress' || r.status === 'signed',
  ).length

  const mainNav: NavItem[] = isStaff
    ? [
        { to: '/staff', label: 'Заявки студентов', icon: <Users size={19} />, end: true },
        { to: '/campus', label: 'Карта', icon: <Map size={19} /> },
        { to: '/notifications', label: 'Уведомления', icon: <Bell size={19} /> },
        { to: '/profile', label: 'Профиль', icon: <UserRound size={19} /> },
      ]
    : isTeacher
      ? [
          { to: '/teacher', label: 'Кабинет', icon: <BookOpen size={19} />, end: true },
          { to: '/teacher/schedule', label: 'Расписание', icon: <CalendarDays size={19} /> },
          { to: '/teacher/messages', label: 'Сообщения', icon: <MessageCircle size={19} /> },
          { to: '/campus', label: 'Карта', icon: <Map size={19} /> },
          { to: '/profile', label: 'Профиль', icon: <UserRound size={19} /> },
        ]
    : [
        { to: '/home', label: 'Главная', icon: <Home size={19} />, end: true },
        { to: '/schedule', label: 'Расписание', icon: <CalendarDays size={19} /> },
        { to: '/campus', label: 'Карта', icon: <Map size={19} /> },
        { to: '/grades', label: 'Учёба', icon: <GraduationCap size={19} /> },
        { to: '/requests', label: 'Заявки', icon: <FileText size={19} /> },
        { to: '/messages', label: 'Чаты', icon: <MessageCircle size={19} /> },
        { to: '/notifications', label: 'Уведомления', icon: <Bell size={19} /> },
        { to: '/profile', label: 'Профиль', icon: <UserRound size={19} /> },
      ]

  const mobileNav: NavItem[] = isStaff
    ? [
        { to: '/staff', label: 'Заявки', icon: <Users size={19} />, end: true },
        { to: '/notifications', label: 'События', icon: <Bell size={19} /> },
        { to: '/profile', label: 'Профиль', icon: <UserRound size={19} /> },
      ]
    : isTeacher
      ? [
          { to: '/teacher', label: 'Кабинет', icon: <BookOpen size={19} />, end: true },
          { to: '/teacher/schedule', label: 'Расписание', icon: <CalendarDays size={19} /> },
          { to: '/teacher/messages', label: 'Сообщения', icon: <MessageCircle size={19} /> },
          { to: '/campus', label: 'Карта', icon: <Map size={19} /> },
          { to: '/profile', label: 'Профиль', icon: <UserRound size={19} /> },
        ]
    : [
        { to: '/home', label: 'Главная', icon: <Home size={19} />, end: true },
        { to: '/schedule', label: 'Пары', icon: <CalendarDays size={19} /> },
        { to: '/grades', label: 'Учёба', icon: <GraduationCap size={19} /> },
        { to: '/requests', label: 'Заявки', icon: <FileText size={19} /> },
        { to: '/messages', label: 'Чаты', icon: <MessageCircle size={19} /> },
        { to: '/profile', label: 'Профиль', icon: <UserRound size={19} /> },
      ]

  const isAssistantOpen = location.pathname.startsWith('/assistant')
  const groupLine = student
    ? [student.group, `${student.course} курс`].filter(Boolean).join(' · ')
    : account?.role === 'staff'
      ? 'Сотрудник деканата'
      : teacher
        ? 'Преподаватель'
        : ''
  const sideAction =
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-info-bg hover:text-fg'

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[276px] flex-col overflow-hidden border-r border-border bg-surface/75 backdrop-blur-xl backdrop-saturate-150 lg:flex">
        {/* Шапка */}
        <div className="relative z-10 shrink-0 px-4 pb-3 pt-5">
          <NavLink
            to={isStaff ? '/staff' : isTeacher ? '/teacher' : '/home'}
            className="flex items-center gap-3"
            aria-label="На главную"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-solid text-white shadow-sm">
              <GraduationCap size={20} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-bold leading-tight tracking-tight">
                Деканат+
              </span>
              <span className="mt-0.5 block truncate text-[11px] leading-tight text-muted">
                Твой вуз. В одном месте
              </span>
            </span>
          </NavLink>

          {account && (
            <NavLink
              to="/profile"
              className="group mt-5 flex items-center gap-3 rounded-2xl border border-border bg-surface-2/60 p-2.5 transition-colors hover:border-primary/25 hover:bg-info-bg"
            >
              {account && (
                <Avatar name={account.shortName} hue={account.avatarHue} src={avatarSrc} />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold leading-tight">
                  {account.name}
                </span>
                <span className="mt-0.5 block truncate text-[11px] leading-tight text-muted">
                  {account.role === 'student' ? groupLine : account.position}
                </span>
              </span>
              <ChevronRight
                size={16}
                className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
              />
            </NavLink>
          )}
        </div>

        {/* Навигация */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-2 pt-1">
          <nav className="flex flex-col gap-1 pb-2">
            {mainNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                state={item.to === '/campus' ? { fromNav: true } : undefined}
                className={({ isActive }) => cn('nav-item', isActive && 'nav-item-active')}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.to === '/requests' && activeRequests > 0 && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-fg">
                    {activeRequests}
                  </span>
                )}
                {item.to === '/teacher/messages' && teacherUnread > 0 && (
                  <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {teacherUnread}
                  </span>
                )}
                {item.to === '/notifications' && unreadCount > 0 && (
                  <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            ))}
            {!isStaff && !isTeacher && (
              <NavLink
                to="/assistant"
                className={({ isActive }) => cn('nav-item', isActive && 'nav-item-active')}
              >
                <MessageCircle size={19} />
                <span className="flex-1">Помощник</span>
              </NavLink>
            )}
          </nav>

          {/* Действия — сразу под пунктами меню */}
          <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-info-bg hover:text-fg"
              onClick={toggleTheme}
              aria-label="Переключить тему"
            >
              <span className="inline-flex items-center gap-2.5">
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
              </span>
              <span
                className={cn(
                  'relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300',
                  theme === 'dark' ? 'bg-primary-solid' : 'bg-border',
                )}
              >
                <span
                  className={cn(
                    'absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300',
                    theme === 'dark' ? 'translate-x-[18px]' : 'translate-x-0.5',
                  )}
                />
              </span>
            </button>

            {!isStaff && !isTeacher && (
              <button type="button" className={sideAction} onClick={resetDemo}>
                <RotateCcw size={17} />
                <span>Сбросить демо</span>
              </button>
            )}

            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-danger/90 transition-colors hover:bg-danger-bg hover:text-danger"
              onClick={logout}
            >
              <LogOut size={17} />
              <span>Выйти</span>
            </button>
          </div>
        </div>

      </aside>

      <div className="flex min-h-dvh flex-col lg:pl-[276px]">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-lg lg:hidden">
          <div className="flex items-center justify-between px-4 py-2.5">
            <NavLink to={isStaff ? '/staff' : isTeacher ? '/teacher' : '/home'} aria-label="На главную">
              <Logo />
            </NavLink>
            <div className="flex items-center gap-1">
              <button
                className="btn-ghost px-2 py-2"
                onClick={toggleTheme}
                aria-label="Переключить тему"
              >
                {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
              </button>
              <NavLink
                to="/campus"
                state={{ fromNav: true }}
                className="rounded-xl px-2 py-2 text-muted hover:text-fg"
                aria-label="Карта корпусов"
              >
                <Map size={20} />
              </NavLink>
              <NavLink
                to="/notifications"
                className="relative rounded-xl px-2 py-2 text-muted hover:text-fg"
                aria-label="Уведомления"
              >
                <Bell size={20} />
                <UnreadDot />
              </NavLink>
            </div>
          </div>
        </header>

        <main
          className={cn(
            'mx-auto w-full max-w-3xl flex-1 px-4 pb-[calc(128px+env(safe-area-inset-bottom))] pt-4 sm:px-5 lg:pb-16 lg:pt-10',
          )}
        >
          <Outlet />
        </main>

        {/* Дисклеймер — в самом низу страницы на компьютере */}
        <ConceptStrip className="hidden border-t border-primary/25 lg:block" />
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden">
        <ConceptStrip className="border-b border-primary/25" />
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2">
          {mobileNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted',
                )
              }
            >
              {item.icon}
              <span>{item.label}</span>
              {item.to === '/requests' && activeRequests > 0 && (
                <span className="absolute right-[22%] top-1 h-4 min-w-4 rounded-full bg-primary px-1 text-[9px] font-bold leading-4 text-primary-fg">
                  {activeRequests}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {!isStaff && !isTeacher && !isAssistantOpen && location.pathname === '/home' && (
        <Assistant />
      )}
    </div>
  )
}
