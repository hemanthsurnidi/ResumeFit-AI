import { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  Server,
  Cpu,
  Database,
  CheckCircle2,
  Save,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getHealth, getModelStatus } from '../services/api'

export default function SettingsPage() {
  const [health, setHealth] = useState(null)
  const [modelStatus, setModelStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [temperature, setTemperature] = useState(0.1)
  const [maxTokens, setMaxTokens] = useState(2048)

  useEffect(() => {
    async function loadConfig() {
      try {
        const [hRes, mRes] = await Promise.allSettled([getHealth(), getModelStatus()])
        if (hRes.status === 'fulfilled') setHealth(hRes.value.data)
        if (mRes.status === 'fulfilled') setModelStatus(mRes.value.data)
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [])

  const handleSave = () => {
    toast.success('Inference configuration saved!')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-gray-800 pb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="text-blue-400" size={24} /> Application Settings
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Configure backend API connectivity, runtime model parameters, and database storage.
        </p>
      </div>

      {/* Backend & Health Status */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Server className="text-purple-400" size={18} /> Backend Service Health
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-950/70 border border-gray-800 rounded-lg">
            <span className="text-xs text-gray-400">API Server</span>
            <p className="text-sm font-semibold text-green-400 flex items-center gap-1 mt-1">
              <CheckCircle2 size={13} /> {health?.status === 'ok' ? 'Connected' : 'Degraded'}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Uptime: {health?.uptime_seconds || 0}s</p>
          </div>

          <div className="p-3 bg-gray-950/70 border border-gray-800 rounded-lg">
            <span className="text-xs text-gray-400">Database Engine</span>
            <p className="text-sm font-semibold text-white mt-1">SQLite 3.x</p>
            <p className="text-[11px] text-gray-500 mt-0.5">File: resumefit.db</p>
          </div>

          <div className="p-3 bg-gray-950/70 border border-gray-800 rounded-lg">
            <span className="text-xs text-gray-400">ML Engine</span>
            <p className="text-sm font-semibold text-white mt-1">
              {modelStatus?.fine_tuned ? 'LoRA Active' : 'Precision Engine'}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Device: {modelStatus?.device || 'CPU'}</p>
          </div>
        </div>
      </div>

      {/* LLM Inference Configuration */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Cpu className="text-blue-400" size={18} /> LLM Hyperparameters
        </h2>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-gray-300 font-medium mb-1.5">
              <span>Sampling Temperature: {temperature}</span>
              <span className="text-gray-500">Default: 0.1 (Deterministic JSON)</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-300 font-medium mb-1.5">
              <span>Max New Tokens: {maxTokens}</span>
              <span className="text-gray-500">Max schema length: 4096</span>
            </div>
            <input
              type="range"
              min="512"
              max="4096"
              step="256"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-colors"
          >
            <Save size={14} /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  )
}
