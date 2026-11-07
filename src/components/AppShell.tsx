import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  FileText,
  GraduationCap,
  Home,
  LogOut,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
  UserRound,
  Users,
} from 'lucide-react'
import { useAuth, useTheme } from '../lib/auth'
import { useData } from '../lib/store'
import { Avatar, UnreadDot } from './ui'
import { Assistant } from './Assistant'
import { cn } from '../lib/utils'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/25">
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
  const { account, student, logout } = useAuth()
  const { unreadCount, myRequests, resetDemo } = useData()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const isStaff = account?.role === 'staff'

  const activeRequests = myRequests.filter(
    (r) => r.status === 'new' || r.status === 'in_progress' || r.status === 'signed',
  ).length

  const mainNav: NavItem[] = isStaff
    ? [
        { to: '/staff', label: 'Заявки студентов', icon: <Users size={19} />, end: true },
        { to: '/notifications', label: 'Уведомления', icon: <Bell size={19} /> },
        { to: '/profile', label: 'Профиль', icon: <UserRound size={19} /> },
      ]
    : [
        { to: '/home', label: 'Главная', icon: <Home size={19} />, end: true },
        { to: '/schedule', label: 'Расписание', icon: <CalendarDays size={19} /> },
        { to: '/grades', label: 'Учёба', icon: <GraduationCap size={19} /> },
        { to: '/requests', label: 'Заявки', icon: <FileText size={19} /> },
        { to: '/notifications', label: 'Уведомления', icon: <Bell size={19} /> },
        { to: '/profile', label: 'Профиль', icon: <UserRound size={19} /> },
      ]

  const mobileNav: NavItem[] = isStaff
    ? [
        { to: '/staff', label: 'Заявки', icon: <Users size={19} />, end: true },
        { to: '/notifications', label: 'События', icon: <Bell size={19} /> },
        { to: '/profile', label: 'Профиль', icon: <UserRound size={19} /> },
      ]
    : [
        { to: '/home', label: 'Главная', icon: <Home size={19} />, end: true },
        { to: '/schedule', label: 'Пары', icon: <CalendarDays size={19} /> },
        { to: '/grades', label: 'Учёба', icon: <GraduationCap size={19} /> },
        { to: '/requests', label: 'Заявки', icon: <FileText size={19} /> },
        { to: '/profile', label: 'Профиль', icon: <UserRound size={19} /> },
      ]

  const isAssistantOpen = location.pathname.startsWith('/assistant')

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface/70 px-4 py-5 backdrop-blur lg:flex">
        <div className="px-1">
          <Logo />
        </div>

        <div className="mt-4 rounded-xl border border-primary/20 bg-info-bg px-3 py-2 text-[11px] font-medium leading-snug text-primary">
          Концепт для конкурса. Не официальный сервис вуза.
        </div>

        <nav className="mt-5 flex flex-1 flex-col gap-1">
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn('nav-item', isActive && 'nav-item-active')}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.to === '/requests' && activeRequests > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-fg">
                  {activeRequests}
                </span>
              )}
              {item.to === '/notifications' && unreadCount > 0 && (
                <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
          {!isStaff && (
            <NavLink
              to="/assistant"
              className={({ isActive }) => cn('nav-item', isActive && 'nav-item-active')}
            >
              <Sparkles size={19} />
              <span className="flex-1">Помощник</span>
              <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                ИИ
              </span>
            </NavLink>
          )}
        </nav>

        <div className="mt-4 space-y-1 border-t border-border pt-4">
          <button className="nav-item w-full" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
          </button>
          {!isStaff && (
            <button className="nav-item w-full" onClick={resetDemo}>
              <RotateCcw size={18} />
              <span>Сбросить демо</span>
            </button>
          )}
          <button className="nav-item w-full" onClick={logout}>
            <LogOut size={18} />
            <span>Выйти</span>
          </button>
        </div>

        {account && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-surface-2 p-2.5">
            <Avatar name={account.shortName} hue={account.avatarHue} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{account.name}</p>
              <p className="truncate text-[11px] text-muted">
                {account.role === 'student' ? student?.group : 'Сотрудник деканата'}
              </p>
            </div>
          </div>
        )}
      </aside>

      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-lg lg:hidden">
          <div className="flex items-center justify-between px-4 py-2.5">
            <NavLink to={isStaff ? '/staff' : '/home'} aria-label="На главную">
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
                to="/notifications"
                className="relative rounded-xl px-2 py-2 text-muted hover:text-fg"
                aria-label="Уведомления"
              >
                <Bell size={20} />
                <UnreadDot />
              </NavLink>
              <NavLink to="/profile" aria-label="Профиль">
                <Avatar name={account?.shortName ?? '?'} hue={account?.avatarHue ?? 250} size="sm" />
              </NavLink>
            </div>
          </div>
        </header>

        <main
          className={cn(
            'mx-auto w-full max-w-3xl px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-4 sm:px-5 lg:pb-16 lg:pt-10',
          )}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden">
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

      {!isStaff && !isAssistantOpen && <Assistant />}
    </div>
  )
}
