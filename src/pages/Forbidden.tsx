import { Link } from 'react-router-dom'
import { ArrowLeft, Lock } from 'lucide-react'

export function Forbidden() {
  return (
    <div className="animate-rise mx-auto mt-4 max-w-md">
      <div className="card p-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-bg text-danger">
          <Lock size={26} />
        </div>
        <h1 className="text-xl font-bold">403 · Нет доступа</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Эта заявка принадлежит другому студенту. Кабинет показывает только ваши данные —
          даже если открыть чужую ссылку напрямую.
        </p>
        <div className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-left text-[11px] leading-relaxed text-muted">
          <span className="font-semibold text-fg">Так и должно быть.</span> Проверка
          владельца выполняется по идентификатору из сессии, а не из адреса страницы.
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link to="/requests" className="btn-primary flex-1">
            Мои заявки
          </Link>
          <Link to="/" className="btn-soft flex-1">
            <ArrowLeft size={16} />
            На главную
          </Link>
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">
        Демо-прототип. Все персональные данные вымышлены.
      </p>
    </div>
  )
}
