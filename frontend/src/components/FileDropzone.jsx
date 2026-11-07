import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileText, Upload, X, FileCheck, AlertCircle, RefreshCw, Edit3 } from 'lucide-react'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

/**
 * Compact drag-and-drop file upload zone in Dark Green & Olive theme.
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
        className={`relative border-2 border-dashed rounded-xl p-5 sm:p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[170px]
          ${
            isDragActive
              ? 'border-[#86efac] bg-[#14371a]/50 scale-[1.01]'
              : 'border-[#264c2a] hover:border-[#4d8652] bg-[#091b0d]/80'
          }
          ${loading ? 'opacity-60 cursor-not-allowed' : ''}
          ${file && !error ? 'border-[#3d7a44] bg-[#0c2412]/70' : ''}
          ${error ? 'border-red-700/60 bg-red-950/20' : ''}
        `}
      >
        <input {...getInputProps()} />

        {loading ? (
          <div className="flex flex-col items-center gap-2.5">
            <div className="w-9 h-9 border-3 border-[#86efac] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#a7f3d0] font-medium">Extracting resume content...</p>
            <p className="text-xs text-[#729b74]">Running PyMuPDF parsing engine...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2">
            <div className="p-2.5 rounded-full bg-red-950/70 text-red-400 border border-red-800/50">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="font-semibold text-red-300 text-xs sm:text-sm">Extraction Failed</p>
              <p className="text-xs text-red-400/90 mt-0.5 max-w-xs mx-auto line-clamp-2">{error}</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onClear?.()
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#162f1a] hover:bg-[#204225] border border-[#2e5733] text-xs text-[#c9e8ca] transition"
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#2b6430] hover:bg-[#377a3c] text-xs text-white font-medium transition shadow-sm"
                >
                  <Edit3 size={12} /> Paste text directly
                </button>
              )}
            </div>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center gap-2">
            <div className="p-2.5 rounded-full bg-[#183a1e] border border-[#3b7244] text-[#86efac]">
              <FileCheck size={26} />
            </div>
            <div>
              <p className="font-semibold text-[#c8f2cb] text-xs sm:text-sm">{file.name}</p>
              <p className="text-[11px] text-[#7da37f] mt-0.5">
                {(file.size / 1024).toFixed(1)} KB • Ready for alignment analysis
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClear?.()
              }}
              className="flex items-center gap-1 text-[11px] text-[#82a87d] hover:text-[#f87171] transition mt-0.5"
            >
              <X size={12} /> Remove or replace file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className={`p-2.5 rounded-full transition-colors ${
                isDragActive ? 'bg-[#25522b] text-[#bbf7d0]' : 'bg-[#122816] text-[#86efac] border border-[#2b5730]'
              }`}
            >
              {isDragActive ? (
                <Upload size={24} className="animate-bounce text-[#bbf7d0]" />
              ) : (
                <FileText size={24} />
              )}
            </div>
            <div>
              <p className="font-semibold text-[#d5f5dc] text-xs sm:text-sm">
                {isDragActive ? 'Drop resume here!' : 'Drag & drop candidate resume'}
              </p>
              <p className="text-[11px] text-[#719574] mt-0.5">PDF or DOCX • Max 10 MB</p>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#122716] border border-[#284f2c] text-[#a7d7aa]">
              or click to browse file
            </span>
          </div>
        )}
      </div>

      {sizeError && (
        <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
          <AlertCircle size={12} /> File exceeds 10 MB limit.
        </p>
      )}
      {typeError && (
        <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
          <AlertCircle size={12} /> Only PDF and DOCX files are accepted.
        </p>
      )}
    </div>
  )
}
