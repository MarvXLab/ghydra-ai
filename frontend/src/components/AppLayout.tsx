import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTheme } from '../lib/theme'

const NAV_ITEMS = [
  { 
    to: '/dashboard', 
    label: 'Home', 
    icon: 'https://cdn-icons-png.flaticon.com/128/17821/17821825.png',
    mobileLabel: 'Home'
  },
  { 
    to: '/scan', 
    label: 'Scan', 
    icon: 'https://cdn-icons-png.flaticon.com/128/12785/12785948.png',
    mobileLabel: 'Scan'
  },
  { 
    to: '/threats', 
    label: 'Alerts', 
    icon: 'https://cdn-icons-png.flaticon.com/128/1827/1827349.png',
    mobileLabel: 'Alerts'
  },
  { 
    to: '/settings', 
    label: 'Settings', 
    icon: 'https://cdn-icons-png.flaticon.com/128/10229/10229188.png',
    mobileLabel: 'Settings'
  },
]

interface MobileNavProps {
  className?: string
}

export function MobileBottomNav({ className = '' }: MobileNavProps) {
  const { theme } = useTheme()
  const location = useLocation()
  const dark = theme === 'dark'

  return (
    <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 ${className}`}>
      <div className={`flex items-center justify-around py-2 border-t backdrop-blur-md
        ${dark 
          ? 'bg-surface-800/90 border-surface-400' 
          : 'bg-white/90 border-light-border'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
      >
        {NAV_ITEMS.map(({ to, icon, mobileLabel }) => {
          const isActive = location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center min-w-[60px] py-1 px-2 rounded-lg transition-colors
                ${isActive 
                  ? 'text-accent' 
                  : dark 
                    ? 'text-slate-400 hover:text-slate-200' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <img 
                src={icon}
                alt={mobileLabel}
                className="w-5 h-5 mb-1"
                style={{ 
                  filter: isActive 
                    ? 'invert(40%) sepia(80%) saturate(500%) hue-rotate(195deg) brightness(110%)'
                    : dark 
                      ? 'invert(70%)' 
                      : 'invert(40%)'
                }}
              />
              <span className="text-xs font-medium">{mobileLabel}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

interface DesktopSidebarProps {
  children?: React.ReactNode
}

export function DesktopSidebar({ children }: DesktopSidebarProps) {
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const dark = theme === 'dark'

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex fixed left-0 top-0 w-64 h-full z-40 flex-col
        ${dark ? 'bg-surface-800 border-r border-surface-400' : 'bg-light-surface border-r border-light-border'}`}>
        
        {/* Logo */}
        <div className={`px-6 py-5 border-b flex items-center gap-3 
          ${dark ? 'border-surface-400' : 'border-light-border'}`}>
          <img src="/GhydraLogo.png" alt="Ghydra" className="w-8 h-8 object-contain" />
          <div>
            <div className={`font-bold text-base ${dark ? 'text-slate-100' : 'text-light-text'}`}>
              Ghydra
            </div>
            <div className="text-xs text-accent font-mono">AI Security</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {NAV_ITEMS.map(({ to, label, icon }) => {
            const isActive = location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'text-accent bg-accent/10 border border-accent/20'
                    : dark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-surface-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <img 
                  src={icon}
                  alt=""
                  className="w-5 h-5"
                  style={{ 
                    filter: isActive 
                      ? 'invert(40%) sepia(80%) saturate(500%) hue-rotate(195deg) brightness(110%)'
                      : dark 
                        ? 'invert(70%)' 
                        : 'invert(40%)'
                  }}
                />
                {label}
              </NavLink>
            )
          })}
        </nav>

        {/* Theme Toggle */}
        <div className={`px-4 py-4 border-t ${dark ? 'border-surface-400' : 'border-light-border'}`}>
          <button
            onClick={toggle}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-colors
              ${dark 
                ? 'text-slate-400 hover:text-slate-200 hover:bg-surface-600' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            <img
              src={dark 
                ? 'https://cdn-icons-png.flaticon.com/128/14534/14534850.png' 
                : 'https://cdn-icons-png.flaticon.com/128/12197/12197735.png'
              }
              alt=""
              className="w-5 h-5"
              style={{ filter: dark ? 'invert(70%)' : 'invert(40%)' }}
            />
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="md:ml-64 min-h-screen pb-16 md:pb-0">
        {children}
      </main>
    </>
  )
}

// Layout wrapper component
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const dark = theme === 'dark'
  const [open, setOpen] = useState(false)

  const navLink = (to: string, label: string, icon: string) => {
    const isActive = location.pathname.startsWith(to)
    return (
      <NavLink
        key={to} to={to} onClick={() => setOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
          ${isActive
            ? 'text-accent bg-accent/10 border border-accent/20'
            : dark ? 'text-slate-400 hover:text-slate-200 hover:bg-surface-600'
                   : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
      >
        <img src={icon} alt="" className="w-5 h-5"
          style={{ filter: isActive ? 'invert(40%) sepia(80%) saturate(500%) hue-rotate(195deg) brightness(110%)' : dark ? 'invert(70%)' : 'invert(40%)' }} />
        {label}
      </NavLink>
    )
  }

  const SidebarContent = (
    <>
      <div className={`px-6 py-5 border-b flex items-center gap-3 ${dark ? 'border-surface-400' : 'border-light-border'}`}>
        <img src="/GhydraLogo.png" alt="Ghydra" className="w-8 h-8 object-contain" />
        <div>
          <div className={`font-bold text-base ${dark ? 'text-slate-100' : 'text-light-text'}`}>Ghydra</div>
          <div className="text-xs text-accent font-mono">AI Security</div>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {NAV_ITEMS.map(({ to, label, icon }) => navLink(to, label, icon))}
      </nav>
      <div className={`px-4 py-4 border-t ${dark ? 'border-surface-400' : 'border-light-border'}`}>
        <button onClick={toggle}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-colors
            ${dark ? 'text-slate-400 hover:text-slate-200 hover:bg-surface-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
          <img src={dark ? 'https://cdn-icons-png.flaticon.com/128/14534/14534850.png' : 'https://cdn-icons-png.flaticon.com/128/12197/12197735.png'}
            alt="" className="w-5 h-5" style={{ filter: dark ? 'invert(70%)' : 'invert(40%)' }} />
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex fixed left-0 top-0 w-64 h-full z-40 flex-col
        ${dark ? 'bg-surface-800 border-r border-surface-400' : 'bg-light-surface border-r border-light-border'}`}>
        {SidebarContent}
      </aside>

      {/* Mobile top bar */}
      <header className={`md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14
        ${dark ? 'bg-surface-800 border-b border-surface-400' : 'bg-light-surface border-b border-light-border'}`}>
        <div className="flex items-center gap-2">
          <img src="/GhydraLogo.png" alt="Ghydra" className="w-6 h-6 object-contain" />
          <span className={`font-bold text-sm ${dark ? 'text-slate-100' : 'text-light-text'}`}>Ghydra</span>
        </div>
        <button onClick={() => setOpen(true)}
          className={`p-2 rounded-lg ${dark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-slate-900'}`}
          aria-label="Open menu">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="2" y="5"  width="18" height="2" rx="1" fill="currentColor"/>
            <rect x="2" y="10" width="18" height="2" rx="1" fill="currentColor"/>
            <rect x="2" y="15" width="18" height="2" rx="1" fill="currentColor"/>
          </svg>
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className={`relative w-72 flex flex-col z-10
            ${dark ? 'bg-surface-800' : 'bg-light-surface'}`}>
            <div className={`flex items-center justify-between px-4 py-4 border-b ${dark ? 'border-surface-400' : 'border-light-border'}`}>
              <div className="flex items-center gap-2">
                <img src="/GhydraLogo.png" alt="Ghydra" className="w-7 h-7 object-contain" />
                <span className={`font-bold ${dark ? 'text-slate-100' : 'text-light-text'}`}>Ghydra</span>
              </div>
              <button onClick={() => setOpen(false)}
                className={`p-1 ${dark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500'}`}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <line x1="3" y1="3" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="15" y1="3" x2="3" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
              {NAV_ITEMS.map(({ to, label, icon }) => navLink(to, label, icon))}
            </nav>
            <div className={`px-4 py-4 border-t ${dark ? 'border-surface-400' : 'border-light-border'}`}>
              <button onClick={() => { toggle(); setOpen(false) }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full
                  ${dark ? 'text-slate-400 hover:text-slate-200 hover:bg-surface-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
                <img src={dark ? 'https://cdn-icons-png.flaticon.com/128/14534/14534850.png' : 'https://cdn-icons-png.flaticon.com/128/12197/12197735.png'}
                  alt="" className="w-5 h-5" style={{ filter: dark ? 'invert(70%)' : 'invert(40%)' }} />
                {dark ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="md:ml-64 min-h-screen pt-14 md:pt-0">
        {children}
      </main>
    </>
  )
}