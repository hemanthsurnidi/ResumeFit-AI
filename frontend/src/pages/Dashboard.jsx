import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  TrendingUp,
  Cpu,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
} from 'lucide-react'
import { getHistory, getModelStatus } from '../services/api'
import ScoreRing from '../components/ScoreRing'

export default function Dashboard() {
  const [history, setHistory] = useState([])
  const [modelStatus, setModelStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [histRes, modelRes] = await Promise.allSettled([
          getHistory(5, 0),
          getModelStatus(),
        ])
        if (histRes.status === 'fulfilled') {
          setHistory(histRes.value.data.items || [])
        }
        if (modelRes.status === 'fulfilled') {
          setModelStatus(modelRes.value.data)
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const avgScore =
    history.length > 0
      ? Math.round(
          history.reduce((acc, curr) => acc + (curr.overall_match || 0), 0) /
            history.length
        )
      : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#dbe6d6] text-[#142e17]">
      {/* Hero Header: Rich Dark Forest Green with Crisp White & Pale Green Text */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#143518] via-[#1a441f] to-[#25572b] border border-[#3b7440] p-8 overflow-hidden shadow-md text-white">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#27602c] border border-[#549c59] text-[#bbf7d0] text-xs font-bold mb-3 shadow-xs">
            <Sparkles size={14} className="text-[#86efac]" /> PEFT / QLoRA Fine-Tuned AI
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#ffffff] tracking-tight">
            Resume Intelligence & Job Alignment Platform
          </h1>
          <p className="mt-3 text-[#d8edd6] text-sm sm:text-base leading-relaxed font-medium">
            Optimize candidate resumes with fine-tuned LLM intelligence. Match against company job descriptions, discover missing technical skills, rewrite ATS bullet points, and maximize interview callbacks.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              to="/analyze"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2f6f34] to-[#408e46] hover:from-[#3a8340] hover:to-[#4ca752] text-white font-bold shadow-md shadow-[#0d2610]/40 border border-[#5db063] transition-all text-sm"
            >
              <PlusCircle size={18} /> Analyze New Resume
            </Link>
            <Link
              to="/evaluation"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#112914] hover:bg-[#193a1d] text-[#bbf7d0] font-bold border border-[#376e3c] transition-all text-sm"
            >
              <TrendingUp size={18} /> View Model Metrics
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid: Pale Green Cards with Crisp Dark Green Text */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#eef5ec] border border-[#b2cbb0] rounded-xl p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-[#3d5e3b] font-bold uppercase tracking-wider">Total Analyses</p>
            <p className="text-2xl font-black text-[#112e15] mt-1">{history.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#d6ebd3] border border-[#8ec789] flex items-center justify-center text-[#1b4e20]">
            <FileText size={20} />
          </div>
        </div>

        <div className="bg-[#eef5ec] border border-[#b2cbb0] rounded-xl p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-[#3d5e3b] font-bold uppercase tracking-wider">Average Match Score</p>
            <p className="text-2xl font-black text-[#112e15] mt-1">
              {avgScore > 0 ? `${avgScore}%` : 'N/A'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#d6ebd3] border border-[#8ec789] flex items-center justify-center text-[#1b4e20]">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-[#eef5ec] border border-[#b2cbb0] rounded-xl p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-[#3d5e3b] font-bold uppercase tracking-wider">Inference Engine</p>
            <p className="text-sm font-black text-[#112e15] mt-1 truncate">
              {modelStatus?.fine_tuned ? 'Qwen2.5 LoRA' : 'Precision Engine'}
            </p>
            <p className="text-[11px] text-[#4b6d49] font-medium capitalize">
              Device: {modelStatus?.device || 'CPU'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#d6ebd3] border border-[#8ec789] flex items-center justify-center text-[#1b4e20]">
            <Cpu size={20} />
          </div>
        </div>

        <div className="bg-[#eef5ec] border border-[#b2cbb0] rounded-xl p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-[#3d5e3b] font-bold uppercase tracking-wider">Status</p>
            <p className="text-sm font-black text-[#155a1c] mt-1 flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-[#155a1c]" /> Operational
            </p>
            <p className="text-[11px] text-[#4b6d49] font-medium">FastAPI + PyTorch</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#d6ebd3] border border-[#8ec789] flex items-center justify-center text-[#1b4e20]">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Recent Analyses Section: Pale Green Card with Crisp Content */}
      <div className="bg-[#eef5ec] border border-[#b2cbb0] rounded-xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-[#c8ddc4]">
          <div>
            <h2 className="text-lg font-bold text-[#112e15]">Recent Analyses</h2>
            <p className="text-xs text-[#446642] font-medium">Your latest resume evaluation runs</p>
          </div>
          <Link
            to="/history"
            className="text-xs text-[#1e5824] hover:text-[#0f3813] flex items-center gap-1 font-bold"
          >
            View all history <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#4b6d48] text-sm font-medium">
            Loading recent analyses...
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <FileText size={36} className="mx-auto text-[#6a8c67]" />
            <p className="text-[#3d5e3b] text-sm font-semibold">No analyses completed yet.</p>
            <Link
              to="/analyze"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#245828] hover:bg-[#327037] text-white text-xs font-bold shadow-xs"
            >
              Start Your First Analysis
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#cde0cb]">
            {history.map((item) => (
              <div
                key={item.id}
                className="py-4 flex items-center justify-between hover:bg-[#e4ede1] px-3 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    <ScoreRing score={item.overall_match} size={48} strokeWidth={5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#112e15]">
                      {item.target_role || 'Target Role Analysis'}
                    </p>
                    <p className="text-xs text-[#3a5c37] font-medium">
                      File: {item.resume_filename || 'Direct Text Input'} • Model: {item.model_used}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-[#486b45]">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  <Link
                    to={`/results/${item.id}`}
                    className="px-3.5 py-1.5 rounded-lg bg-[#d6ebd3] hover:bg-[#c6e2c2] text-xs text-[#144719] font-bold border border-[#8ec789] transition-all shadow-2xs"
                  >
                    View Report
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
