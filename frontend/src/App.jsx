import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import AnalyzeWorkspace from './pages/AnalyzeWorkspace'
import ResultsDashboard from './pages/ResultsDashboard'
import ModelPage from './pages/ModelPage'
import AboutPage from './pages/AboutPage'

function App() {
  return (
    <div className="min-h-screen bg-[#dbe6d6] text-[#142e17]">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#193b1d',
            color: '#f0f9ef',
            border: '1px solid #457849',
          },
          success: { iconTheme: { primary: '#86efac', secondary: '#132e16' } },
          error: { iconTheme: { primary: '#fca5a5', secondary: '#132e16' } },
        }}
      />
      <Navbar />
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<AnalyzeWorkspace />} />
          <Route path="/analyze" element={<AnalyzeWorkspace />} />
          <Route path="/model" element={<ModelPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/results/:analysisId" element={<ResultsDashboard />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
