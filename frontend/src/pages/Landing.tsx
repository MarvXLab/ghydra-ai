import { Link } from 'react-router-dom'
import { useTheme } from '../lib/theme'

const FEATURES = [
  {
    icon: 'https://cdn-icons-png.flaticon.com/128/13409/13409733.png',
    title: 'Real-Time Threat Detection',
    desc: 'MLP neural network trained on 125,000+ NSL-KDD records classifies network traffic in under 2ms.',
  },
  {
    icon: 'https://cdn-icons-png.flaticon.com/128/2441/2441861.png',
    title: 'IP Threat Mapping',
    desc: 'Every flagged connection is traced to its origin IP and plotted on a live threat map.',
  },
  {
    icon: 'https://cdn-icons-png.flaticon.com/128/8042/8042206.png',
    title: 'Device Scanner',
    desc: 'Scan your device for malicious agents, suspicious user-agents, and known attack patterns.',
  },
  {
    icon: 'https://cdn-icons-png.flaticon.com/128/4289/4289749.png',
    title: 'One-Time Model Training',
    desc: 'Train the AI engine once. The model persists — no re-training required across sessions.',
  },
]

const STATS = [
  { value: '97.4%', label: 'Detection Accuracy' },
  { value: '125K+', label: 'Training Samples' },
  { value: '<2ms',  label: 'Inference Latency' },
  { value: '4',     label: 'Attack Categories' },
]

export default function Landing() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'

  return (
    <div className={`min-h-screen ${dark ? 'bg-surface-900 text-slate-200' : 'bg-light-bg text-light-text'}`}>

      {/* ── Top nav ── */}
      <header className={`border-b ${dark ? 'border-surface-400 bg-surface-800' : 'border-light-border bg-light-surface'}`}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/GhydraLogo.png" alt="Ghydra" className="w-7 h-7 object-contain" />
            <span className="font-bold text-base tracking-tight">Ghydra</span>
            <span className="text-[10px] font-mono bg-accent/10 text-accent border border-accent/30 px-1.5 py-0.5 rounded ml-1">
              AI
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className={`${dark ? 'text-slate-400 hover:text-slate-100' : 'text-light-muted hover:text-light-text'} transition-colors`}>Features</a>
            <Link to="/pricing" className={`${dark ? 'text-slate-400 hover:text-slate-100' : 'text-light-muted hover:text-light-text'} transition-colors`}>Pricing</Link>
            <Link to="/dashboard" className="btn-primary py-1.5 px-4 text-xs">Open Dashboard</Link>
            <button onClick={toggle} className={`${dark ? 'text-slate-400 hover:text-slate-100' : 'text-light-muted'}`}>
              <img
                src={dark ? 'https://cdn-icons-png.flaticon.com/128/14534/14534850.png' : 'https://cdn-icons-png.flaticon.com/128/12197/12197735.png'}
                alt="toggle theme"
                style={{ filter: dark ? 'invert(70%)' : 'invert(20%)', width: 18, height: 18 }}
              />
            </button>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className={`inline-flex items-center gap-2 text-xs font-mono border px-3 py-1 rounded mb-8
          ${dark ? 'border-accent/30 text-accent bg-accent/5' : 'border-accent/40 text-accent bg-accent/5'}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
          AI Engine — NSL-KDD MLP Classifier v2.0
        </div>

        <h1 className={`text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6
          ${dark ? 'text-slate-50' : 'text-light-text'}`}>
          Network threat detection<br />
          <span className="text-accent">that actually works.</span>
        </h1>

        <p className={`text-lg max-w-2xl mx-auto mb-10 leading-relaxed
          ${dark ? 'text-slate-400' : 'text-light-muted'}`}>
          Ghydra runs a trained neural network on your traffic in real time.
          No cloud dependency. No subscriptions for basic protection. Open dashboard, activate once.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/dashboard" className="btn-primary px-7 py-3 text-base">
            Open Dashboard
          </Link>
          <a href="#features" className="btn-outline px-7 py-3 text-base">
            See How It Works
          </a>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className={`border-y ${dark ? 'border-surface-400 bg-surface-800' : 'border-light-border bg-light-surface'}`}>
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl font-bold font-mono text-accent">{value}</div>
              <div className={`text-xs mt-1 uppercase tracking-widest ${dark ? 'text-slate-500' : 'text-light-muted'}`}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className={`text-2xl font-bold mb-2 ${dark ? 'text-slate-100' : 'text-light-text'}`}>
          What Ghydra does
        </h2>
        <p className={`text-sm mb-10 ${dark ? 'text-slate-500' : 'text-light-muted'}`}>
          Built on real ML — not rules and signatures.
        </p>
        <div className="grid md:grid-cols-2 gap-5">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className={`${dark ? 'card' : 'card-light'} p-6 flex gap-4`}>
              <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0
                ${dark ? 'bg-surface-500' : 'bg-slate-100'}`}>
                <img src={icon} alt="" style={{ filter: dark ? 'invert(60%)' : 'invert(20%)', width: 20, height: 20 }} />
              </div>
              <div>
                <h3 className={`font-semibold text-sm mb-1 ${dark ? 'text-slate-100' : 'text-light-text'}`}>{title}</h3>
                <p className={`text-sm leading-relaxed ${dark ? 'text-slate-400' : 'text-light-muted'}`}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={`border-t ${dark ? 'border-surface-400' : 'border-light-border'}`}>
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className={`text-3xl font-bold mb-4 ${dark ? 'text-slate-100' : 'text-light-text'}`}>
            Ready to activate?
          </h2>
          <p className={`text-sm mb-8 ${dark ? 'text-slate-400' : 'text-light-muted'}`}>
            One-time model training. Persistent across sessions. Free tier included.
          </p>
          <Link to="/threats" className="btn-primary px-8 py-3 text-base">
            Activate AI Engine
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={`border-t ${dark ? 'border-surface-400' : 'border-light-border'}`}>
        <div className={`max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs
          ${dark ? 'text-slate-600' : 'text-light-muted'}`}>
          <span>© 2025 Ghydra. Zero-knowledge threat detection.</span>
          <span className="font-mono">v2.0.0</span>
        </div>
      </footer>
    </div>
  )
}
