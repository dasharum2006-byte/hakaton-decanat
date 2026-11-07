import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  FileCheck2,
  GraduationCap,
  KeyRound,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Smartphone,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { Logo } from '../components/AppShell'

const features = [
  {
    icon: <MessageCircle size={20} />,
    title: 'Помощник, а не меню',
    text: 'Спросите «когда окна?» или «закажи справку» — ответ по вашим данным за секунду.',
  },
  {
    icon: <CalendarDays size={20} />,
    title: 'Расписание без сюрпризов',
    text: 'Переносы и замены подсвечены сразу. Следующая пара — с обратным отсчётом.',
  },
  {
    icon: <GraduationCap size={20} />,
    title: 'Понятная учёба',
    text: 'Оценки, долги и средний балл — одной картиной, без поиска по таблицам.',
  },
  {
    icon: <FileCheck2 size={20} />,
    title: 'Справки как доставка',
    text: 'Заявка, таймлайн статусов и ETA. Видно, на каком этапе документ.',
  },
  {
    icon: <BellRing size={20} />,
    title: 'Ничего не пропустить',
    text: 'Объявления деканата, дедлайны и изменения — в одном потоке.',
  },
  {
    icon: <Smartphone size={20} />,
    title: 'Телефон — первый',
    text: 'Все сценарии работают от 360 px. Можно добавить на главный экран.',
  },
]

export function Landing() {
  const { account } = useAuth()

  return (
    <div className="min-h-dvh bg-bg">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          {account ? (
            <Link to={account.role === 'staff' ? '/staff' : '/home'} className="btn-primary">
              Открыть кабинет
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/demo" className="btn-ghost hidden sm:inline-flex">
                Демо-аккаунты
              </Link>
              <Link to="/login" className="btn-primary">
                Войти
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <section className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-10 sm:px-10 sm:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl"
          />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-info-bg px-3 py-1 text-[11px] font-semibold text-primary">
              <Sparkles size={12} />
              Концепт для конкурса «Цифровой деканат будущего»
            </span>
            <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Деканат, который{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                отвечает за секунды
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Расписание, оценки, справки и объявления — в одном кабинете. С помощником,
              которому можно просто написать. С телефона. Без очередей.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link to="/demo" className="btn-primary px-5 py-3">
                Попробовать демо
                <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="btn-soft px-5 py-3">
                <KeyRound size={16} />
                Войти по логину
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ['2', 'демо-студента', 'данные полностью разделены'],
                ['1 мин', 'до готовой справки', 'в демо-режиме — сразу'],
                ['360 px', 'минимальный экран', 'полный мобильный сценарий'],
              ].map(([big, mid, small]) => (
                <div key={mid} className="rounded-2xl border border-border bg-bg/60 px-4 py-3">
                  <p className="text-xl font-extrabold">{big}</p>
                  <p className="text-sm font-semibold">{mid}</p>
                  <p className="text-xs text-muted">{small}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Что внутри</h2>
          <p className="mt-1 text-sm text-muted">
            Обязательное ядро из задания — и несколько идей сверху.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <article key={f.title} className="card p-4">
                <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-info-bg text-primary">
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold">{f.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-3 sm:grid-cols-2">
          <div className="card flex items-start gap-3 p-5">
            <ShieldCheck className="mt-0.5 shrink-0 text-ok" size={22} />
            <div>
              <h3 className="text-sm font-bold">Безопасность по умолчанию</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                Пароли хранятся только как хэши, сессия — в браузере, чужие заявки
                недоступны даже по прямой ссылке. Ключей и внешних API нет.
              </p>
            </div>
          </div>
          <div className="card flex items-start gap-3 p-5">
            <GraduationCap className="mt-0.5 shrink-0 text-primary" size={22} />
            <div>
              <h3 className="text-sm font-bold">Только вымышленные данные</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                Студенты, преподаватели и оценки — тестовые. Это прототип, а не
                официальный сервис вуза. Логотип вуза не используется.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-primary/20 bg-info-bg px-6 py-8 text-center">
          <h2 className="text-xl font-bold">Посмотрите глазами студента</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Два аккаунта с разными данными — видно, что кабинет у каждого свой.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <Link to="/demo" className="btn-primary px-5 py-3">
              Тестовые аккаунты
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-6 text-center text-xs leading-relaxed text-muted">
        <p className="font-semibold text-fg">Деканат+ — концепт для конкурса</p>
        <p className="mx-auto mt-1 max-w-xl">
          Не является официальным сервисом вуза. Все персональные данные, оценки и
          документы вымышлены. Прототип создан с помощью ИИ-ассистентов.
        </p>
      </footer>
    </div>
  )
}
