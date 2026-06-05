import { useState, useEffect, useRef } from 'react'
import AppLayout from '../components/AppLayout'
import { useTheme } from '../lib/theme'
import api from '../lib/api'

interface UserProfile {
  id: string; email: string; full_name: string; username: string | null
  bio: string | null; avatar_url: string | null; subscription_tier: string; created_at: string
}

interface Device {
  id: string; name: string; type: string; last_seen: string; created_at: string
}

export default function Settings() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  const fileRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<'profile' | 'devices' | 'security' | 'about'>('profile')
  const topRef = useRef<HTMLDivElement>(null)

  function switchTab(t: typeof tab) {
    setTab(t)
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [form, setForm] = useState({ full_name: '', username: '', bio: '', avatar_url: '' })
  const [devices, setDevices] = useState<Device[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [linkingDevice, setLinkingDevice] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [connStatus, setConnStatus] = useState<'idle'|'checking'|'ok'|'fail'>('idle')

  const card = dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-gray-200'
  const text = dark ? 'text-slate-100' : 'text-gray-900'
  const muted = dark ? 'text-slate-400' : 'text-gray-500'
  const input = `w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-all
    ${dark ? 'bg-surface-900 border-surface-400 text-slate-100 focus:border-accent placeholder-slate-600'
           : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-accent placeholder-gray-400'}`

  useEffect(() => { fetchProfile(); fetchDevices() }, [])

  async function fetchProfile() {
    try {
      const res = await api.get('/auth/me')
      setProfile(res.data)
      setForm({ full_name: res.data.full_name || '', username: res.data.username || '',
                bio: res.data.bio || '', avatar_url: res.data.avatar_url || '' })
    } catch { /* use localStorage fallback */
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      setForm({ full_name: u.full_name || '', username: '', bio: '', avatar_url: '' })
    }
  }

  async function fetchDevices() {
    try { const res = await api.get('/devices'); setDevices(res.data) }
    catch { /* ignore */ }
  }

  async function saveProfile() {
    setSaving(true); setError(''); setSaved(false)
    try {
      await api.put('/auth/profile', form)
      setSaved(true); setTimeout(() => setSaved(false), 2500)
      fetchProfile()
    } catch (e: any) { setError(e.response?.data?.detail || 'Failed to save') }
    setSaving(false)
  }

  async function linkDevice() {
    if (!deviceName.trim()) return
    setLinkingDevice(true)
    try {
      await api.post('/devices/link', { device_name: deviceName, device_type: 'browser' })
      setDeviceName(''); fetchDevices()
    } catch (e: any) { setError(e.response?.data?.detail || 'Failed to link device') }
    setLinkingDevice(false)
  }

  async function unlinkDevice(id: string) {
    try { await api.delete(`/devices/${id}`); fetchDevices() }
    catch { /* ignore */ }
  }

  // Cloudinary upload — needs VITE_CLOUDINARY_CLOUD_NAME + VITE_CLOUDINARY_UPLOAD_PRESET
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    if (!cloudName || !preset) {
      setError('Cloudinary not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env')
      return
    }
    setUploadingAvatar(true)
    const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', preset)
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      const newUrl = data.secure_url
      setForm(f => ({ ...f, avatar_url: newUrl }))
      // auto-save to backend
      await api.put('/auth/profile', { avatar_url: newUrl })
      fetchProfile()
    } catch { setError('Avatar upload failed') }
    setUploadingAvatar(false)
  }

  function logout() { localStorage.clear(); window.location.href = '/auth/login' }

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'devices', label: 'Devices' },
    { id: 'security', label: 'Security' },
    { id: 'about', label: 'About' },
  ] as const

  return (
    <AppLayout>
      <div className={`min-h-screen ${dark ? 'bg-surface-900' : 'bg-gray-50'} p-4 sm:p-6`}>
        <div className="max-w-2xl mx-auto">
          <h1 className={`text-xl font-bold mb-6 ${text}`}>Settings</h1>

          {/* Tabs */}
          <div ref={topRef} className={`flex gap-1 p-1 rounded-xl mb-6 ${dark ? 'bg-surface-800' : 'bg-gray-100'}`}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => switchTab(t.id)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors
                  ${tab === t.id ? (dark ? 'bg-surface-600 text-slate-100' : 'bg-white text-gray-900 shadow-sm') : muted}`}>
                {t.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
              <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-600">✕</button>
            </div>
          )}

          {/* ── Profile Tab ── */}
          {tab === 'profile' && (
            <div className="space-y-4">
              <div className={`${card} rounded-2xl p-6`}>
                {/* Avatar */}
                <div className="flex items-start gap-5 mb-6">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-accent/20 flex items-center justify-center">
                      {form.avatar_url ? (
                        <img src={form.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-accent">
                          {(form.full_name || profile?.email || 'U')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <button onClick={() => fileRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white shadow-lg hover:bg-accent-dim transition-colors">
                      {uploadingAvatar ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.83a4 4 0 01-1.897 1.06l-2.796.699.699-2.796a4 4 0 011.06-1.897z" />
                        </svg>
                      )}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-lg truncate ${text}`}>{profile?.full_name || 'Your Name'}</p>
                    <p className={`text-sm truncate ${muted}`}>{profile?.email}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1.5 inline-block
                      ${profile?.subscription_tier === 'pro'
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : dark ? 'bg-surface-600 text-slate-400 border border-surface-400' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                      {profile?.subscription_tier === 'pro' ? '✦ Pro Plan' : 'Free Plan'}
                    </span>
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${muted}`}>Full Name</label>
                      <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                        placeholder="Your full name" className={input} />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${muted}`}>Username</label>
                      <div className="relative">
                        <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${muted}`}>@</span>
                        <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.replace(/[^a-z0-9_-]/gi, '').toLowerCase() }))}
                          placeholder="username" className={input + ' pl-7'} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${muted}`}>Bio</label>
                    <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                      placeholder="Tell us a little about yourself..." rows={3}
                      className={input + ' resize-none'} />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${muted}`}>Email</label>
                    <input value={profile?.email || ''} disabled
                      className={input + ' opacity-50 cursor-not-allowed'} />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-5 pt-5 border-t border-current border-opacity-10">
                  <div className={`text-xs ${muted}`}>
                    Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                  </div>
                  <button onClick={saveProfile} disabled={saving}
                    className="bg-accent hover:bg-accent-dim disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors">
                    {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Changes'}
                  </button>
                </div>
              </div>

              <button onClick={logout}
                className="w-full py-3 rounded-2xl text-sm font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors">
                Sign Out
              </button>
            </div>
          )}

          {/* ── Devices Tab ── */}
          {tab === 'devices' && (
            <div className="space-y-4">
              <div className={`${card} rounded-2xl p-6`}>
                <div className="flex items-center justify-between mb-1">
                  <h2 className={`font-semibold ${text}`}>Linked Devices</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${dark ? 'bg-surface-600 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                    {devices.length} / {profile?.subscription_tier === 'pro' ? '∞' : '2'}
                  </span>
                </div>
                <p className={`text-xs mb-5 ${muted}`}>
                  Free plan: 2 devices. Each linked device gets real-time threat alerts in the browser.
                </p>

                {/* Link new device */}
                <div className="flex gap-2 mb-5">
                  <input value={deviceName} onChange={e => setDeviceName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && linkDevice()}
                    placeholder="Device name (e.g. My MacBook)" className={input + ' flex-1'} />
                  <button onClick={linkDevice} disabled={linkingDevice || !deviceName.trim()}
                    className="bg-accent hover:bg-accent-dim disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shrink-0">
                    {linkingDevice ? '...' : 'Link'}
                  </button>
                </div>

                {/* Device list */}
                <div className="space-y-2">
                  {devices.length === 0 ? (
                    <p className={`text-sm text-center py-6 ${muted}`}>No devices linked yet.</p>
                  ) : devices.map(d => (
                    <div key={d.id} className={`flex items-center justify-between p-3 rounded-xl ${dark ? 'bg-surface-700' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dark ? 'bg-surface-600' : 'bg-white border border-gray-200'}`}>
                          <svg className={`w-4 h-4 ${muted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${text}`}>{d.name}</p>
                          <p className={`text-xs ${muted}`}>Last seen {new Date(d.last_seen).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button onClick={() => unlinkDevice(d.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1">
                        Unlink
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {profile?.subscription_tier !== 'pro' && (
                <div className={`${card} rounded-2xl p-5 border-accent/30`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${text}`}>Upgrade to Pro</p>
                      <p className={`text-xs ${muted}`}>Link unlimited devices and get priority threat alerts</p>
                    </div>
                    <button className="ml-auto bg-accent text-white text-xs font-medium px-4 py-2 rounded-lg shrink-0">
                      Upgrade
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Security Tab ── */}
          {tab === 'security' && (
            <div className="space-y-4">
              <div className={`${card} rounded-2xl p-6 space-y-4`}>
                <h2 className={`font-semibold ${text}`}>API Connection</h2>
                <div className={`font-mono text-sm px-3 py-2 rounded-lg ${dark ? 'bg-surface-900 text-slate-300' : 'bg-gray-50 text-gray-700'}`}>
                  {import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={async () => { setConnStatus('checking'); try { await api.get('/'); setConnStatus('ok') } catch { setConnStatus('fail') } }}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${dark ? 'border-surface-400 text-slate-300 hover:bg-surface-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                    Test Connection
                  </button>
                  <span className={`text-sm font-mono ${{ idle: muted, checking: 'text-yellow-400', ok: 'text-green-500', fail: 'text-red-500' }[connStatus]}`}>
                    {{ idle: 'Not checked', checking: 'Checking...', ok: 'Connected ✓', fail: 'Unreachable ✗' }[connStatus]}
                  </span>
                </div>
              </div>
              <div className={`${card} rounded-2xl p-6`}>
                <div className="flex items-center justify-between mb-1">
                  <h2 className={`font-semibold ${text}`}>Appearance</h2>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className={`text-sm ${text}`}>Theme</p>
                    <p className={`text-xs ${muted}`}>Currently {dark ? 'Dark' : 'Light'} mode</p>
                  </div>
                  <button onClick={toggle}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${dark ? 'border-surface-400 text-slate-300 hover:bg-surface-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                    Switch to {dark ? 'Light' : 'Dark'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── About Tab ── */}
          {tab === 'about' && (
            <div className={`${card} rounded-2xl p-6`}>
              <h2 className={`font-semibold mb-4 ${text}`}>About Ghydra</h2>
              <div className="space-y-2 text-sm font-mono">
                {[['Product','Ghydra AI Threat Detection'],['Version','v2.0.0'],['Model','MLP 256→128→64 (sklearn)'],
                  ['Dataset','NSL-KDD (125,973 records)'],['Frontend','React + Tailwind — Cloudflare Pages'],
                  ['Backend','FastAPI + uvicorn — Render']].map(([k,v]) => (
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
