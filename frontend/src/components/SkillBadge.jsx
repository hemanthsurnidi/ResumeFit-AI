import { CheckCircle, XCircle, AlertCircle, ArrowRightLeft } from 'lucide-react'

const TYPE_CONFIG = {
  matching: {
    className: 'bg-green-900/40 text-green-300 border border-green-700/50',
    icon: CheckCircle,
  },
  missing: {
    className: 'bg-red-900/40 text-red-300 border border-red-700/50',
    icon: XCircle,
  },
  partial: {
    className: 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50',
    icon: AlertCircle,
  },
  transferable: {
    className: 'bg-blue-900/40 text-blue-300 border border-blue-700/50',
    icon: ArrowRightLeft,
  },
}

/**
 * Color-coded skill badge.
 * @param {{ skill: string, type: 'matching'|'missing'|'partial'|'transferable' }} props
 */
export default function SkillBadge({ skill, type = 'matching' }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.matching
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <Icon size={11} />
      {skill}
    </span>
  )
}
