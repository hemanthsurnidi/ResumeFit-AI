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
  CheckSquare,
  ShieldAlert,
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
    toast.success('Copied improved bullet point to clipboard!')
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
      <div className="max-w-6xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#245828] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#3d5e3b] text-sm font-semibold">Comparing your resume with the job requirements...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 text-center space-y-4">
        <AlertTriangle size={48} className="text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-[#142e17]">Report Not Found</h2>
        <p className="text-[#4e704b] text-sm">{error || 'Could not locate this analysis report.'}</p>
        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#245828] hover:bg-[#327037] text-white text-xs font-semibold"
        >
          <ArrowLeft size={16} /> Return to Matcher
        </Link>
      </div>
    )
  }

  const { analysis, model_used, processing_time_ms, created_at } = data

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0 bg-[#dbe6d6] text-[#142e17]">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#b7ccb2] pb-5 print:hidden">
        <Link
          to="/analyze"
          className="inline-flex items-center gap-1.5 text-xs text-[#2e5d32] hover:text-[#112d14] font-bold"
        >
          <ArrowLeft size={16} /> ← Back to Resume Matcher
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadJSON}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#e5eee2] hover:bg-[#d8e6d4] text-xs text-[#1a441e] border border-[#a6c4a0] font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <Download size={14} /> Save JSON
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#e5eee2] hover:bg-[#d8e6d4] text-xs text-[#1a441e] border border-[#a6c4a0] font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <Printer size={14} /> Print Report
          </button>
        </div>
      </div>

      {/* Main Score & Summary Header */}
      <div className="bg-gradient-to-r from-[#eef6ec] via-[#e8f2e6] to-[#e1eee0] border border-[#b4ccb1] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d6ebd3] border border-[#90bc8b] text-[#1a4b1e] text-xs font-bold">
              <Sparkles size={13} /> {model_used}
            </div>
            <h1 className="text-3xl font-extrabold text-[#112e15] tracking-tight">
              Resume & Job Match Report
            </h1>
            <p className="text-sm text-[#2e522c] leading-relaxed font-medium">
              {analysis.summary_recommendation ||
                'Here is a breakdown of how well your resume matches the job description, along with clear steps to improve it.'}
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-[#4b6d49] justify-center lg:justify-start pt-1 font-semibold">
              <span>Target Role: <strong className="text-[#143217]">{analysis.target_role_detected || 'Software Engineer'}</strong></span>
              <span>•</span>
              <span>Checked in: <strong className="text-[#143217]">{processing_time_ms}ms</strong></span>
              <span>•</span>
              <span>Date: <strong className="text-[#143217]">{new Date(created_at).toLocaleDateString()}</strong></span>
            </div>
          </div>

          {/* Primary Ring */}
          <div className="flex flex-col items-center p-4 bg-[#ffffff] border border-[#b8d1b6] rounded-2xl shadow-xs">
            <ScoreRing
              score={analysis.overall_match_percentage}
              size={130}
              strokeWidth={10}
              label="Overall Match"
            />
            <p className="text-xs text-[#3d5e3b] font-bold mt-2">Overall Match</p>
          </div>
        </div>

        {/* Sub-Score Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-[#c6dcc3]">
          <div className="bg-[#ffffff]/90 rounded-xl p-4 border border-[#bdd4bb]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-[#3b5d38] font-bold">Skills Match</span>
              <span className="text-sm font-black text-[#112e15]">{Math.round(analysis.skill_match_score)}%</span>
            </div>
            <div className="w-full bg-[#d7e6d5] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#245828] h-full rounded-full transition-all duration-700"
                style={{ width: `${analysis.skill_match_score}%` }}
              />
            </div>
          </div>

          <div className="bg-[#ffffff]/90 rounded-xl p-4 border border-[#bdd4bb]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-[#3b5d38] font-bold">Experience Match</span>
              <span className="text-sm font-black text-[#112e15]">{Math.round(analysis.experience_match_score)}%</span>
            </div>
            <div className="w-full bg-[#d7e6d5] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#487e24] h-full rounded-full transition-all duration-700"
                style={{ width: `${analysis.experience_match_score}%` }}
              />
            </div>
          </div>

          <div className="bg-[#ffffff]/90 rounded-xl p-4 border border-[#bdd4bb]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-[#3b5d38] font-bold">Keywords Present</span>
              <span className="text-sm font-black text-[#112e15]">{Math.round(analysis.keyword_coverage_score)}%</span>
            </div>
            <div className="w-full bg-[#d7e6d5] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#1f6b24] h-full rounded-full transition-all duration-700"
                style={{ width: `${analysis.keyword_coverage_score}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Skills Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matched Skills */}
        <div className="bg-[#eef5ec] border border-[#b2cbb0] rounded-xl p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-[#122e15] flex items-center gap-2">
            <CheckCircle2 className="text-[#206925]" size={18} /> Skills You Have for This Role ({analysis.matched_skills?.length || 0})
          </h2>
          <div className="flex flex-wrap gap-2">
            {analysis.matched_skills && analysis.matched_skills.length > 0 ? (
              analysis.matched_skills.map((skill, i) => (
                <SkillBadge key={i} skill={skill} type="matching" />
              ))
            ) : (
              <p className="text-xs text-[#52744f]">No direct matching skills found in the resume.</p>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="bg-[#eef5ec] border border-[#b2cbb0] rounded-xl p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-[#122e15] flex items-center gap-2">
            <XCircle className="text-red-500" size={18} /> Skills Missing from Your Resume ({analysis.missing_skills?.length || 0})
          </h2>
          <div className="flex flex-wrap gap-2">
            {analysis.missing_skills && analysis.missing_skills.length > 0 ? (
              analysis.missing_skills.map((skill, i) => (
                <SkillBadge key={i} skill={skill} type="missing" />
              ))
            ) : (
              <p className="text-xs text-[#1e5d23] font-bold">You cover all the key required skills listed in the job post!</p>
            )}
          </div>
        </div>
      </div>

      {/* Bullet Point Improvements (Before & After) */}
      <div className="bg-[#eef5ec] border border-[#b2cbb0] rounded-xl p-6 space-y-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-[#112e15] flex items-center gap-2">
            <Lightbulb className="text-amber-600" size={20} /> Suggested Bullet Point Improvements
          </h2>
          <p className="text-xs text-[#3b5f39] mt-1 font-medium">
            Here is how to rewrite weaker lines using real metrics and active verbs so recruiters notice your impact.
          </p>
        </div>

        <div className="space-y-4">
          {analysis.bullet_improvements && analysis.bullet_improvements.length > 0 ? (
            analysis.bullet_improvements.map((bullet, idx) => (
              <div
                key={idx}
                className="bg-[#ffffff] border border-[#bed3bc] rounded-xl p-5 space-y-3 shadow-2xs"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
                      Original Line in Your Resume
                    </span>
                    <p className="text-xs text-[#4a2b2b] font-mono bg-red-50 border border-red-200 p-3 rounded-lg leading-relaxed font-medium">
                      {bullet.original}
                    </p>
                  </div>

                  {/* After */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#144f19] uppercase tracking-wider">
                        Clearer & Stronger Rewrite
                      </span>
                      <button
                        onClick={() => handleCopyBullet(bullet.improved, idx)}
                        className="inline-flex items-center gap-1 text-[11px] text-[#245828] font-bold hover:underline cursor-pointer"
                      >
                        {copiedBulletIdx === idx ? (
                          <>
                            <Check size={12} /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copy Rewrite
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-[#0a300e] font-mono bg-[#edf7ec] border border-[#94cb90] p-3 rounded-lg leading-relaxed font-bold">
                      {bullet.improved}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-[#3b5d38] pt-1">
                  <span>
                    <strong className="text-[#133e17]">Why this is better:</strong> {bullet.reason}
                  </span>
                  {bullet.jd_relevance && (
                    <span>
                      <strong className="text-[#133e17]">Job match reason:</strong> {bullet.jd_relevance}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#52744f]">Your bullet points already look clear and impact-focused.</p>
          )}
        </div>
      </div>

      {/* Next Steps & Formatting Check */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prioritized Action Items */}
        <div className="bg-[#eef5ec] border border-[#b2cbb0] rounded-xl p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-[#122e15] flex items-center gap-2">
            <CheckSquare className="text-[#206925]" size={18} /> Recommended Next Steps
          </h2>
          <div className="space-y-3">
            {analysis.action_items && analysis.action_items.length > 0 ? (
              analysis.action_items.map((item, idx) => {
                const color = getPriorityColor(item.priority)
                return (
                  <div
                    key={idx}
                    className="p-3 bg-[#ffffff] border border-[#bed3bc] rounded-lg flex items-start gap-3 shadow-2xs"
                  >
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${color.badge}`}
                    >
                      {item.priority}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs text-[#143217] font-semibold">{item.action}</p>
                      <span className="text-[10px] text-[#52744f] capitalize font-medium">{item.category}</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-xs text-[#52744f]">No critical action items. You are ready to apply.</p>
            )}
          </div>
        </div>

        {/* ATS Issues & Formatting */}
        <div className="bg-[#eef5ec] border border-[#b2cbb0] rounded-xl p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-[#122e15] flex items-center gap-2">
            <ShieldAlert className="text-amber-600" size={18} /> Formatting & ATS Checklist
          </h2>
          <div className="space-y-3">
            {analysis.ats_issues && analysis.ats_issues.length > 0 ? (
              analysis.ats_issues.map((issue, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900 font-medium"
                >
                  <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>{issue}</span>
                </div>
              ))
            ) : (
              <div className="p-4 bg-[#e5f5e3] border border-[#8ec789] rounded-lg flex items-center gap-2 text-xs text-[#164d1a] font-bold">
                <CheckCircle2 size={16} className="text-[#206925]" />
                <span>Your resume uses clean standard headings and will parse properly in company application portals.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
