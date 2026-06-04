import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useTheme } from '../lib/theme'
import api from '../lib/api'

interface ScanResult {
  ip: string
  threat: boolean
  score: number
  flags: string[]
}

export default function Network() {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const [scanning,  setScanning]  = useState(false)
  const [result,    setResult]    = useState<ScanResult | null>(null)
  const [error,     setError]     = useState('')
  const [scanPhase, setScanPhase] = useState('')

  const PHASES = [
    'Collecting device fingerprint...',
    'Analysing request headers...',
    'Checking IP reputation...',
    'Running heuristic scan...',
    'Generating threat report...',
  ]

  async function runScan() {
    setScanning(true)
    setResult(null)
    setError('')

    // Walk through phases for UX
    for (let i = 0; i < PHASES.length; i++) {
      setScanPhase(PHASES[i])
      await new Promise(r => setTimeout(r, 700))
    }

    try {
      // Grab public IP via ipify, fall back gracefully
      let ip = 'unknown'
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json')
        ip = (await ipRes.json()).ip
      } catch { /* ignore */ }

      const res = await api.post('/scan', {
        ip,
        user_agent: navigator.userAgent,
        referrer: document.referrer,
      })
      setResult(res.data)
    } catch {
      setError('Scan failed — backend may be sleeping. Try again in 30s.')
    }

    setScanPhase('')
    setScanning(false)
  }

  const text  = dark ? 'text-slate-100' : 'text-light-text'
  const muted = dark ? 'text-slate-500' : 'text-light-muted'

  return (
    <div className={`flex min-h-screen ${dark ? 'bg-surface-900' : 'bg-light-bg'}`}>
      <Sidebar />

      <main className="md:ml-56 flex-1 p-4 md:p-6 pt-16 md:pt-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className={`text-xl font-bold ${text}`}>Network Scanner</h1>
          <p className={`text-xs mt-0.5 ${muted}`}>Scan your current connection for threats</p>
        </div>

        {/* Scan card */}
        <div className={`${dark ? 'card' : 'card-light'} p-8`}>
          <div className="flex gap-4 mb-6">
            <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0
              ${dark ? 'bg-surface-500' : 'bg-slate-100'}`}>
              <img
                src="https://cdn-icons-png.flaticon.com/128/2441/2441861.png"
                alt=""
                style={{ filter: dark ? 'invert(60%)' : 'invert(20%)', width: 20, height: 20 }}
              />
            </div>
            <div>
              <h2 className={`font-semibold text-sm ${text}`}>Device & Connection Scan</h2>
              <p className={`text-xs mt-0.5 ${muted}`}>
                Analyses your IP, user-agent, and request headers against known attack signatures.
              </p>
            </div>
          </div>

          <button
            onClick={runScan}
            disabled={scanning}
            className="btn-primary px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scanning ? 'Scanning...' : 'Run Scan'}
          </button>
        </div>

        {/* Scan phases */}
        {scanning && (
          <div className={`terminal`}>
            <div className="terminal-bar">
              <span className="terminal-dot bg-red-500" />
              <span className="terminal-dot bg-yellow-500" />
              <span className="terminal-dot bg-green-500" />
              <span className="ml-3 text-slate-500 text-xs font-mono">ghydra — device scan</span>
            </div>
            <div className="p-4 font-mono text-xs text-green-400 space-y-1">
              {PHASES.map((p, i) => {
                const current = PHASES.indexOf(scanPhase)
                if (i > current) return null
                return (
                  <div key={p}>
                    <span className="text-slate-600 mr-2">[{String(i + 1).padStart(2, '0')}]</span>
                    <span className={i === current ? 'text-yellow-300' : 'text-green-400'}>{p}</span>
                    {i === current && <span className="animate-blink ml-1">_</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="border border-threat-critical/30 bg-threat-critical/5 rounded-lg px-5 py-4 text-sm text-threat-critical">
            {error}
          </div>
        )}

        {/* Result */}
        {result && !scanning && (
          <div className={`${dark ? 'card' : 'card-light'} overflow-hidden`}>
            {/* Status bar */}
            <div className={`px-5 py-4 border-b ${dark ? 'border-surface-400' : 'border-light-border'} flex items-center justify-between`}>
              <span className={`text-sm font-semibold ${text}`}>Scan Complete</span>
              <span className={`text-xs font-mono border rounded px-2 py-0.5
                ${result.threat
                  ? 'border-threat-critical/30 text-threat-critical bg-threat-critical/5'
                  : 'border-green-500/30 text-green-400 bg-green-500/5'}`}>
                {result.threat ? 'THREAT DETECTED' : 'CLEAN'}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* IP */}
              <div className="flex justify-between text-sm">
                <span className={muted}>Source IP</span>
                <span className={`font-mono font-medium ${text}`}>{result.ip}</span>
              </div>

              {/* Score */}
              <div className="flex justify-between text-sm items-center">
                <span className={muted}>Threat Score</span>
                <div className="flex items-center gap-3">
                  <div className={`h-1.5 w-32 rounded-full ${dark ? 'bg-surface-400' : 'bg-slate-200'}`}>
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500
                        ${result.score > 0.7 ? 'bg-threat-critical' : result.score > 0.3 ? 'bg-threat-high' : 'bg-threat-low'}`}
                      style={{ width: `${result.score * 100}%` }}
                    />
                  </div>
                  <span className={`font-mono text-xs ${text}`}>{result.score.toFixed(3)}</span>
                </div>
              </div>

              {/* Flags */}
              <div className="flex justify-between text-sm">
                <span className={muted}>Flags</span>
                <span className={`text-right max-w-xs ${text}`}>
                  {result.flags.length > 0 ? result.flags.join(', ') : 'None'}
                </span>
              </div>

              {/* Verdict */}
              <div className={`mt-2 rounded px-4 py-3 text-xs font-medium
                ${result.threat
                  ? 'bg-threat-critical/10 border border-threat-critical/20 text-threat-critical'
                  : 'bg-threat-low/10 border border-threat-low/20 text-threat-low'}`}>
                {result.threat
                  ? `Suspicious activity detected from ${result.ip}. Connection has been flagged.`
                  : `No threats detected. Your connection appears clean.`}
              </div>
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'User-Agent Analysis', desc: 'Detects scanners like sqlmap, nikto, masscan, and zgrab.' },
            { label: 'IP Heuristics', desc: 'Checks origin against known threat vectors and private ranges.' },
          ].map(({ label, desc }) => (
            <div key={label} className={`${dark ? 'card' : 'card-light'} p-4`}>
              <p className={`text-xs font-semibold mb-1 ${text}`}>{label}</p>
              <p className={`text-xs ${muted}`}>{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
