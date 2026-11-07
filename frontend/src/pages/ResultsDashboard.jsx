import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Sparkles,
  ArrowLeft,
  Download,
  Printer,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  FileText,
  Briefcase,
  Layers,
  CheckSquare,
  ShieldAlert,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getAnalysis } from '../services/api'
import ScoreRing from '../components/ScoreRing'
import SkillBadge from '../components/SkillBadge'
import { getPriorityColor } from '../utils/formatters'

export default function ResultsDashboard() {
  const { analysisId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedBulletIdx, setCopiedBulletIdx] = useState(null)

  useEffect(() => {
    async function loadAnalysis() {
      try {
        const res = await getAnalysis(analysisId)
        setData(res.data)
      } catch (err) {
        setError(err.userMessage || 'Failed to load analysis report.')
      } finally {
        setLoading(false)
      }
    }
    loadAnalysis()
  }, [analysisId])

  const handleCopyBullet = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedBulletIdx(idx)
    toast.success('Copied improved bullet to clipboard!')
    setTimeout(() => setCopiedBulletIdx(null), 2000)
  }

  const handleDownloadJSON = () => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resumefit_analysis_${analysisId.slice(0, 8)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#86efac] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#80a582] text-sm">Loading alignment analysis report...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <AlertTriangle size={48} className="text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Analysis Not Found</h2>
        <p className="text-[#7da180] text-sm">{error || 'Could not locate this analysis report.'}</p>
        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2b6430] hover:bg-[#387e3d] text-white text-xs font-medium"
        >
          <ArrowLeft size={16} /> Return to Workspace
        </Link>
      </div>
    )
  }

  const { analysis, model_used, processing_time_ms, created_at } = data

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1c3820] pb-5 print:hidden">
        <Link
          to="/analyze"
          className="inline-flex items-center gap-1.5 text-xs text-[#82a87d] hover:text-[#d3f2cc] font-medium"
        >
          <ArrowLeft size={16} /> Back to Analysis Workspace
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadJSON}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#122816] hover:bg-[#1a381f] text-xs text-[#bde3b5] border border-[#2a5430] font-medium transition-colors"
          >
            <Download size={14} /> Export JSON
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#122816] hover:bg-[#1a381f] text-xs text-[#bde3b5] border border-[#2a5430] font-medium transition-colors"
          >
            <Printer size={14} /> Print Report
          </button>
        </div>
      </div>

      {/* Main Score & Meta Header */}
      <div className="bg-gradient-to-r from-[#0a1a0e] via-[#0d2213] to-[#14331a] border border-[#1e3f24] rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16351c] border border-[#2b5c32] text-[#86efac] text-xs font-semibold">
              <Sparkles size={13} /> {model_used}
            </div>
            <h1 className="text-3xl font-bold text-[#eef9ef] tracking-tight">
              Resume Alignment Scorecard
            </h1>
            <p className="text-sm text-[#b2d5b6] leading-relaxed">
              {analysis.summary_recommendation ||
                'Candidate exhibits strong foundational alignment with specific skill gaps and formatting optimizations identified below.'}
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-[#789d7b] justify-center lg:justify-start pt-2">
              <span>Target Role: <strong className="text-[#d5f5dc]">{analysis.target_role_detected || 'Software Engineer'}</strong></span>
              <span>•</span>
              <span>Time: <strong className="text-[#d5f5dc]">{processing_time_ms}ms</strong></span>
              <span>•</span>
              <span>Date: <strong className="text-[#d5f5dc]">{new Date(created_at).toLocaleDateString()}</strong></span>
            </div>
          </div>

          {/* Primary Ring */}
          <div className="flex flex-col items-center p-4 bg-[#08150c] border border-[#1c3c21] rounded-2xl shadow-inner">
            <ScoreRing
              score={analysis.overall_match_percentage}
              size={130}
              strokeWidth={10}
              label="Overall Match"
            />
            <p className="text-xs text-[#82a87d] font-medium mt-2">Overall Alignment</p>
          </div>
        </div>

        {/* Sub-Score Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-[#1a3820]">
          <div className="bg-[#08150c]/80 rounded-xl p-4 border border-[#1b3a20]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-[#7ea581] font-medium">Technical Skills</span>
              <span className="text-sm font-bold text-[#eef9ef]">{Math.round(analysis.skill_match_score)}%</span>
            </div>
            <div className="w-full bg-[#122816] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#387e3d] h-full rounded-full transition-all duration-700"
                style={{ width: `${analysis.skill_match_score}%` }}
              />
            </div>
          </div>

          <div className="bg-[#08150c]/80 rounded-xl p-4 border border-[#1b3a20]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-[#7ea581] font-medium">Experience Match</span>
              <span className="text-sm font-bold text-[#eef9ef]">{Math.round(analysis.experience_match_score)}%</span>
            </div>
            <div className="w-full bg-[#122816] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#558b2f] h-full rounded-full transition-all duration-700"
                style={{ width: `${analysis.experience_match_score}%` }}
              />
            </div>
          </div>

          <div className="bg-[#08150c]/80 rounded-xl p-4 border border-[#1b3a20]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-[#7ea581] font-medium">ATS Keyword Coverage</span>
              <span className="text-sm font-bold text-[#eef9ef]">{Math.round(analysis.keyword_coverage_score)}%</span>
            </div>
            <div className="w-full bg-[#122816] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#2e7d32] h-full rounded-full transition-all duration-700"
                style={{ width: `${analysis.keyword_coverage_score}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Skill Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matched Skills */}
        <div className="bg-[#0b1c10] border border-[#1d3d23] rounded-xl p-6 space-y-4 shadow-md">
          <h2 className="text-base font-semibold text-[#daf3dc] flex items-center gap-2">
            <CheckCircle2 className="text-[#86efac]" size={18} /> Verified Matched Skills ({analysis.matched_skills?.length || 0})
          </h2>
          <div className="flex flex-wrap gap-2">
            {analysis.matched_skills && analysis.matched_skills.length > 0 ? (
              analysis.matched_skills.map((skill, i) => (
                <SkillBadge key={i} skill={skill} type="matching" />
              ))
            ) : (
              <p className="text-xs text-[#6e9170]">No direct skills detected.</p>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="bg-[#0b1c10] border border-[#1d3d23] rounded-xl p-6 space-y-4 shadow-md">
          <h2 className="text-base font-semibold text-[#daf3dc] flex items-center gap-2">
            <XCircle className="text-red-400" size={18} /> Missing Required Skills ({analysis.missing_skills?.length || 0})
          </h2>
          <div className="flex flex-wrap gap-2">
            {analysis.missing_skills && analysis.missing_skills.length > 0 ? (
              analysis.missing_skills.map((skill, i) => (
                <SkillBadge key={i} skill={skill} type="missing" />
              ))
            ) : (
              <p className="text-xs text-[#86efac]">All major required skills covered!</p>
            )}
          </div>
        </div>
      </div>

      {/* Bullet Point Improvements (Before & After) */}
      <div className="bg-[#0b1c10] border border-[#1d3d23] rounded-xl p-6 space-y-5 shadow-md">
        <div>
          <h2 className="text-lg font-semibold text-[#e8f7ea] flex items-center gap-2">
            <Lightbulb className="text-yellow-400" size={20} /> Bullet Point Improvements (Quantified & ATS-Optimized)
          </h2>
          <p className="text-xs text-[#7ea581] mt-1">
            Re-engineered with active verbs, metrics, and JD keyword alignment.
          </p>
        </div>

        <div className="space-y-4">
          {analysis.bullet_improvements && analysis.bullet_improvements.length > 0 ? (
            analysis.bullet_improvements.map((bullet, idx) => (
              <div
                key={idx}
                className="bg-[#08150c] border border-[#1c3c21] rounded-xl p-5 space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">
                      Original Bullet
                    </span>
                    <p className="text-xs text-[#c4d6c6] font-mono bg-red-950/20 border border-red-900/30 p-3 rounded-lg leading-relaxed">
                      {bullet.original}
                    </p>
                  </div>

                  {/* After */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#86efac] uppercase tracking-wider">
                        Improved Bullet
                      </span>
                      <button
                        onClick={() => handleCopyBullet(bullet.improved, idx)}
                        className="inline-flex items-center gap-1 text-[11px] text-[#a7f3d0] hover:text-white"
                      >
                        {copiedBulletIdx === idx ? (
                          <>
                            <Check size={12} /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-[#e8f7ea] font-mono bg-[#143419]/30 border border-[#2b5d32]/50 p-3 rounded-lg leading-relaxed font-medium">
                      {bullet.improved}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-[#7ea581] pt-1">
                  <span>
                    <strong className="text-[#a7f3d0]">Why this works:</strong> {bullet.reason}
                  </span>
                  {bullet.jd_relevance && (
                    <span>
                      <strong className="text-[#a7f3d0]">JD Relevance:</strong> {bullet.jd_relevance}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#6e9170]">No specific bullet point rewrites necessary.</p>
          )}
        </div>
      </div>

      {/* Prioritized Action Plan & ATS Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prioritized Action Items */}
        <div className="bg-[#0b1c10] border border-[#1d3d23] rounded-xl p-6 space-y-4 shadow-md">
          <h2 className="text-base font-semibold text-[#daf3dc] flex items-center gap-2">
            <CheckSquare className="text-[#86efac]" size={18} /> Prioritized Action Items
          </h2>
          <div className="space-y-3">
            {analysis.action_items && analysis.action_items.length > 0 ? (
              analysis.action_items.map((item, idx) => {
                const color = getPriorityColor(item.priority)
                return (
                  <div
                    key={idx}
                    className="p-3 bg-[#08150c] border border-[#1c3c21] rounded-lg flex items-start gap-3"
                  >
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${color.badge}`}
                    >
                      {item.priority}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs text-[#dcefe0]">{item.action}</p>
                      <span className="text-[10px] text-[#719574] capitalize">{item.category}</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-xs text-[#6e9170]">No pending action items.</p>
            )}
          </div>
        </div>

        {/* ATS Issues & Formatting */}
        <div className="bg-[#0b1c10] border border-[#1d3d23] rounded-xl p-6 space-y-4 shadow-md">
          <h2 className="text-base font-semibold text-[#daf3dc] flex items-center gap-2">
            <ShieldAlert className="text-amber-400" size={18} /> ATS Compliance Audit
          </h2>
          <div className="space-y-3">
            {analysis.ats_issues && analysis.ats_issues.length > 0 ? (
              analysis.ats_issues.map((issue, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-lg flex items-start gap-2.5 text-xs text-amber-200"
                >
                  <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>{issue}</span>
                </div>
              ))
            ) : (
              <div className="p-4 bg-[#122e17] border border-[#2b6033] rounded-lg flex items-center gap-2 text-xs text-[#86efac]">
                <CheckCircle2 size={16} />
                <span>Zero critical ATS parse errors detected. Standard headers and text format verified.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
