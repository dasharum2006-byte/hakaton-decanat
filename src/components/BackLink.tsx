import { ChevronLeft } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'

/**
 * Единая кнопка «вернуться назад» для всех страниц.
 * Если передан `to` — обычная ссылка, иначе возврат по истории,
 * а при открытии страницы по прямой ссылке — переход на `fallback`.
 */
export function BackLink({
  to,
  label = 'Назад',
  fallback = '/home',
  className,
}: {
  to?: string
  label?: string
  fallback?: string
  className?: string
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const classes = cn(
    'btn-soft mb-3 inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm',
    className,
  )

  if (to) {
    return (
      <Link to={to} className={classes}>
        <ChevronLeft size={18} />
        {label}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={() => (location.key === 'default' ? navigate(fallback) : navigate(-1))}
    >
      <ChevronLeft size={18} />
      {label}
    </button>
  )
}
