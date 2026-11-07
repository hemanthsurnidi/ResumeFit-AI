/**
 * Format a numeric score (0-100) to a percentage string with Tailwind color class.
 * @param {number} score
 * @returns {{ text: string, colorClass: string, bgClass: string }}
 */
export function formatScore(score) {
  const num = Number(score) || 0
  const text = `${Math.round(num)}%`
  let colorClass = 'text-red-400'
  let bgClass = 'bg-red-900/30'
  if (num >= 80) { colorClass = 'text-green-400'; bgClass = 'bg-green-900/30' }
  else if (num >= 60) { colorClass = 'text-yellow-400'; bgClass = 'bg-yellow-900/30' }
  else if (num >= 40) { colorClass = 'text-orange-400'; bgClass = 'bg-orange-900/30' }
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
 * Map an action priority string to a Tailwind color class set.
 * @param {'high'|'medium'|'low'} priority
 * @returns {{ badge: string, border: string, text: string }}
 */
export function getPriorityColor(priority) {
  switch ((priority || '').toLowerCase()) {
    case 'high':
      return { badge: 'bg-red-900/40 text-red-300 border-red-700', border: 'border-red-700/40', text: 'text-red-300' }
    case 'medium':
      return { badge: 'bg-yellow-900/40 text-yellow-300 border-yellow-700', border: 'border-yellow-700/40', text: 'text-yellow-300' }
    case 'low':
    default:
      return { badge: 'bg-blue-900/40 text-blue-300 border-blue-700', border: 'border-blue-700/40', text: 'text-blue-300' }
  }
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}
