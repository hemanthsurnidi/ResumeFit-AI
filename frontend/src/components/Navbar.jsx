import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { FileText, Search, Cpu, Info, Menu, X, ArrowRight } from 'lucide-react'

const NAV_LINKS = [
  { to: '/analyze', label: 'Analyze', icon: Search },
  { to: '/model', label: 'Model', icon: Cpu },
  { to: '/about', label: 'About', icon: Info },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#d3e0ce]/95 backdrop-blur-md border-b border-[#b3c7ae] shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1c451e] to-[#2b6430] group-hover:from-[#245827] group-hover:to-[#387c3e] transition-all border border-[#437d47] shadow-xs flex items-center justify-center">
              <FileText size={17} className="text-[#f2faf0]" />
            </div>
            <span className="text-lg font-black text-[#112e15] tracking-tight">
              ResumeFit
            </span>
          </Link>

          {/* Desktop nav: Analyze | Model | About */}
          <div className="hidden md:flex items-center gap-1.5">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#bcd0b7] text-[#122e15] border border-[#9ebb97] shadow-2xs'
                      : 'text-[#365934] hover:text-[#112d14] hover:bg-[#c9dcbf]'
                  }`
                }
              >
                <Icon size={14} className="text-[#206925]" />
                {label}
              </NavLink>
            ))}
          </div>

          {/* Quick CTA Button */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => navigate('/analyze')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#1c451e] via-[#245827] to-[#2e6d32] hover:from-[#245827] hover:to-[#387e3d] text-white text-xs font-bold transition-all shadow-xs border border-[#437d47] cursor-pointer"
            >
              Start Analysis
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-[#3d5c3b] hover:text-[#112d14] hover:bg-[#c9dcbf] transition cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
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
                  `flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#bcd0b7] text-[#122e15] border border-[#9ebb97]'
                      : 'text-[#365934] hover:text-[#112d14] hover:bg-[#c9dcbf]'
                  }`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
            <button
              onClick={() => {
                navigate('/analyze')
                setMenuOpen(false)
              }}
              className="mt-2 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#245828] text-white text-xs font-bold border border-[#437d47]"
            >
              Start Analysis <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
