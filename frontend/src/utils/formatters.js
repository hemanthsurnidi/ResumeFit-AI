/**
 * Format a numeric score (0-100) to a percentage string with Tailwind color class.
 * @param {number} score
 * @returns {{ text: string, colorClass: string, bgClass: string }}
 */
export function formatScore(score) {
  const num = Number(score) || 0
  const text = `${Math.round(num)}%`
  let colorClass = 'text-red-700 font-bold'
  let bgClass = 'bg-red-100'
  if (num >= 80) { colorClass = 'text-[#0e4513] font-bold'; bgClass = 'bg-[#d8eed4]' }
  else if (num >= 60) { colorClass = 'text-amber-800 font-bold'; bgClass = 'bg-amber-100' }
  else if (num >= 40) { colorClass = 'text-orange-800 font-bold'; bgClass = 'bg-orange-100' }
  return { text, colorClass, bgClass }
}

/**
 * Format an ISO date string to a human-readable date.
 * @param {string} isoString
 * @returns {string}
 */
export function formatDate(isoString) {
  if (!isoString) return '—'
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  } catch {
    return isoString
  }
}

/**
 * Truncate text to a max length, appending ellipsis.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return ''
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text
}

/**
 * Map an action priority string to a high-contrast Tailwind color class set.
 * @param {'high'|'medium'|'low'} priority
 * @returns {{ badge: string, border: string, text: string }}
 */
export function getPriorityColor(priority) {
  switch ((priority || '').toLowerCase()) {
    case 'high':
      return { badge: 'bg-red-100 text-red-800 border-red-300 font-bold', border: 'border-red-300', text: 'text-red-900 font-bold' }
    case 'medium':
      return { badge: 'bg-amber-100 text-amber-900 border-amber-300 font-bold', border: 'border-amber-300', text: 'text-amber-950 font-bold' }
    case 'low':
    default:
      return { badge: 'bg-blue-100 text-blue-900 border-blue-300 font-bold', border: 'border-blue-300', text: 'text-blue-950 font-bold' }
  }
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}
