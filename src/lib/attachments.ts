import { useCallback, useEffect, useState } from 'react'

/** Файл, прикреплённый к работе студента (храним только метаданные) */
export interface Attachment {
  studentId: string
  gradeId: string
  workId: string
  name: string
  size: number
  at: string
}

const KEY = 'dekanat.attachments.v1'
const EVENT = 'dekanat-attachments-change'

/** Разрешённые расширения для прикрепляемых работ */
export const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'zip', 'png', 'jpg', 'jpeg']
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024

function readAll(): Attachment[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? (list as Attachment[]) : []
  } catch {
    return []
  }
}

function writeAll(list: Attachment[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* игнорируем переполнение */
  }
  window.dispatchEvent(new Event(EVENT))
}

/** Проверка файла: расширение и размер */
export function validateAttachment(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Можно прикрепить только: ${ALLOWED_EXTENSIONS.join(', ')}`
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `Файл больше ${MAX_ATTACHMENT_BYTES / 1024 / 1024} МБ`
  }
  return null
}

/** Прикреплённые файлы для конкретной дисциплины студента */
export function useAttachments(studentId?: string, gradeId?: string) {
  const [items, setItems] = useState<Attachment[]>(readAll)

  useEffect(() => {
    const sync = () => setItems(readAll())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const forWork = useCallback(
    (workId: string) =>
      items.find(
        (a) => a.studentId === studentId && a.gradeId === gradeId && a.workId === workId,
      ) ?? null,
    [items, studentId, gradeId],
  )

  const attach = useCallback(
    (workId: string, file: File): string | null => {
      if (!studentId || !gradeId) return 'Не удалось определить работу'
      const error = validateAttachment(file)
      if (error) return error

      const next = readAll().filter(
        (a) => !(a.studentId === studentId && a.gradeId === gradeId && a.workId === workId),
      )
      next.push({
        studentId,
        gradeId,
        workId,
        name: file.name,
        size: file.size,
        at: new Date().toISOString(),
      })
      writeAll(next)
      return null
    },
    [studentId, gradeId],
  )

  const detach = useCallback(
    (workId: string) => {
      writeAll(
        readAll().filter(
          (a) => !(a.studentId === studentId && a.gradeId === gradeId && a.workId === workId),
        ),
      )
    },
    [studentId, gradeId],
  )

  return { items, forWork, attach, detach }
}
