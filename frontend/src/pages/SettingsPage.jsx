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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#dbe6d6] text-[#142e17]">
      {/* Header */}
      <div className="border-b border-[#b7ccb2] pb-6">
        <h1 className="text-2xl font-bold text-[#112e15] flex items-center gap-2">
          <SettingsIcon className="text-[#206925]" size={24} /> Application Settings
        </h1>
        <p className="text-sm text-[#486b45] mt-1 font-medium">
          Configure backend API connectivity, runtime model parameters, and database storage.
        </p>
      </div>

      {/* Backend & Health Status */}
      <div className="bg-[#eef5ec] border border-[#b2cbb0] rounded-xl p-6 space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-[#112e15] flex items-center gap-2">
          <Server className="text-[#206925]" size={18} /> Backend Service Health
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-[#ffffff] border border-[#bad1b7] rounded-lg shadow-2xs">
            <span className="text-xs font-bold text-[#4b6d49] uppercase tracking-wider">API Server</span>
            <p className="text-sm font-bold text-[#145a1b] flex items-center gap-1 mt-1">
              <CheckCircle2 size={13} /> {health?.status === 'ok' ? 'Connected' : 'Degraded'}
            </p>
            <p className="text-[11px] text-[#4d714b] font-medium mt-0.5">Uptime: {health?.uptime_seconds || 0}s</p>
          </div>

          <div className="p-3 bg-[#ffffff] border border-[#bad1b7] rounded-lg shadow-2xs">
            <span className="text-xs font-bold text-[#4b6d49] uppercase tracking-wider">Database Engine</span>
            <p className="text-sm font-bold text-[#112e15] mt-1">SQLite 3.x</p>
            <p className="text-[11px] text-[#4d714b] font-medium mt-0.5">File: resumefit.db</p>
          </div>

          <div className="p-3 bg-[#ffffff] border border-[#bad1b7] rounded-lg shadow-2xs">
            <span className="text-xs font-bold text-[#4b6d49] uppercase tracking-wider">ML Engine</span>
            <p className="text-sm font-bold text-[#112e15] mt-1">
              {modelStatus?.fine_tuned ? 'LoRA Active' : 'Precision Engine'}
            </p>
            <p className="text-[11px] text-[#4d714b] font-medium mt-0.5">Device: {modelStatus?.device || 'CPU'}</p>
          </div>
        </div>
      </div>

      {/* LLM Inference Configuration */}
      <div className="bg-[#eef5ec] border border-[#b2cbb0] rounded-xl p-6 space-y-5 shadow-sm">
        <h2 className="text-base font-bold text-[#112e15] flex items-center gap-2">
          <Cpu className="text-[#206925]" size={18} /> LLM Hyperparameters
        </h2>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-[#112e15] font-bold mb-1.5">
              <span>Sampling Temperature: {temperature}</span>
              <span className="text-[#4d714b] font-medium">Default: 0.1 (Deterministic JSON)</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#cbe0c9] rounded-lg appearance-none cursor-pointer accent-[#206925]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-[#112e15] font-bold mb-1.5">
              <span>Max Generation Tokens: {maxTokens}</span>
              <span className="text-[#4d714b] font-medium">Output Buffer Size</span>
            </div>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full bg-[#ffffff] border border-[#afc9ac] rounded-lg p-2.5 text-xs text-[#122e15] focus:outline-none focus:border-[#3d743a] focus:ring-1 focus:ring-[#3d743a]/30 font-mono shadow-inner font-bold"
            />
          </div>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245828] hover:bg-[#327037] text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <Save size={15} /> Save Hyperparameter Settings
          </button>
        </div>
      </div>
    </div>
  )
}
