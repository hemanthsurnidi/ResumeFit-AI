import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Trash2,
  ExternalLink,
  Search,
  Clock,
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
  const [offset] = useState(0)

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-[#dbe6d6] text-[#142e17]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#b7ccb2] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#112e15] flex items-center gap-2">
            <Clock className="text-[#206925]" size={24} /> Analysis History
          </h1>
          <p className="text-sm text-[#486b45] mt-1 font-medium">
            Review and compare previous resume alignment evaluation runs ({total} total).
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-3 text-[#52744f]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by role or file..."
            className="w-full bg-[#ffffff] border border-[#afc9ac] rounded-lg pl-9 pr-4 py-2 text-xs text-[#122e15] placeholder-[#71936e] focus:outline-none focus:border-[#3d743a] focus:ring-1 focus:ring-[#3d743a]/30 shadow-inner"
          />
        </div>
      </div>

      {/* History Table / Card List */}
      <div className="bg-[#eef5ec] border border-[#b2cbb0] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-[#4b6d48] text-sm font-medium">
            Loading analysis history...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <FileText size={40} className="mx-auto text-[#6a8c67]" />
            <p className="text-[#3d5e3b] text-sm font-semibold">No analysis history found.</p>
            <Link
              to="/analyze"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#245828] hover:bg-[#327037] text-white text-xs font-bold shadow-xs"
            >
              Start New Analysis
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#cde0cb]">
            {filteredItems.map((item) => {
              const scoreObj = formatScore(item.overall_match)
              return (
                <div
                  key={item.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-[#e4ede1] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0">
                      <ScoreRing score={item.overall_match} size={48} strokeWidth={5} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#112e15]">
                        {item.target_role || 'General Role Alignment'}
                      </h3>
                      <p className="text-xs text-[#3a5c37] font-medium mt-0.5">
                        File: {item.resume_filename || 'Direct Text Input'} • Model: {item.model_used}
                      </p>
                      <p className="text-[11px] text-[#4b6d48] font-semibold mt-0.5">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border border-[#7ca977] ${scoreObj.bgClass} ${scoreObj.colorClass} shadow-2xs`}
                    >
                      {scoreObj.text} Match
                    </span>
                    <Link
                      to={`/results/${item.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#d6ebd3] hover:bg-[#c6e2c2] border border-[#8ec789] text-xs text-[#144719] font-bold transition-all shadow-2xs"
                    >
                      View Report <ExternalLink size={13} />
                    </Link>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Delete Analysis"
                      className="p-2 rounded-lg hover:bg-red-100 text-[#52744f] hover:text-red-700 transition-colors"
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
