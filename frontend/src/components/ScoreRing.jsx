import { useEffect, useRef } from 'react'

/**
 * Animated circular score ring.
 * @param {{ score: number, size?: number, strokeWidth?: number, label?: string }} props
 */
export default function ScoreRing({ score = 0, size = 120, strokeWidth = 10, label = '' }) {
  const circleRef = useRef(null)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedScore = Math.max(0, Math.min(100, Number(score) || 0))

  // Color based on score
  let color = '#ef4444' // red
  if (clampedScore >= 80) color = '#10b981'      // green
  else if (clampedScore >= 60) color = '#f59e0b' // yellow
  else if (clampedScore >= 40) color = '#f97316' // orange

  useEffect(() => {
    if (!circleRef.current) return
    // Start fully empty, animate to score
    circleRef.current.style.strokeDashoffset = `${circumference}`
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const offset = circumference - (clampedScore / 100) * circumference
        circleRef.current.style.strokeDashoffset = `${offset}`
      })
    })
  }, [clampedScore, circumference])

  return (
    <div className="flex flex-col items-center gap-1" role="img" aria-label={`${label}: ${clampedScore}%`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1f2937"
          strokeWidth={strokeWidth}
        />
        {/* Animated foreground */}
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          style={{ transition: 'stroke-dashoffset 1s ease-in-out', filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
        {/* Score text — counter-rotate so it reads normally */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize={size * 0.22}
          fontWeight="700"
          style={{ transform: `rotate(90deg)`, transformOrigin: '50% 50%', fontFamily: 'inherit' }}
        >
          {clampedScore}%
        </text>
      </svg>
      {label && (
        <span className="text-xs font-medium text-gray-400 text-center leading-tight">{label}</span>
      )}
    </div>
  )
}
