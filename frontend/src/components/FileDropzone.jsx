import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileText, Upload, X, FileCheck } from 'lucide-react'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

/**
 * Drag-and-drop file upload zone.
 * @param {{ onFile: (file: File) => void, file: File|null, loading: boolean, onClear: () => void }} props
 */
export default function FileDropzone({ onFile, file, loading = false, onClear }) {
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
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 hover:border-gray-500 bg-gray-900/40'}
          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          ${file ? 'border-green-600/50 bg-green-900/10' : ''}
        `}
      >
        <input {...getInputProps()} />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-green-900/40">
              <FileCheck size={28} className="text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-green-300 text-sm">{file.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            {!loading && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onClear?.() }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition mt-1"
              >
                <X size={13} /> Remove file
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`p-3 rounded-full transition-colors ${isDragActive ? 'bg-blue-700/40' : 'bg-gray-800'}`}>
              {isDragActive ? (
                <Upload size={28} className="text-blue-400 animate-bounce" />
              ) : (
                <FileText size={28} className="text-gray-400" />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-200 text-sm">
                {isDragActive ? 'Drop it here!' : 'Drag & drop your resume'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF or DOCX • Max 10 MB
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-400">
              or click to browse
            </span>
          </div>
        )}
      </div>

      {sizeError && (
        <p className="mt-2 text-xs text-red-400">File exceeds 10 MB limit.</p>
      )}
      {typeError && (
        <p className="mt-2 text-xs text-red-400">Only PDF and DOCX files are accepted.</p>
      )}
    </div>
  )
}
