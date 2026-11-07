import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileText, Upload, X, FileCheck, AlertCircle, RefreshCw, Edit3, Sparkles } from 'lucide-react'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

/**
 * Enhanced, vibrant drag-and-drop file upload zone.
 */
export default function FileDropzone({
  onFile,
  file,
  loading = false,
  onClear,
  error = null,
  onSwitchToText,
}) {
  const onDrop = useCallback(
    (accepted, rejected) => {
      if (rejected.length > 0) return
      if (accepted.length > 0) onFile(accepted[0])
    },
    [onFile]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: MAX_SIZE,
    multiple: false,
    disabled: loading,
  })

  const sizeError = fileRejections.some((r) =>
    r.errors.some((e) => e.code === 'file-too-large')
  )
  const typeError = fileRejections.some((r) =>
    r.errors.some((e) => e.code === 'file-invalid-type')
  )

  return (
    <div className="w-full h-full flex flex-col justify-center">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[180px] shadow-xs
          ${
            isDragActive
              ? 'border-[#245828] bg-gradient-to-b from-[#e3f2e0] to-[#d6ebd3] scale-[1.01] shadow-md ring-2 ring-[#3b7c3f]/20'
              : 'border-[#91b88a] hover:border-[#2f6f34] bg-gradient-to-b from-[#ffffff]/90 via-[#f8fcf7]/95 to-[#eff7ec]/90 hover:shadow-sm'
          }
          ${loading ? 'opacity-70 cursor-not-allowed' : ''}
          ${file && !error ? 'border-[#3f803a] bg-gradient-to-b from-[#f2faf0] to-[#e6f4e3] shadow-xs' : ''}
          ${error ? 'border-red-400 bg-red-50/80' : ''}
        `}
      >
        <input {...getInputProps()} />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 border-3 border-[#245828] border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={14} className="text-[#245828] animate-pulse" />
              </div>
            </div>
            <div>
              <p className="text-sm text-[#143d17] font-extrabold">Extracting Resume Content...</p>
              <p className="text-xs text-[#4b6f48] font-medium mt-0.5">Running PyMuPDF parsing engine</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2.5">
            <div className="p-2.5 rounded-full bg-red-100 text-red-700 border border-red-200 shadow-2xs">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="font-extrabold text-red-800 text-sm">Extraction Failed</p>
              <p className="text-xs text-red-700 mt-0.5 max-w-xs mx-auto line-clamp-2 font-medium">{error}</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onClear?.()
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-[#f0f6ee] border border-[#a2c39d] text-xs text-[#1c431e] font-bold transition shadow-2xs"
              >
                <RefreshCw size={12} /> Retry
              </button>
              {onSwitchToText && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSwitchToText()
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#245828] hover:bg-[#2f6f34] text-xs text-white font-bold transition shadow-xs"
                >
                  <Edit3 size={12} /> Paste text directly
                </button>
              )}
            </div>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center gap-2.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[#d4ecd0] to-[#bce1b7] border border-[#6ea667] text-[#0f3f13] shadow-xs">
              <FileCheck size={28} />
            </div>
            <div className="space-y-0.5">
              <p className="font-black text-[#112f14] text-sm tracking-tight">{file.name}</p>
              <div className="flex items-center justify-center gap-2 text-[11px] text-[#3e603b] font-medium">
                <span className="px-2 py-0.5 rounded-full bg-[#d6ecd2] border border-[#91c28b] font-bold text-[#144218]">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
                <span>• Ready for AI alignment</span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClear?.()
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#456942] hover:text-red-700 transition mt-1"
            >
              <X size={12} /> Remove or replace document
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                isDragActive
                  ? 'bg-[#245828] text-white shadow-md scale-110'
                  : 'bg-gradient-to-br from-[#ffffff] to-[#e5f2e2] text-[#1b4b20] border border-[#a2c89d] shadow-2xs'
              }`}
            >
              {isDragActive ? (
                <Upload size={24} className="animate-bounce" />
              ) : (
                <Upload size={22} />
              )}
            </div>
            <div className="space-y-0.5">
              <p className="font-extrabold text-[#112f14] text-sm">
                {isDragActive ? 'Drop resume here!' : 'Drag & drop candidate resume here'}
              </p>
              <p className="text-[11px] text-[#4d714a] font-medium">
                Supported formats: PDF or DOCX (Max 10 MB)
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#1c471f] via-[#245a27] to-[#2c6c31] hover:from-[#235827] hover:to-[#38843c] text-white text-xs font-bold shadow-xs transition-all">
                Browse Document
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#3c5e39] px-2 py-1 rounded-md bg-[#e4efe1] border border-[#b4d0b1]">
                PDF / DOCX
              </span>
            </div>
          </div>
        )}
      </div>

      {sizeError && (
        <p className="text-xs text-red-600 font-bold flex items-center gap-1 mt-1.5">
          <AlertCircle size={13} /> File exceeds 10 MB limit.
        </p>
      )}
      {typeError && (
        <p className="text-xs text-red-600 font-bold flex items-center gap-1 mt-1.5">
          <AlertCircle size={13} /> Only PDF and DOCX files are supported.
        </p>
      )}
    </div>
  )
}
