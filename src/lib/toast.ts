import { uid } from './utils'

export interface ToastItem {
  id: string
  title: string
  body?: string
  tone?: 'default' | 'success' | 'warn'
}

type Listener = (t: ToastItem) => void

const listeners = new Set<Listener>()

export function toast(t: Omit<ToastItem, 'id'>) {
  const item = { ...t, id: uid('toast') }
  listeners.forEach((l) => l(item))
}

export function subscribeToasts(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
