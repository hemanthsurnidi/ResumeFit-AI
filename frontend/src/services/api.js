import axios from 'axios'

const apiBase = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api'

const api = axios.create({
  baseURL: apiBase,
  timeout: 120000, // 2 min for LLM calls
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred'
    error.userMessage = message
    return Promise.reject(error)
  }
)

// --- Resume ---
export const uploadResume = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/resume/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// --- Analysis ---
export const analyzeResume = ({ resume_text, job_description, target_role }) =>
  api.post('/analyze', { resume_text, job_description, target_role })

export const getAnalysis = (id) => api.get(`/analysis/${id}`)

// --- History ---
export const getHistory = (limit = 20, offset = 0) =>
  api.get('/history', { params: { limit, offset } })

export const deleteAnalysis = (id) => api.delete(`/analysis/${id}`)

// --- Model ---
export const getModelStatus = () => api.get('/model/status')

export const getModelEvaluation = () => api.get('/model/evaluation')

// --- Health ---
export const getHealth = () => api.get('/health')

export default api
