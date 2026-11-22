import { useEffect, useState } from 'react'

/**
 * Пользовательская иконка профиля.
 *
 * Безопасность:
 *  - принимаем только PNG и JPEG — и по MIME-типу, и по сигнатуре файла
 *    (расширению и заголовку Content-Type из файловой системы не доверяем);
 *  - файл обязан реально декодироваться браузером как картинка;
 *  - ограничены размер файла (2 МБ) и стороны исходника (4096 px);
 *  - изображение перерисовывается в canvas 256×256 и заново кодируется в PNG:
 *    это отбрасывает метаданные, EXIF и любые вложенные данные, поэтому
 *    сохраняется гарантированно «чистая» растровая картинка (никакого SVG/HTML/JS);
 *  - в localStorage кладём только data-URL с префиксом `data:image/png;base64,`
 *    и проверяем префикс при чтении (защита от подмены на javascript:-ссылку);
 *  - ничего не отправляется на сервер: картинка остаётся в браузере.
 */

const STORAGE_PREFIX = 'dekanat.avatar.v1.'
const CHANGE_EVENT = 'dekanat-avatar-change'

const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2 МБ
const MAX_SOURCE_SIDE = 4096
const MIN_SOURCE_SIDE = 16
const OUTPUT_SIDE = 256
const MAX_DATA_URL_LENGTH = 400 * 1024
const DATA_URL_PREFIX = 'data:image/png;base64,'

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff]

const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
}

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((byte, i) => bytes[i] === byte)
}

/** Определяет формат по первым байтам файла, а не по расширению */
function sniffType(bytes: Uint8Array): 'image/png' | 'image/jpeg' | null {
  if (startsWith(bytes, PNG_SIGNATURE)) return 'image/png'
  if (startsWith(bytes, JPEG_SIGNATURE)) return 'image/jpeg'
  return null
}

/** Проверяет файл и превращает его в безопасную квадратную PNG-иконку */
export async function fileToAvatar(file: File): Promise<string> {
  if (!ALLOWED_TYPES[file.type]) {
    throw new Error('Можно загрузить только PNG или JPEG')
  }
  if (file.size === 0) throw new Error('Файл пустой')
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`Файл больше ${MAX_FILE_BYTES / 1024 / 1024} МБ`)
  }

  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const type = sniffType(bytes)
  if (!type || type !== file.type) {
    throw new Error('Содержимое файла не совпадает с форматом PNG или JPEG')
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(new Blob([buffer], { type }))
  } catch {
    throw new Error('Не удалось прочитать изображение')
  }

  try {
    const { width, height } = bitmap
    if (width < MIN_SOURCE_SIDE || height < MIN_SOURCE_SIDE) {
      throw new Error('Слишком маленькое изображение')
    }
    if (width > MAX_SOURCE_SIDE || height > MAX_SOURCE_SIDE) {
      throw new Error(`Стороны изображения должны быть не больше ${MAX_SOURCE_SIDE} px`)
    }

    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIDE
    canvas.height = OUTPUT_SIDE
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Браузер не поддерживает обработку изображений')

    // Вписываем по принципу cover и обрезаем по центру
    const scale = Math.max(OUTPUT_SIDE / width, OUTPUT_SIDE / height)
    const drawWidth = width * scale
    const drawHeight = height * scale
    ctx.drawImage(
      bitmap,
      (OUTPUT_SIDE - drawWidth) / 2,
      (OUTPUT_SIDE - drawHeight) / 2,
      drawWidth,
      drawHeight,
    )

    const dataUrl = canvas.toDataURL('image/png')
    if (!dataUrl.startsWith(DATA_URL_PREFIX) || dataUrl.length > MAX_DATA_URL_LENGTH) {
      throw new Error('Не удалось подготовить изображение')
    }
    return dataUrl
  } finally {
    bitmap.close()
  }
}

function readRaw(id: string): string | null {
  try {
    const value = localStorage.getItem(STORAGE_PREFIX + id)
    if (!value) return null
    // Разрешаем только наш формат: data-URL PNG ограниченной длины
    if (!value.startsWith(DATA_URL_PREFIX) || value.length > MAX_DATA_URL_LENGTH) {
      localStorage.removeItem(STORAGE_PREFIX + id)
      return null
    }
    return value
  } catch {
    return null
  }
}

function notify() {
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function getAvatar(id: string): string | null {
  return readRaw(id)
}

export function saveAvatar(id: string, dataUrl: string): void {
  if (!dataUrl.startsWith(DATA_URL_PREFIX) || dataUrl.length > MAX_DATA_URL_LENGTH) {
    throw new Error('Некорректные данные изображения')
  }
  try {
    localStorage.setItem(STORAGE_PREFIX + id, dataUrl)
  } catch {
    throw new Error('Не хватает места в хранилище браузера')
  }
  notify()
}

export function removeAvatar(id: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + id)
  } catch {
    /* игнорируем */
  }
  notify()
}

/** Иконка текущего пользователя с синхронизацией между компонентами и вкладками */
export function useAvatar(id?: string): string | null {
  const [src, setSrc] = useState<string | null>(() => (id ? readRaw(id) : null))

  useEffect(() => {
    setSrc(id ? readRaw(id) : null)
    const sync = () => setSrc(id ? readRaw(id) : null)
    window.addEventListener(CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [id])

  return src
}
