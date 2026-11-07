import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import AnalyzeWorkspace from './pages/AnalyzeWorkspace'
import ResultsDashboard from './pages/ResultsDashboard'
import HistoryPage from './pages/HistoryPage'
import ModelInfoPage from './pages/ModelInfoPage'
import EvaluationDashboard from './pages/EvaluationDashboard'
import SettingsPage from './pages/SettingsPage'

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
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/*"
          element={
            <>
              <Navbar />
              <div className="pt-16">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/analyze" element={<AnalyzeWorkspace />} />
                  <Route path="/results/:analysisId" element={<ResultsDashboard />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/model" element={<ModelInfoPage />} />
                  <Route path="/evaluation" element={<EvaluationDashboard />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </div>
            </>
          }
        />
      </Routes>
    </div>
  )
}

export default App
