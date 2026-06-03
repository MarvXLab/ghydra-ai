import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useTheme } from '../lib/theme'
import api from '../lib/api'

export default function Settings() {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const [apiUrl, setApiUrl]     = useState(import.meta.env.VITE_API_URL ?? 'http://localhost:8000')
  const [saved,  setSaved]      = useState(false)
  const [status, setStatus]     = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle')

  const text  = dark ? 'text-slate-100' : 'text-light-text'
  const muted = dark ? 'text-slate-400' : 'text-light-muted'
  const dim   = dark ? 'text-slate-600' : 'text-slate-400'
  const inputCls = `w-full px-3 py-2 rounded text-sm font-mono outline-none
    ${dark
      ? 'bg-surface-900 border border-surface-400 text-slate-200 focus:border-accent'
      : 'bg-white border border-light-border text-light-text focus:border-accent'}
    transition-colors`

  async function checkConnection() {
    setStatus('checking')
    try {
      await api.get('/')
      setStatus('ok')
    } catch {
      setStatus('fail')
    }
  }

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const statusMap = {
    idle:     { label: 'Not checked',  cls: dim },
    checking: { label: 'Checking...', cls: 'text-yellow-400' },
    ok:       { label: 'Connected',   cls: 'text-threat-low' },
    fail:     { label: 'Unreachable', cls: 'text-threat-critical' },
  }

  return (
    <div className={`flex min-h-screen ${dark ? 'bg-surface-900' : 'bg-light-bg'}`}>
      <Sidebar />

      <main className="ml-56 flex-1 p-6 space-y-6 max-w-2xl">
        <div>
          <h1 className={`text-xl font-bold ${text}`}>Settings</h1>
          <p className={`text-xs mt-0.5 ${muted}`}>Configuration and diagnostics</p>
        </div>

        {/* Backend */}
        <div className={`${dark ? 'card' : 'card-light'} p-6 space-y-4`}>
          <h2 className={`text-sm font-semibold ${text}`}>Backend API</h2>
          <div>
            <label className={`block text-xs mb-1.5 ${muted}`}>API Base URL</label>
            <input
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
              className={inputCls}
              placeholder="https://your-backend.onrender.com"
            />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={checkConnection} className="btn-outline py-1.5 px-4 text-xs">
              Test Connection
            </button>
            <button onClick={save} className="btn-primary py-1.5 px-4 text-xs">
              {saved ? 'Saved' : 'Save'}
            </button>
            <span className={`text-xs font-mono ${statusMap[status].cls}`}>
              {statusMap[status].label}
            </span>
          </div>
          <p className={`text-xs ${dim}`}>
            Note: VITE_API_URL is set at build time. This field shows the current value for reference.
            Update your <span className="font-mono">.env</span> to change it permanently.
          </p>
        </div>

        {/* Appearance */}
        <div className={`${dark ? 'card' : 'card-light'} p-6 space-y-4`}>
          <h2 className={`text-sm font-semibold ${text}`}>Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${text}`}>Theme</p>
              <p className={`text-xs ${muted}`}>Currently: {dark ? 'Dark' : 'Light'}</p>
            </div>
            <button
              onClick={() => {}}
              className={`text-xs border rounded px-4 py-1.5 transition-colors
                ${dark
                  ? 'border-surface-400 text-slate-300 hover:border-accent hover:text-accent'
                  : 'border-light-border text-light-muted hover:border-accent hover:text-accent'}`}
            >
              Toggle in sidebar
            </button>
          </div>
        </div>

        {/* About */}
        <div className={`${dark ? 'card' : 'card-light'} p-6`}>
          <h2 className={`text-sm font-semibold mb-3 ${text}`}>About</h2>
          <div className="space-y-2 text-xs font-mono">
            {[
              ['Product',  'Ghydra Threat Detection'],
              ['Version',  'v2.0.0'],
              ['Model',    'MLP 256→128→64 (sklearn)'],
              ['Dataset',  'NSL-KDD (125,973 records)'],
              ['Frontend', 'React + Tailwind — Cloudflare Pages'],
              ['Backend',  'FastAPI + uvicorn — Render'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-4">
                <span className={`w-24 shrink-0 ${dim}`}>{k}</span>
                <span className={text}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
