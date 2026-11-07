import { CheckCircle, XCircle, AlertCircle, ArrowRightLeft } from 'lucide-react'

const TYPE_CONFIG = {
  matching: {
    className: 'bg-[#d8eed4] text-[#0a380e] border border-[#5ca656] shadow-2xs font-bold',
    iconColor: 'text-[#145c18]',
    icon: CheckCircle,
  },
  missing: {
    className: 'bg-[#fee2e2] text-[#991b1b] border border-[#f87171] shadow-2xs font-bold',
    iconColor: 'text-[#b91c1c]',
    icon: XCircle,
  },
  partial: {
    className: 'bg-[#fef3c7] text-[#854d0e] border border-[#f59e0b] shadow-2xs font-bold',
    iconColor: 'text-[#b45309]',
    icon: AlertCircle,
  },
  transferable: {
    className: 'bg-[#dbeafe] text-[#1e40af] border border-[#60a5fa] shadow-2xs font-bold',
    iconColor: 'text-[#1d4ed8]',
    icon: ArrowRightLeft,
  },
}

/**
 * High-contrast color-coded skill badge.
 * @param {{ skill: string, type: 'matching'|'missing'|'partial'|'transferable' }} props
 */
export default function SkillBadge({ skill, type = 'matching' }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.matching
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-transform hover:scale-105 ${config.className}`}>
      <Icon size={13} className={`shrink-0 ${config.iconColor}`} />
      <span>{skill}</span>
    </span>
  )
}
