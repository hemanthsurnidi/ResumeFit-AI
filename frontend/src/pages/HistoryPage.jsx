import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getHistory, deleteAnalysis } from '../services/api'
import ScoreRing from '../components/ScoreRing'
import { formatScore } from '../utils/formatters'

export default function HistoryPage() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await getHistory(limit, offset)
      setItems(res.data.items || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      toast.error('Failed to load analysis history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [offset])

  const handleDelete = async (id, e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this analysis?')) return

    try {
      await deleteAnalysis(id)
      setItems(items.filter((it) => it.id !== id))
      setTotal((prev) => Math.max(0, prev - 1))
      toast.success('Analysis deleted from history.')
    } catch (err) {
      toast.error('Failed to delete analysis.')
    }
  }

  const filteredItems = items.filter(
    (item) =>
      (item.target_role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.resume_filename || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="text-blue-400" size={24} /> Analysis History
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Review and compare previous resume alignment evaluation runs ({total} total).
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-3 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by role or file..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* History Table / Card List */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500 text-sm">
            Loading analysis history...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <FileText size={40} className="mx-auto text-gray-600" />
            <p className="text-gray-400 text-sm">No analysis history found.</p>
            <Link
              to="/analyze"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
            >
              Start New Analysis
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filteredItems.map((item) => {
              const scoreObj = formatScore(item.overall_match)
              return (
                <div
                  key={item.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-gray-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0">
                      <ScoreRing score={item.overall_match} size={48} strokeWidth={5} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {item.target_role || 'General Role Alignment'}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        File: {item.resume_filename || 'Direct Text Input'} • Model: {item.model_used}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${scoreObj.bgClass} ${scoreObj.colorClass}`}
                    >
                      {scoreObj.text} Match
                    </span>
                    <Link
                      to={`/results/${item.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs text-blue-400 font-medium transition-colors"
                    >
                      View Report <ExternalLink size={13} />
                    </Link>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Delete Analysis"
                      className="p-2 rounded-lg hover:bg-red-950/40 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
