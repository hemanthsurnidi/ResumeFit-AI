import { useState, useCallback } from 'react'
import { uploadResume, analyzeResume } from '../services/api'

/**
 * Custom hook that manages the full analysis workflow:
 * upload → extract text → run AI analysis → result.
 */
export function useAnalysis() {
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [extractedText, setExtractedText] = useState('')
  const [progressStep, setProgressStep] = useState(0)

  const STEPS = [
    'Extracting resume…',
    'Processing job description…',
    'Running AI analysis…',
    'Generating recommendations…',
  ]

  /** Upload a file and extract its text via the backend. */
  const uploadAndExtract = useCallback(async (file) => {
    setUploading(true)
    setError(null)
    setExtractedText('')
    setProgressStep(0)
    try {
      const { data } = await uploadResume(file)
      setExtractedText(data.text || '')
      return data.text || ''
    } catch (err) {
      setError(err.userMessage || 'Failed to upload resume')
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  /** Run the full AI analysis. */
  const runAnalysis = useCallback(async ({ resume_text, job_description, target_role }) => {
    setAnalyzing(true)
    setError(null)
    setResult(null)
    setProgressStep(1)

    // Simulate step progress
    const stepTimers = [
      setTimeout(() => setProgressStep(2), 1500),
      setTimeout(() => setProgressStep(3), 4000),
    ]

    try {
      const { data } = await analyzeResume({ resume_text, job_description, target_role })
      setResult(data)
      return data
    } catch (err) {
      setError(err.userMessage || 'Analysis failed. Please try again.')
      return null
    } finally {
      stepTimers.forEach(clearTimeout)
      setAnalyzing(false)
      setProgressStep(0)
    }
  }, [])

  const reset = useCallback(() => {
    setUploading(false)
    setAnalyzing(false)
    setError(null)
    setResult(null)
    setExtractedText('')
    setProgressStep(0)
  }, [])

  return {
    uploading,
    analyzing,
    error,
    result,
    extractedText,
    progressStep,
    steps: STEPS,
    uploadAndExtract,
    runAnalysis,
    reset,
  }
}
