import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { useTheme } from '../lib/theme'
import api from '../lib/api'

export default function Settings() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle')
  const [tab, setTab] = useState<'profile' | 'security' | 'about'>('profile')

  const card = dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-gray-200'
  const text = dark ? 'text-slate-100' : 'text-gray-900'
  const muted = dark ? 'text-slate-400' : 'text-gray-500'

  async function checkConnection() {
    setStatus('checking')
    try { await api.get('/'); setStatus('ok') }
    catch { setStatus('fail') }
  }

  function logout() {
    localStorage.clear()
    window.location.href = '/auth/login'
  }

  const statusColor = { idle: muted, checking: 'text-yellow-400', ok: 'text-green-500', fail: 'text-red-500' }
  const statusLabel = { idle: 'Not checked', checking: 'Checking...', ok: 'Connected ✓', fail: 'Unreachable ✗' }

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'about', label: 'About' },
  ] as const

  return (
    <AppLayout>
      <div className={`min-h-screen ${dark ? 'bg-surface-900' : 'bg-gray-50'} p-4 sm:p-6`}>
        <div className="max-w-2xl mx-auto">

          <h1 className={`text-xl font-bold mb-6 ${text}`}>Settings</h1>

          {/* Tabs */}
          <div className={`flex gap-1 p-1 rounded-xl mb-6 ${dark ? 'bg-surface-800' : 'bg-gray-100'}`}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors
                  ${tab === t.id
                    ? dark ? 'bg-surface-600 text-slate-100' : 'bg-white text-gray-900 shadow-sm'
                    : muted}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {tab === 'profile' && (
            <div className="space-y-4">
              <div className={`${card} rounded-2xl p-6`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-2xl font-bold text-accent">
                    {(user.full_name || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className={`font-semibold text-lg ${text}`}>{user.full_name || 'User'}</p>
                    <p className={`text-sm ${muted}`}>{user.email || '—'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block
                      ${user.subscription_tier === 'pro'
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                      {user.subscription_tier === 'pro' ? 'Pro Plan' : 'Free Plan'}
                    </span>
                  </div>
                </div>

                <div className={`text-sm space-y-3 pt-4 border-t ${dark ? 'border-surface-400' : 'border-gray-100'}`}>
                  <div className="flex justify-between">
                    <span className={muted}>Member since</span>
                    <span className={text}>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={muted}>Devices (Free: max 1)</span>
                    <span className={text}>1 / 1</span>
                  </div>
                </div>
              </div>

              <div className={`${card} rounded-2xl p-6`}>
                <h2 className={`font-semibold mb-4 ${text}`}>Appearance</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${text}`}>Theme</p>
                    <p className={`text-xs ${muted}`}>Currently: {dark ? 'Dark' : 'Light'}</p>
                  </div>
                  <button onClick={toggle}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors
                      ${dark ? 'border-surface-400 text-slate-300 hover:bg-surface-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                    Switch to {dark ? 'Light' : 'Dark'}
                  </button>
                </div>
              </div>

              <button onClick={logout}
                className="w-full py-3 rounded-2xl text-sm font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors">
                Sign Out
              </button>
            </div>
          )}

          {/* Security Tab */}
          {tab === 'security' && (
            <div className="space-y-4">
              <div className={`${card} rounded-2xl p-6 space-y-4`}>
                <h2 className={`font-semibold ${text}`}>API Connection</h2>
                <div className={`font-mono text-sm px-3 py-2 rounded-lg ${dark ? 'bg-surface-900 text-slate-300' : 'bg-gray-50 text-gray-700'}`}>
                  {import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={checkConnection}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors
                      ${dark ? 'border-surface-400 text-slate-300 hover:bg-surface-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                    Test Connection
                  </button>
                  <span className={`text-sm font-mono ${statusColor[status]}`}>{statusLabel[status]}</span>
                </div>
              </div>

              <div className={`${card} rounded-2xl p-6`}>
                <h2 className={`font-semibold mb-4 ${text}`}>Real-Time Protection</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Browser Tab Scanning', desc: 'Alert when visiting malicious sites', enabled: true },
                    { label: 'Device Threat Monitor', desc: 'Monitor suspicious processes', enabled: true },
                    { label: 'Auto-block High Risk', desc: 'Automatically block critical threats', enabled: false },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2">
                      <div>
                        <p className={`text-sm font-medium ${text}`}>{item.label}</p>
                        <p className={`text-xs ${muted}`}>{item.desc}</p>
                      </div>
                      <div className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer
                        ${item.enabled ? 'bg-accent' : dark ? 'bg-surface-500' : 'bg-gray-200'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform
                          ${item.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* About Tab */}
          {tab === 'about' && (
            <div className={`${card} rounded-2xl p-6`}>
              <h2 className={`font-semibold mb-4 ${text}`}>About Ghydra</h2>
              <div className="space-y-2 text-sm font-mono">
                {[
                  ['Product', 'Ghydra AI Threat Detection'],
                  ['Version', 'v2.0.0'],
                  ['Model', 'MLP 256→128→64 (sklearn)'],
                  ['Dataset', 'NSL-KDD (125,973 records)'],
                  ['Frontend', 'React + Tailwind — Cloudflare Pages'],
                  ['Backend', 'FastAPI + uvicorn — Render'],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-4">
                    <span className={`w-24 shrink-0 ${muted}`}>{k}</span>
                    <span className={text}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
