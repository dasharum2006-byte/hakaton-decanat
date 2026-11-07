import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, FilePlus2, ShieldCheck } from 'lucide-react'
import { requestTypes } from '../data/seed'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/store'
import { cn } from '../lib/utils'
import { PageHeader } from '../components/ui'
import { RequestIcon } from '../components/request-ui'
import type { RequestType } from '../lib/types'

const STEPS = ['Тип заявки', 'Данные', 'Проверка']

export function RequestNew() {
  const { student } = useAuth()
  const { createRequest } = useData()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const initialType = requestTypes.find((t) => t.id === params.get('type'))

  const [type, setType] = useState<RequestType | null>(initialType ?? null)
  const [step, setStep] = useState(initialType ? 1 : 0)
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const missing = useMemo(() => {
    if (!type) return []
    return type.fields
      .filter((f) => f.required && !values[f.name]?.trim())
      .map((f) => f.label)
  }, [type, values])

  if (!student) return <Navigate to="/login" replace />

  const selectType = (t: RequestType) => {
    setType(t)
    setValues({})
    setError(null)
    setStep(1)
  }

  const next = () => {
    if (missing.length) {
      setError(`Заполните: ${missing.join(', ')}`)
      return
    }
    setError(null)
    setStep(2)
  }

  const submit = () => {
    if (!type) return
    const req = createRequest({ typeId: type.id, fields: values })
    if (req) navigate(`/requests/${req.id}`, { replace: true })
  }

  return (
    <div className="animate-rise">
      <Link to="/requests" className="btn-ghost -ml-2 mb-3">
        <ArrowLeft size={16} />
        К заявкам
      </Link>

      <PageHeader title="Новая заявка" subtitle="Оформление занимает меньше минуты" />

      {/* Шаги */}
      <ol className="mb-5 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                i < step && 'bg-ok text-white',
                i === step && 'bg-primary text-primary-fg',
                i > step && 'bg-surface-2 text-muted',
              )}
            >
              {i < step ? <Check size={13} /> : i + 1}
            </span>
            <span
              className={cn(
                'hidden text-[11px] font-semibold sm:block',
                i === step ? 'text-fg' : 'text-muted',
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {requestTypes.map((t) => (
            <button
              key={t.id}
              onClick={() => selectType(t)}
              className="card flex items-start gap-3 p-4 text-left transition-transform hover:-translate-y-0.5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info-bg text-primary">
                <RequestIcon name={t.icon} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-tight">{t.title}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-muted">
                  {t.description}
                </span>
                <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {t.eta}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {step === 1 && type && (
        <div className="card p-4 sm:p-5">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info-bg text-primary">
              <RequestIcon name={type.icon} />
            </span>
            <div>
              <p className="text-sm font-bold">{type.title}</p>
              <p className="text-[11px] text-muted">
                {type.description} · срок: {type.eta}
              </p>
            </div>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              next()
            }}
          >
            {type.fields.map((f) => (
              <div key={f.name}>
                <label className="label" htmlFor={f.name}>
                  {f.label}
                  {f.required && <span className="ml-1 text-danger">*</span>}
                </label>
                {f.type === 'select' ? (
                  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={f.label}>
                    {f.options?.map((opt) => {
                      const active = values[f.name] === opt
                      return (
                        <button
                          key={opt}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setValues((v) => ({ ...v, [f.name]: opt }))}
                          className={cn(
                            'rounded-xl border px-3 py-2 text-xs font-medium transition-colors',
                            active
                              ? 'border-primary bg-info-bg text-primary'
                              : 'border-border bg-surface text-muted hover:text-fg',
                          )}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                ) : f.type === 'textarea' ? (
                  <textarea
                    id={f.name}
                    className="input min-h-[88px] resize-y"
                    placeholder={f.placeholder}
                    value={values[f.name] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  />
                ) : (
                  <input
                    id={f.name}
                    className="input"
                    placeholder={f.placeholder}
                    value={values[f.name] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  />
                )}
              </div>
            ))}

            {error && (
              <p className="rounded-xl border border-danger/30 bg-danger-bg px-3 py-2 text-xs font-medium text-danger">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="btn-soft flex-1"
                onClick={() => (initialType ? navigate('/requests') : setStep(0))}
              >
                <ArrowLeft size={16} />
                Назад
              </button>
              <button type="submit" className="btn-primary flex-1">
                Далее
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 2 && type && (
        <div className="card p-4 sm:p-5">
          <h2 className="text-sm font-bold">Проверьте данные</h2>
          <dl className="mt-3 space-y-2">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-2">
              <dt className="text-[11px] uppercase tracking-wide text-muted">Заявка</dt>
              <dd className="text-right text-sm font-semibold">{type.title}</dd>
            </div>
            {type.fields.map((f) => (
              <div key={f.name} className="flex items-start justify-between gap-4 border-b border-border pb-2">
                <dt className="text-[11px] uppercase tracking-wide text-muted">{f.label}</dt>
                <dd className="max-w-[60%] text-right text-sm">
                  {values[f.name]?.trim() ? values[f.name] : <span className="text-muted">—</span>}
                </dd>
              </div>
            ))}
            <div className="flex items-start justify-between gap-4">
              <dt className="text-[11px] uppercase tracking-wide text-muted">Срок</dt>
              <dd className="text-right text-sm font-semibold text-primary">{type.eta}</dd>
            </div>
          </dl>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-surface-2 px-3 py-2.5">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-ok" />
            <p className="text-[11px] leading-relaxed text-muted">
              Заявка привязана к вашему аккаунту — другие студенты её не увидят. Все данные
              в демо вымышлены.
            </p>
          </div>

          <div className="mt-4 flex gap-2">
            <button className="btn-soft flex-1" onClick={() => setStep(1)}>
              <ArrowLeft size={16} />
              Изменить
            </button>
            <button className="btn-primary flex-1" onClick={submit}>
              <FilePlus2 size={16} />
              Отправить
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
