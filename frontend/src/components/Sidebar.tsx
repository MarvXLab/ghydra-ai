import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTheme } from '../lib/theme'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: 'https://cdn-icons-png.flaticon.com/128/8042/8042206.png' },
  { to: '/threats',   label: 'Threats',   icon: 'https://cdn-icons-png.flaticon.com/128/13409/13409733.png' },
  { to: '/network',   label: 'Network',   icon: 'https://cdn-icons-png.flaticon.com/128/2441/2441861.png' },
  { to: '/pricing',   label: 'Pricing',   icon: 'https://cdn-icons-png.flaticon.com/128/4289/4289749.png' },
  { to: '/settings',  label: 'Settings',  icon: 'https://cdn-icons-png.flaticon.com/128/60/60473.png' },
]

function NavItems({ dark, onNav }: { dark: boolean; onNav?: () => void }) {
  const location = useLocation()
  const { toggle } = useTheme()

  const iconStyle = (active: boolean) => ({
    filter: active
      ? 'invert(40%) sepia(80%) saturate(500%) hue-rotate(195deg) brightness(110%)'
      : dark ? 'invert(70%) brightness(0.8)' : 'invert(20%)',
    width: 18, height: 18,
  })

  return (
    <>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ to, label, icon }) => {
          const active = location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onNav}
              className={`nav-link ${active ? 'active' : ''}`}
            >
              <img src={icon} alt="" style={iconStyle(active)} />
              {label}
            </NavLink>
          )
        })}
      </nav>

      <div className={`px-3 py-4 border-t ${dark ? 'border-surface-400' : 'border-light-border'}`}>
        <button
          onClick={toggle}
          className={`nav-link w-full ${!dark ? 'text-light-muted hover:text-light-text hover:bg-slate-100' : ''}`}
        >
          <img
            src={dark
              ? 'https://cdn-icons-png.flaticon.com/128/14534/14534850.png'
              : 'https://cdn-icons-png.flaticon.com/128/12197/12197735.png'}
            alt=""
            style={{ filter: dark ? 'invert(70%)' : 'invert(20%)', width: 18, height: 18 }}
          />
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </>
  )
}

export default function Sidebar() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [open, setOpen] = useState(false)

  const sidebarBase = `flex flex-col h-full
    ${dark ? 'bg-surface-800 border-r border-surface-400' : 'bg-light-surface border-r border-light-border'}`

  const Logo = (
    <div className={`px-4 py-5 flex items-center gap-3 border-b ${dark ? 'border-surface-400' : 'border-light-border'}`}>
      <img src="/GhydraLogo.png" alt="Ghydra" className="w-7 h-7 object-contain" />
      <span className={`font-bold text-base tracking-tight ${dark ? 'text-slate-100' : 'text-light-text'}`}>
        Ghydra
      </span>
      <span className="ml-auto text-[10px] font-mono bg-accent/10 text-accent border border-accent/30 px-1.5 py-0.5 rounded">
        AI
      </span>
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className={`hidden md:flex fixed left-0 top-0 w-56 z-40 ${sidebarBase}`}>
        {Logo}
        <NavItems dark={dark} />
      </aside>

      {/* ── Mobile top bar ── */}
      <header className={`md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-13
        ${dark ? 'bg-surface-800 border-b border-surface-400' : 'bg-light-surface border-b border-light-border'}`}>
        <div className="flex items-center gap-2">
          <img src="/GhydraLogo.png" alt="Ghydra" className="w-6 h-6 object-contain" />
          <span className={`font-bold text-sm ${dark ? 'text-slate-100' : 'text-light-text'}`}>Ghydra</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className={`p-2 rounded ${dark ? 'text-slate-400 hover:text-slate-100' : 'text-light-muted hover:text-light-text'}`}
          aria-label="Open menu"
        >
          {/* Hamburger — 3 lines */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="5"  width="16" height="1.5" rx="1" fill="currentColor"/>
            <rect x="2" y="9"  width="16" height="1.5" rx="1" fill="currentColor"/>
            <rect x="2" y="13" width="16" height="1.5" rx="1" fill="currentColor"/>
          </svg>
        </button>
      </header>

      {/* ── Mobile drawer overlay ── */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <aside className={`relative w-64 flex flex-col z-10 ${sidebarBase}`}>
            <div className="flex items-center justify-between px-4 py-5 border-b border-surface-400">
              <div className="flex items-center gap-2">
                <img src="/GhydraLogo.png" alt="Ghydra" className="w-7 h-7 object-contain" />
                <span className={`font-bold text-base ${dark ? 'text-slate-100' : 'text-light-text'}`}>Ghydra</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className={`p-1 ${dark ? 'text-slate-400 hover:text-slate-100' : 'text-light-muted'}`}
                aria-label="Close menu"
              >
                {/* X icon */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <line x1="3" y1="3" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="15" y1="3" x2="3"  y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <NavItems dark={dark} onNav={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}
