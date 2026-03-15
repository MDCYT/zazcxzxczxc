import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const DISPLAY_OFFSET_HOURS = 7
const DISPLAY_OFFSET_MS = DISPLAY_OFFSET_HOURS * 60 * 60 * 1000

function parseApiTimestamp(timestamp: string) {
  const raw = timestamp.trim()

  // Caso comun de MySQL: "YYYY-MM-DD HH:mm:ss" (sin zona).
  // Lo tratamos como UTC para evitar desfases de varias horas en frontend.
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(raw)) {
    return new Date(`${raw.replace(' ', 'T')}Z`)
  }

  // ISO sin zona explicita: forzamos UTC.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(raw)) {
    return new Date(`${raw}Z`)
  }

  return new Date(raw)
}

export function getSafeDate(timestamp: string) {
  const parsed = parseApiTimestamp(timestamp)
  if (Number.isNaN(parsed.getTime())) return null

  return new Date(parsed.getTime() - DISPLAY_OFFSET_MS)
}

export function formatDateTime(timestamp: string) {
  const safeDate = getSafeDate(timestamp)
  if (!safeDate) return 'Sin fecha'

  const day = String(safeDate.getDate()).padStart(2, '0')
  const month = String(safeDate.getMonth() + 1).padStart(2, '0')
  const year = safeDate.getFullYear()
  const hours = String(safeDate.getHours()).padStart(2, '0')
  const minutes = String(safeDate.getMinutes()).padStart(2, '0')
  const seconds = String(safeDate.getSeconds()).padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}

export function formatUpdatedAgo(timestamp: string, prefix: string = 'Actualizado') {
  const safeDate = getSafeDate(timestamp)
  if (!safeDate) return 'Sin fecha'

  return `${prefix} ${formatDistanceToNow(safeDate, { addSuffix: true, locale: es })}`
}

export function formatAgo(timestamp: string) {
  const safeDate = getSafeDate(timestamp)
  if (!safeDate) return 'Sin fecha'

  return formatDistanceToNow(safeDate, { addSuffix: true, locale: es })
}
