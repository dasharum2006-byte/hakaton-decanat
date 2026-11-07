import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { Logo } from '../components/AppShell'
import { DEMO_PASSWORD, STAFF_PASSWORD, students, staff } from '../data/seed'
import { Avatar, Badge } from '../components/ui'
import { gpa } from '../lib/assistant'
import { formatGpa, plural } from '../lib/utils'

export function Demo() {
  const { loginAs } = useAuth()
  const navigate = useNavigate()

  const enter = (id: string, role: 'student' | 'staff') => {
    loginAs(id)
    navigate(role === 'staff' ? '/staff' : '/')
  }

  return (
    <div className="min-h-dvh bg-bg">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="btn-ghost -ml-2">
          <ArrowLeft size={16} />
          На главную
        </Link>
        <Logo />
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 pb-16 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Тестовые аккаунты</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Войдите в один клик — пароль вводить не нужно. У студентов разные данные:
            оценки, долги, расписание и заявки. Попробуйте открыть чужую заявку по
            прямой ссылке: доступа не будет.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {students.map((s) => {
            const debts = s.grades.filter((g) => g.status === 'debt').length
            const closed = s.grades.filter((g) => g.status === 'closed').length
            return (
              <article key={s.id} className="card flex flex-col p-5">
                <div className="flex items-center gap-3">
                  <Avatar name={s.shortName} hue={s.avatarHue} />
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold">{s.name}</h2>
                    <p className="truncate text-xs text-muted">
                      {s.group} · {s.course} курс
                    </p>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-surface-2 px-2 py-2">
                    <dt className="text-[10px] uppercase tracking-wide text-muted">Средний</dt>
                    <dd className="text-sm font-bold">{formatGpa(gpa(s.grades))}</dd>
                  </div>
                  <div className="rounded-xl bg-surface-2 px-2 py-2">
                    <dt className="text-[10px] uppercase tracking-wide text-muted">Закрыто</dt>
                    <dd className="text-sm font-bold">{closed}</dd>
                  </div>
                  <div className="rounded-xl bg-surface-2 px-2 py-2">
                    <dt className="text-[10px] uppercase tracking-wide text-muted">Долги</dt>
                    <dd className={`text-sm font-bold ${debts ? 'text-danger' : 'text-ok'}`}>
                      {debts}
                    </dd>
                  </div>
                </dl>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone="info">{s.program.split(' ')[1]?.replace(/[«»]/g, '') ?? 'ИТ'}</Badge>
                  <Badge tone={debts ? 'danger' : 'ok'}>
                    {debts
                      ? `${debts} ${plural(debts, 'долг', 'долга', 'долгов')}`
                      : 'без долгов'}
                  </Badge>
                  <Badge tone="default">
                    {s.schedule.length} {plural(s.schedule.length, 'пара', 'пары', 'пар')} в неделю
                  </Badge>
                </div>

                <div className="mt-4 rounded-xl border border-border bg-bg/60 px-3 py-2 text-[11px] leading-relaxed text-muted">
                  Логин <code className="font-semibold text-fg">{s.login}</code> · пароль{' '}
                  <code className="font-semibold text-fg">{DEMO_PASSWORD}</code>
                </div>

                <button
                  className="btn-primary mt-4 w-full"
                  onClick={() => enter(s.id, 'student')}
                >
                  Войти как {s.shortName}
                  <ArrowRight size={16} />
                </button>
              </article>
            )
          })}
        </div>

        <h2 className="mb-3 mt-8 text-sm font-bold uppercase tracking-wide text-muted">
          Кабинет сотрудника
        </h2>
        <article className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3">
            <Avatar name={staff[0].shortName} hue={staff[0].avatarHue} />
            <div>
              <p className="text-sm font-bold">{staff[0].name}</p>
              <p className="text-xs text-muted">
                {staff[0].position} · {staff[0].faculty}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">
              <ShieldCheck size={12} />
              видит заявки всех студентов
            </Badge>
            <Badge tone="default">
              {staff[0].login} / {STAFF_PASSWORD}
            </Badge>
            <button className="btn-primary" onClick={() => enter(staff[0].id, 'staff')}>
              Войти
              <ArrowRight size={16} />
            </button>
          </div>
        </article>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="card flex items-start gap-3 p-4">
            <CheckCircle2 className="mt-0.5 shrink-0 text-ok" size={18} />
            <p className="text-[12px] leading-relaxed text-muted">
              <span className="font-semibold text-fg">Проверка изоляции данных:</span>{' '}
              войдите как Анна и откройте{' '}
              <Link to="/requests/req_2001" className="font-semibold text-primary underline-offset-2 hover:underline">
                заявку Марка
              </Link>{' '}
              — увидите отказ в доступе.
            </p>
          </div>
          <div className="card flex items-start gap-3 p-4">
            <TriangleAlert className="mt-0.5 shrink-0 text-warn" size={18} />
            <p className="text-[12px] leading-relaxed text-muted">
              <span className="font-semibold text-fg">Демо-режим:</span> новая заявка сама
              проходит статусы за минуту, чтобы было видно процесс. Данные сбрасываются
              кнопкой «Сбросить демо».
            </p>
          </div>
        </div>

        <p className="mt-8 flex items-start gap-2 text-[11px] leading-relaxed text-muted">
          <GraduationCap size={16} className="mt-0.5 shrink-0" />
          Все аккаунты, ФИО, оценки и документы вымышлены. Прототип не подключён к
          информационным системам вуза.
        </p>
      </main>
    </div>
  )
}
