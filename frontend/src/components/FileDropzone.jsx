import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileText, Upload, X, FileCheck, AlertCircle, RefreshCw, Edit3 } from 'lucide-react'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

/**
 * Compact drag-and-drop file upload zone in Light Olive Green & Dark Green theme.
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
              ? 'border-[#245828] bg-[#e3f0e0] scale-[1.01]'
              : 'border-[#9bbd95] hover:border-[#4d7f47] bg-[#f4f9f2]'
          }
          ${loading ? 'opacity-60 cursor-not-allowed' : ''}
          ${file && !error ? 'border-[#558e50] bg-[#e8f4e5]' : ''}
          ${error ? 'border-red-400 bg-red-50' : ''}
        `}
      >
        <input {...getInputProps()} />

        {loading ? (
          <div className="flex flex-col items-center gap-2.5">
            <div className="w-9 h-9 border-3 border-[#245828] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#1b431e] font-semibold">Extracting resume content...</p>
            <p className="text-xs text-[#527450]">Running PyMuPDF parsing engine...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2">
            <div className="p-2.5 rounded-full bg-red-100 text-red-600 border border-red-200">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="font-semibold text-red-800 text-xs sm:text-sm">Extraction Failed</p>
              <p className="text-xs text-red-700 mt-0.5 max-w-xs mx-auto line-clamp-2">{error}</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onClear?.()
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#e4ede1] hover:bg-[#d6e4d2] border border-[#a6c2a1] text-xs text-[#1c431e] font-medium transition"
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#245828] hover:bg-[#327037] text-xs text-white font-medium transition shadow-xs"
                >
                  <Edit3 size={12} /> Paste text directly
                </button>
              )}
            </div>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center gap-2">
            <div className="p-2.5 rounded-full bg-[#d6ebd3] border border-[#7ca977] text-[#1a4b1e]">
              <FileCheck size={26} />
            </div>
            <div>
              <p className="font-bold text-[#143217] text-xs sm:text-sm">{file.name}</p>
              <p className="text-[11px] text-[#4d6d4a] mt-0.5">
                {(file.size / 1024).toFixed(1)} KB • Ready for alignment analysis
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClear?.()
              }}
              className="flex items-center gap-1 text-[11px] text-[#557852] hover:text-red-600 transition mt-0.5 font-medium"
            >
              <X size={12} /> Remove or replace file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className={`p-2.5 rounded-full transition-colors ${
                isDragActive ? 'bg-[#cbe5c7] text-[#1a441e]' : 'bg-[#e3eee0] text-[#245828] border border-[#a4c29e]'
              }`}
            >
              {isDragActive ? (
                <Upload size={24} className="animate-bounce text-[#1b431e]" />
              ) : (
                <FileText size={24} />
              )}
            </div>
            <div>
              <p className="font-bold text-[#143217] text-xs sm:text-sm">
                {isDragActive ? 'Drop resume here!' : 'Drag & drop candidate resume'}
              </p>
              <p className="text-[11px] text-[#52744f] mt-0.5">PDF or DOCX • Max 10 MB</p>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#e3ece0] border border-[#9ebf99] text-[#1c451f] font-medium shadow-2xs">
              or click to browse file
            </span>
          </div>
        )}
      </div>

      {sizeError && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
          <AlertCircle size={12} /> File exceeds 10 MB limit.
        </p>
      )}
      {typeError && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
          <AlertCircle size={12} /> Only PDF and DOCX files are accepted.
        </p>
      )}
    </div>
  )
}
