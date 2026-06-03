import { NavLink, useLocation } from 'react-router-dom'
import { useTheme } from '../lib/theme'

const NAV = [
  { to: '/dashboard',  label: 'Dashboard', icon: 'https://cdn-icons-png.flaticon.com/128/8042/8042206.png' },
  { to: '/threats',    label: 'Threats',   icon: 'https://cdn-icons-png.flaticon.com/128/13409/13409733.png' },
  { to: '/network',    label: 'Network',   icon: 'https://cdn-icons-png.flaticon.com/128/2441/2441861.png' },
  { to: '/pricing',    label: 'Pricing',   icon: 'https://cdn-icons-png.flaticon.com/128/4289/4289749.png' },
  { to: '/settings',   label: 'Settings',  icon: 'https://cdn-icons-png.flaticon.com/128/60/60473.png' },
]

export default function Sidebar() {
  const { theme, toggle } = useTheme()
  const location = useLocation()

  const iconStyle = (active: boolean) => ({
    filter: active
      ? 'invert(40%) sepia(80%) saturate(500%) hue-rotate(195deg) brightness(110%)'
      : theme === 'dark'
        ? 'invert(70%) brightness(0.8)'
        : 'invert(20%)',
    width: 18, height: 18,
  })

  return (
    <aside className={`
      fixed left-0 top-0 h-full w-56 flex flex-col z-40
      ${theme === 'dark' ? 'bg-surface-800 border-r border-surface-400' : 'bg-light-surface border-r border-light-border'}
    `}>
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-3 border-b border-surface-400">
        <img src="/GhydraLogo.png" alt="Ghydra" className="w-7 h-7 object-contain" />
        <span className={`font-bold text-base tracking-tight ${theme === 'dark' ? 'text-slate-100' : 'text-light-text'}`}>
          Ghydra
        </span>
        <span className="ml-auto text-[10px] font-mono bg-accent/10 text-accent border border-accent/30 px-1.5 py-0.5 rounded">
          AI
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ to, label, icon }) => {
          const active = location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={`nav-link ${active ? 'active' : ''}`}
            >
              <img src={icon} alt="" style={iconStyle(active)} />
              {label}
            </NavLink>
          )
        })}
      </nav>

      {/* Theme toggle */}
      <div className={`px-3 py-4 border-t ${theme === 'dark' ? 'border-surface-400' : 'border-light-border'}`}>
        <button
          onClick={toggle}
          className={`nav-link w-full ${theme === 'dark' ? '' : 'text-light-muted hover:text-light-text hover:bg-slate-100'}`}
        >
          <img
            src={theme === 'dark'
              ? 'https://cdn-icons-png.flaticon.com/128/14534/14534850.png'
              : 'https://cdn-icons-png.flaticon.com/128/12197/12197735.png'}
            alt=""
            style={{ filter: theme === 'dark' ? 'invert(70%)' : 'invert(20%)', width: 18, height: 18 }}
          />
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </aside>
  )
}
