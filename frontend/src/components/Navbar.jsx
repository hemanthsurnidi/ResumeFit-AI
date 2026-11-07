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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#d3e0ce]/95 backdrop-blur-md border-b border-[#b3c7ae] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#1c451e] to-[#2b6430] group-hover:from-[#245827] group-hover:to-[#387c3e] transition-all border border-[#437d47] shadow-xs">
              <Bot size={20} className="text-[#f2faf0]" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-[#112d14] via-[#1d4621] to-[#2c6530] bg-clip-text text-transparent">
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
                      ? 'bg-[#bdd0b8] text-[#122e15] font-semibold border border-[#9ebb97] shadow-xs'
                      : 'text-[#3d5c3b] hover:text-[#112d14] hover:bg-[#c9dcbf]'
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
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `p-2 rounded-lg transition-all ${
                  isActive
                    ? 'text-[#122e15] bg-[#bdd0b8] border border-[#9ebb97]'
                    : 'text-[#3d5c3b] hover:text-[#112d14] hover:bg-[#c9dcbf]'
                }`
              }
            >
              <Settings size={18} />
            </NavLink>
            <button
              onClick={() => navigate('/analyze')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#1c451e] via-[#245827] to-[#2e6d32] hover:from-[#245827] hover:to-[#387e3d] text-white text-sm font-semibold transition-all shadow-sm border border-[#437d47]"
            >
              Analyze Resume
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-[#3d5c3b] hover:text-[#112d14] hover:bg-[#c9dcbf] transition"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#d3e0ce] border-t border-[#b3c7ae] px-4 pb-4">
          <div className="flex flex-col gap-1 mt-2">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#bdd0b8] text-[#122e15] font-semibold border border-[#9ebb97]'
                      : 'text-[#3d5c3b] hover:text-[#112d14] hover:bg-[#c9dcbf]'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
            <button
              onClick={() => {
                navigate('/analyze')
                setMenuOpen(false)
              }}
              className="mt-2 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#1c451e] to-[#2e6d32] text-white text-sm font-semibold border border-[#437d47]"
            >
              Analyze Resume <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
