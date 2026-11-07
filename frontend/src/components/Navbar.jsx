import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bot, LayoutDashboard, Search, History, Cpu, BarChart2, Settings, Menu, X, ChevronRight } from 'lucide-react'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/analyze', label: 'Analyze', icon: Search },
  { to: '/history', label: 'History', icon: History },
  { to: '/model', label: 'Model', icon: Cpu },
  { to: '/evaluation', label: 'Evaluation', icon: BarChart2 },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 group-hover:from-blue-500 group-hover:to-purple-500 transition-all">
              <Bot size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ResumeFit AI
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                  }`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </div>

          {/* CTA + settings */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/settings" className={({ isActive }) =>
              `p-2 rounded-lg transition-all ${isActive ? 'text-blue-400 bg-blue-900/30' : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'}`
            }>
              <Settings size={18} />
            </NavLink>
            <button
              onClick={() => navigate('/analyze')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-900/30"
            >
              Analyze Resume
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 px-4 pb-4">
          <div className="flex flex-col gap-1 mt-2">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
            <button
              onClick={() => { navigate('/analyze'); setMenuOpen(false) }}
              className="mt-2 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold"
            >
              Analyze Resume <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
