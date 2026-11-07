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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-blue-900/40 via-purple-900/30 to-gray-900 border border-gray-800 p-8 overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
            <Sparkles size={14} /> PEFT / QLoRA Fine-Tuned AI
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Resume Intelligence & Job Alignment Platform
          </h1>
          <p className="mt-2 text-gray-400 text-sm leading-relaxed">
            Optimize your resume with genuine machine learning. Match against target job descriptions, discover missing skills, rewrite ATS bullet points, and maximize interview callbacks.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              to="/analyze"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-600/30 transition-all text-sm"
            >
              <PlusCircle size={18} /> Analyze New Resume
            </Link>
            <Link
              to="/evaluation"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium border border-gray-700 transition-all text-sm"
            >
              <TrendingUp size={18} /> View Model Metrics
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Total Analyses</p>
            <p className="text-2xl font-bold text-white mt-1">{history.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <FileText size={20} />
          </div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Average Match Score</p>
            <p className="text-2xl font-bold text-white mt-1">
              {avgScore > 0 ? `${avgScore}%` : 'N/A'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Inference Engine</p>
            <p className="text-sm font-bold text-white mt-1 truncate">
              {modelStatus?.fine_tuned ? 'Qwen2.5 LoRA' : 'Precision Engine'}
            </p>
            <p className="text-[11px] text-gray-500 capitalize">
              Device: {modelStatus?.device || 'CPU'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Cpu size={20} />
          </div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Status</p>
            <p className="text-sm font-semibold text-green-400 mt-1 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Operational
            </p>
            <p className="text-[11px] text-gray-500">FastAPI + PyTorch</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Recent Analyses Section */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Recent Analyses</h2>
            <p className="text-xs text-gray-400">Your latest resume evaluation runs</p>
          </div>
          <Link
            to="/history"
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
          >
            View all history <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            Loading recent analyses...
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <FileText size={36} className="mx-auto text-gray-600" />
            <p className="text-gray-400 text-sm">No analyses completed yet.</p>
            <Link
              to="/analyze"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
            >
              Start Your First Analysis
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {history.map((item) => (
              <div
                key={item.id}
                className="py-4 flex items-center justify-between hover:bg-gray-800/30 px-3 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <ScoreRing score={item.overall_match} size={48} strokeWidth={5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {item.target_role || 'Target Role Analysis'}
                    </p>
                    <p className="text-xs text-gray-400">
                      File: {item.resume_filename || 'Direct Text Input'} • Model: {item.model_used}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  <Link
                    to={`/results/${item.id}`}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-blue-400 font-medium"
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

