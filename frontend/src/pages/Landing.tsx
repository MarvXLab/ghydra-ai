import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../lib/theme'

const FEATURES = [
  {
    icon: 'https://cdn-icons-png.flaticon.com/128/18266/18266543.png',
    title: 'AI Threat Detection',
    desc: 'Neural network trained on 125K+ samples detects threats in under 2ms.',
    mobile: 'Real-time AI threat detection'
  },
  {
    icon: 'https://cdn-icons-png.flaticon.com/128/16543/16543092.png',
    title: 'URL Safety Scanner',
    desc: 'Check any website for malware, phishing, and suspicious content before you visit.',
    mobile: 'Scan URLs for safety'
  },
  {
    icon: 'https://cdn-icons-png.flaticon.com/128/1161/1161439.png',
    title: 'Real-time Protection',
    desc: 'Get instant alerts when accessing potentially dangerous sites.',
    mobile: 'Real-time alerts'
  },
  {
    icon: 'https://cdn-icons-png.flaticon.com/128/10382/10382366.png',
    title: 'Developer API',
    desc: 'Integrate our threat detection into your applications with our API.',
    mobile: 'Developer tools'
  },
]

const STATS = [
  { value: '97.4%', label: 'Detection Rate' },
  { value: '125K+', label: 'Training Data' },
  { value: '<2ms', label: 'Response Time' },
  { value: '24/7', label: 'Protection' },
]

export default function Landing() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  const [isMobile] = useState(window.innerWidth < 768)

  return (
    <div className={`min-h-screen ${dark ? 'bg-surface-900 text-slate-200' : 'bg-light-bg text-light-text'}`}>

      {/* ── Mobile Top Bar / Desktop Header ── */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-md 
        ${dark ? 'border-surface-400 bg-surface-800/80' : 'border-light-border bg-light-surface/80'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/GhydraLogo.png" alt="Ghydra" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />
            <span className="font-bold text-sm sm:text-base tracking-tight">Ghydra</span>
            <span className="text-[9px] sm:text-[10px] font-mono bg-accent/10 text-accent border border-accent/30 px-1 py-0.5 rounded ml-1">
              AI
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className={`${dark ? 'text-slate-400 hover:text-slate-100' : 'text-light-muted hover:text-light-text'} transition-colors`}>
              Features
            </a>
            <a href="#pricing" className={`${dark ? 'text-slate-400 hover:text-slate-100' : 'text-light-muted hover:text-light-text'} transition-colors`}>
              Pricing
            </a>
            <Link to="/auth/login" className={`${dark ? 'text-slate-400 hover:text-slate-100' : 'text-light-muted hover:text-light-text'} transition-colors`}>
              Sign In
            </Link>
            <Link to="/auth/register" className="btn-primary py-2 px-4 text-xs">
              Get Started
            </Link>
            <button onClick={toggle} className="p-1.5 rounded">
              <img
                src={dark ? 'https://cdn-icons-png.flaticon.com/128/14534/14534850.png' : 'https://cdn-icons-png.flaticon.com/128/12197/12197735.png'}
                alt=""
                style={{ filter: dark ? 'invert(70%)' : 'invert(20%)', width: 16, height: 16 }}
              />
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 rounded">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="5" width="16" height="1.5" rx="1" fill="currentColor"/>
              <rect x="2" y="9" width="16" height="1.5" rx="1" fill="currentColor"/>
              <rect x="2" y="13" width="16" height="1.5" rx="1" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative px-4 sm:px-6 py-8 sm:py-16">
        <div className="max-w-6xl mx-auto">
          
          {/* Mobile-first layout */}
          <div className="md:grid md:grid-cols-2 md:gap-12 md:items-center">
            
            {/* Content - appears first on mobile */}
            <div className="text-center md:text-left mb-8 md:mb-0">
              
              {/* Status badge */}
              <div className={`inline-flex items-center gap-2 text-xs font-mono border px-3 py-1.5 rounded-full mb-6
                ${dark ? 'border-accent/30 text-accent bg-accent/5' : 'border-accent/40 text-accent bg-accent/5'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
                <span className="hidden sm:inline">AI Engine v2.0 — </span>Ready to Protect
              </div>

              {/* Headlines */}
              <h1 className={`text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-4 sm:mb-6
                ${dark ? 'text-slate-50' : 'text-light-text'}`}>
                <span className="block sm:inline">Next-gen </span>
                <span className="text-accent">cybersecurity</span>
                <span className="block sm:inline"> that works.</span>
              </h1>

              <p className={`text-base sm:text-lg max-w-lg mx-auto md:mx-0 mb-6 sm:mb-8 leading-relaxed
                ${dark ? 'text-slate-400' : 'text-light-muted'}`}>
                {isMobile 
                  ? "AI-powered threat detection. Real-time protection. Developer-ready API."
                  : "Advanced AI analyzes threats in real-time. Protect your browsing, secure your apps, monitor your projects — all from one powerful platform."
                }
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 sm:gap-4">
                <Link to="/auth/register" className="btn-primary w-full sm:w-auto px-8 py-3 text-base">
                  Start Free Trial
                </Link>
                <a href="#features" className="btn-outline w-full sm:w-auto px-8 py-3 text-base">
                  See Features
                </a>
              </div>

              {/* Trust indicators - desktop only */}
              <div className="hidden md:flex items-center gap-6 mt-8 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  No credit card required
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  GDPR compliant
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  99.9% uptime SLA
                </div>
              </div>
            </div>

            {/* Hero Visual - Abstract Dashboard Mockup */}
            <div className="relative">
              <div className={`aspect-video sm:aspect-square rounded-2xl overflow-hidden p-6 relative
                ${dark ? 'bg-gradient-to-br from-surface-700 to-surface-800 border border-surface-400' : 'bg-gradient-to-br from-blue-50 to-slate-100 border border-gray-200'}`}>
                
                {/* Abstract Dashboard Visual */}
                <div className="relative z-10 space-y-4">
                  {/* Top bar */}
                  <div className="flex items-center justify-between">
                    <div className={`h-8 w-24 rounded ${dark ? 'bg-surface-600' : 'bg-white/60'}`} />
                    <div className="flex gap-2">
                      <div className={`h-8 w-8 rounded ${dark ? 'bg-surface-600' : 'bg-white/60'}`} />
                      <div className={`h-8 w-8 rounded ${dark ? 'bg-surface-600' : 'bg-white/60'}`} />
                    </div>
                  </div>

                  {/* Stats cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className={`p-3 rounded-lg ${dark ? 'bg-surface-600/50' : 'bg-white/50'}`}>
                      <div className={`h-3 w-8 rounded mb-2 ${dark ? 'bg-accent/30' : 'bg-accent/20'}`} />
                      <div className={`h-4 w-12 rounded ${dark ? 'bg-surface-500' : 'bg-gray-200'}`} />
                    </div>
                    <div className={`p-3 rounded-lg ${dark ? 'bg-surface-600/50' : 'bg-white/50'}`}>
                      <div className={`h-3 w-8 rounded mb-2 ${dark ? 'bg-green-400/30' : 'bg-green-400/20'}`} />
                      <div className={`h-4 w-12 rounded ${dark ? 'bg-surface-500' : 'bg-gray-200'}`} />
                    </div>
                    <div className={`p-3 rounded-lg ${dark ? 'bg-surface-600/50' : 'bg-white/50'}`}>
                      <div className={`h-3 w-8 rounded mb-2 ${dark ? 'bg-red-400/30' : 'bg-red-400/20'}`} />
                      <div className={`h-4 w-12 rounded ${dark ? 'bg-surface-500' : 'bg-gray-200'}`} />
                    </div>
                  </div>

                  {/* Chart area */}
                  <div className={`p-4 rounded-lg ${dark ? 'bg-surface-600/30' : 'bg-white/40'}`}>
                    <div className="flex items-end gap-1 h-24">
                      {[40, 70, 50, 90, 60, 80, 55, 75].map((height, i) => (
                        <div 
                          key={i}
                          className={`flex-1 rounded-t ${dark ? 'bg-accent/40' : 'bg-accent/30'}`}
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Live indicator */}
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className={`text-xs font-mono ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Live Monitoring
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className={`border-y ${dark ? 'border-surface-400 bg-surface-800/50' : 'border-light-border bg-light-surface/50'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <div className="text-xl sm:text-3xl font-bold font-mono text-accent mb-1">{value}</div>
                <div className={`text-xs uppercase tracking-widest ${dark ? 'text-slate-500' : 'text-light-muted'}`}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-6xl mx-auto">
          
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h2 className={`text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 ${dark ? 'text-slate-100' : 'text-light-text'}`}>
              Everything you need to stay secure
            </h2>
            <p className={`text-sm sm:text-base max-w-2xl mx-auto ${dark ? 'text-slate-400' : 'text-light-muted'}`}>
              Advanced AI protection, developer tools, and real-time monitoring — all in one platform.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {FEATURES.map(({ icon, title, desc, mobile }) => (
              <div key={title} className={`${dark ? 'card' : 'card-light'} p-4 sm:p-6 text-center sm:text-left`}>
                
                {/* Icon */}
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto sm:mx-0 mb-4
                  ${dark ? 'bg-surface-500' : 'bg-slate-100'}`}>
                  <img 
                    src={icon} 
                    alt="" 
                    style={{ 
                      filter: dark ? 'invert(60%) sepia(40%) saturate(400%) hue-rotate(195deg)' : 'invert(20%)', 
                      width: 24, 
                      height: 24 
                    }} 
                  />
                </div>

                {/* Content */}
                <h3 className={`font-semibold text-sm sm:text-base mb-2 ${dark ? 'text-slate-100' : 'text-light-text'}`}>
                  {title}
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${dark ? 'text-slate-400' : 'text-light-muted'}`}>
                  <span className="sm:hidden">{mobile}</span>
                  <span className="hidden sm:block">{desc}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section id="pricing" className={`border-t ${dark ? 'border-surface-400' : 'border-light-border'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
          
          <h2 className={`text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 ${dark ? 'text-slate-100' : 'text-light-text'}`}>
            Ready to get protected?
          </h2>
          <p className={`text-sm sm:text-base mb-6 sm:mb-8 ${dark ? 'text-slate-400' : 'text-light-muted'}`}>
            Start with our free tier. Upgrade when you need more.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth/register" className="btn-primary w-full sm:w-auto px-8 py-3 text-base">
              Start Free Trial
            </Link>
            <Link to="/pricing" className="btn-outline w-full sm:w-auto px-8 py-3 text-base">
              See Pricing
            </Link>
          </div>

          <p className={`text-xs mt-4 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
            No credit card required • Cancel anytime • GDPR compliant
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={`border-t ${dark ? 'border-surface-400 bg-surface-800/30' : 'border-light-border bg-slate-50'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <span className={dark ? 'text-slate-600' : 'text-slate-400'}>
              © 2025 Ghydra. Advanced threat detection platform.
            </span>
            <div className="flex items-center gap-4">
              <a href="/privacy" className={`${dark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'} transition-colors`}>
                Privacy
              </a>
              <a href="/terms" className={`${dark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'} transition-colors`}>
                Terms
              </a>
              <span className="font-mono text-accent">v2.0.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}