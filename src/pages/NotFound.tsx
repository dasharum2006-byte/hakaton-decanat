import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { ConceptStrip } from '../components/ConceptNote'

export function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-info-bg text-primary">
          <Compass size={26} />
        </div>
        <h1 className="text-2xl font-bold">Страница не найдена</h1>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Такой страницы нет. Вернитесь в кабинет или на главную.
        </p>
        <div className="mt-5 flex gap-2">
          <Link to="/home" className="btn-primary">
            В кабинет
          </Link>
          <Link to="/" className="btn-soft">
            На главную
          </Link>
        </div>
      </div>

      <ConceptStrip className="border-t border-primary/25" />
    </div>
  )
}
