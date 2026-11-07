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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#08160c]/95 backdrop-blur-md border-b border-[#1c3820]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#2f6a33] to-[#488e4c] group-hover:from-[#3a7c3e] group-hover:to-[#55a359] transition-all border border-[#529456]/40 shadow-sm shadow-[#1b431e]/40">
              <Bot size={20} className="text-[#e8f7e8]" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-[#bbf7d0] via-[#a7f3d0] to-[#86efac] bg-clip-text text-transparent">
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
                      ? 'bg-[#1a381f] text-[#86efac] border border-[#386b3e] shadow-sm'
                      : 'text-[#82a87d] hover:text-[#d3f2cc] hover:bg-[#122816]'
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
                    ? 'text-[#86efac] bg-[#1a381f] border border-[#386b3e]'
                    : 'text-[#82a87d] hover:text-[#d3f2cc] hover:bg-[#122816]'
                }`
              }
            >
              <Settings size={18} />
            </NavLink>
            <button
              onClick={() => navigate('/analyze')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#2f6a33] via-[#3a7c3e] to-[#488e4c] hover:from-[#377a3c] hover:to-[#55a359] text-[#f0faf1] text-sm font-semibold transition-all shadow-md shadow-[#143217]/50 border border-[#529756]/60"
            >
              Analyze Resume
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-[#82a87d] hover:text-[#d3f2cc] hover:bg-[#122816] transition"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#09170d] border-t border-[#1c3820] px-4 pb-4">
          <div className="flex flex-col gap-1 mt-2">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#1a381f] text-[#86efac] border border-[#386b3e]'
                      : 'text-[#82a87d] hover:text-[#d3f2cc] hover:bg-[#122816]'
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
              className="mt-2 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#2f6a33] to-[#488e4c] text-white text-sm font-semibold border border-[#529756]"
            >
              Analyze Resume <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
