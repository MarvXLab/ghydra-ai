import { useState, useEffect, useRef } from 'react'
import AppLayout from '../components/AppLayout'
import { useTheme } from '../lib/theme'
import api from '../lib/api'

interface UserProfile {
  id: string; email: string; full_name: string; username: string | null
  bio: string | null; avatar_url: string | null; subscription_tier: string; created_at: string
  is_developer: boolean; pronouns: string | null; dev_url: string | null
  company: string | null; location: string | null; social_links: string[]
}

interface Device {
  id: string; name: string; type: string; last_seen: string; created_at: string
}

const SNIPPETS: Record<string, string> = {
  HTML: `<!-- Add to your HTML page -->
<script>
async function scanUrl(url) {
  const res = await fetch('https://ghydra-ai.onrender.com/scan/url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  const data = await res.json();
  if (data.is_threat) {
    alert('\u26a0\ufe0f Threat detected: ' + data.flags.join(', '));
    return false; // block navigation
  }
  return true;
}

// Usage: call before any link click
document.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', async (e) => {
    e.preventDefault();
    const safe = await scanUrl(a.href);
    if (safe) window.location.href = a.href;
  });
});
</script>`,

  JavaScript: `const GHYDRA_KEY = 'YOUR_API_KEY';
const BASE = 'https://ghydra-ai.onrender.com';

async function scanUrl(url) {
  const res = await fetch(\`\${BASE}/scan/url\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${GHYDRA_KEY}\`
    },
    body: JSON.stringify({ url })
  });
  return res.json();
}

async function scanDevice() {
  const res = await fetch(\`\${BASE}/scan/device\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${GHYDRA_KEY}\`
    },
    body: JSON.stringify({ user_agent: navigator.userAgent })
  });
  return res.json();
}

// Example
scanUrl('https://suspicious-site.xyz').then(result => {
  if (result.is_threat) {
    console.warn('Threat detected!', result.flags);
  }
});`,

  React: `import { useEffect, useState } from 'react';

const GHYDRA_KEY = 'YOUR_API_KEY';

export function useThreatScan(url: string) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    fetch('https://ghydra-ai.onrender.com/scan/url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${GHYDRA_KEY}\`
      },
      body: JSON.stringify({ url })
    })
    .then(r => r.json())
    .then(data => { setResult(data); setLoading(false); });
  }, [url]);

  return { result, loading };
}

// Usage in a component:
// const { result } = useThreatScan('https://example.com');
// if (result?.is_threat) return <ThreatWarning flags={result.flags} />;`,

  Python: `import httpx

GHYDRA_KEY = 'YOUR_API_KEY'
BASE_URL = 'https://ghydra-ai.onrender.com'

def scan_url(url: str) -> dict:
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {GHYDRA_KEY}'
    }
    with httpx.Client() as client:
        r = client.post(
            f'{BASE_URL}/scan/url',
            json={'url': url},
            headers=headers
        )
    return r.json()

def scan_device(user_agent: str) -> dict:
    with httpx.Client() as client:
        r = client.post(
            f'{BASE_URL}/scan/device',
            json={'user_agent': user_agent},
            headers={'Authorization': f'Bearer {GHYDRA_KEY}'}
        )
    return r.json()

# Example
result = scan_url('https://suspicious-site.xyz')
if result['is_threat']:
    print(f"Threat detected! Flags: {result['flags']}")`,

  'Node.js': `const GHYDRA_KEY = 'YOUR_API_KEY';
const BASE = 'https://ghydra-ai.onrender.com';

async function scanUrl(url) {
  const res = await fetch(\`\${BASE}/scan/url\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${GHYDRA_KEY}\`
    },
    body: JSON.stringify({ url })
  });
  return res.json();
}

// Express.js middleware example
const express = require('express');
const app = express();

app.use(async (req, res, next) => {
  const referer = req.headers.referer;
  if (referer) {
    const scan = await scanUrl(referer);
    if (scan.is_threat) {
      return res.status(403).json({ error: 'Blocked: threat detected', flags: scan.flags });
    }
  }
  next();
});`,

  cURL: `# Scan a URL
curl -X POST https://ghydra-ai.onrender.com/scan/url \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -d '{"url": "https://suspicious-site.xyz"}'

# Scan a device / IP
curl -X POST https://ghydra-ai.onrender.com/scan/device \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -d '{"user_agent": "Mozilla/5.0 ..."}'

# Response format:
# {
#   "is_threat": true,
#   "threat_score": 0.75,
#   "flags": ["Suspicious TLD", "URL obfuscation detected"],
#   "scan_id": "abc123"
# }`
}

function CodeSnippets({ dark }: { dark: boolean }) {
  const [lang, setLang] = useState('JavaScript')
  const [copied, setCopied] = useState(false)
  const langs = Object.keys(SNIPPETS)
  const muted = dark ? 'text-slate-400' : 'text-gray-500'

  function copy() {
    navigator.clipboard.writeText(SNIPPETS[lang])
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      {/* Lang tabs */}
      <div className={`flex gap-0 border-b ${dark ? 'border-surface-400' : 'border-gray-200'} px-2 overflow-x-auto`}>
        {langs.map(l => (
          <button key={l} onClick={() => setLang(l)}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors
              ${lang === l
                ? 'border-accent text-accent'
                : `border-transparent ${muted} hover:text-accent`}`}>
            {l}
          </button>
        ))}
      </div>
      {/* Code block */}
      <div className="relative">
        <pre className={`text-xs font-mono p-4 overflow-x-auto leading-relaxed max-h-72
          ${dark ? 'bg-surface-900 text-green-400' : 'bg-gray-50 text-gray-800'}`}>
          {SNIPPETS[lang]}
        </pre>
        <button onClick={copy}
          className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-lg border transition-colors
            ${dark ? 'border-surface-400 text-slate-400 hover:text-slate-100 bg-surface-800' : 'border-gray-200 text-gray-500 hover:text-gray-900 bg-white'}`}>
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

export default function Settings() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  const fileRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<'profile' | 'devices' | 'security' | 'developer' | 'about'>('profile')
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
  const [projects, setProjects] = useState<any[]>([])
  const [newProject, setNewProject] = useState({ name: '', description: '', website: '' })
  const [creatingProject, setCreatingProject] = useState(false)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const DELETE_PHRASE = 'delete this project'
  // Developer enrolment flow
  type DevStep = 'locked' | 'sending' | 'otp' | 'verifying' | 'profile' | 'projects'
  const [devStep, setDevStep] = useState<DevStep>('locked')
  const [devOtp, setDevOtp] = useState('')
  const [devOtpError, setDevOtpError] = useState('')
  // Developer profile form
  const [devForm, setDevForm] = useState({
    full_name: '', bio: '', pronouns: '', dev_url: '', company: '', location: '',
    social_links: ['', '', '', '']
  })
  const [devSaving, setDevSaving] = useState(false)
  const [devSaved, setDevSaved] = useState(false)
  type ProjStep = 'form' | 'sending' | 'otp' | 'verifying'
  const [projStep, setProjStep] = useState<ProjStep>('form')
  const [projOtp, setProjOtp] = useState('')
  const [projOtpError, setProjOtpError] = useState('')

  const card = dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-gray-200'
  const text = dark ? 'text-slate-100' : 'text-gray-900'
  const muted = dark ? 'text-slate-400' : 'text-gray-500'
  const input = `w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-all
    ${dark ? 'bg-surface-900 border-surface-400 text-slate-100 focus:border-accent placeholder-slate-600'
           : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-accent placeholder-gray-400'}`

  useEffect(() => {
    fetchProfile(); fetchDevices(); fetchProjects()
  }, [])

  useEffect(() => {
    if (!profile) return
    if (profile.is_developer) {
      setDevStep('projects')
      setDevForm({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        pronouns: profile.pronouns || '',
        dev_url: profile.dev_url || '',
        company: profile.company || '',
        location: profile.location || '',
        social_links: [...(profile.social_links || []), '', '', '', ''].slice(0, 4)
      })
    } else {
      setDevStep('locked')
    }
  }, [profile])

  async function fetchProjects() {
    try { const res = await api.get('/developer/projects'); setProjects(res.data) }
    catch { /* ignore */ }
  }

  async function createProject() {
    if (!newProject.name.trim()) return
    // Step 1: request OTP
    if (projStep === 'form') {
      setProjStep('sending')
      try {
        await api.post('/developer/projects/request-key')
        setProjStep('otp')
      } catch (e: any) { setError(e.response?.data?.detail || 'Failed to send code'); setProjStep('form') }
      return
    }
    // Step 2: verify OTP + create
    if (projStep === 'otp') {
      if (!projOtp.trim()) { setProjOtpError('Enter the code'); return }
      setProjStep('verifying'); setCreatingProject(true)
      try {
        await api.post('/developer/projects', { ...newProject, otp_code: projOtp })
        setNewProject({ name: '', description: '', website: '' })
        setProjOtp(''); setProjStep('form'); setProjOtpError('')
        fetchProjects()
      } catch (e: any) { setProjOtpError(e.response?.data?.detail || 'Invalid code'); setProjStep('otp') }
      setCreatingProject(false)
    }
  }

  async function requestDevEnroll() {
    setDevStep('sending')
    try {
      await api.post('/developer/enroll/request')
      setDevStep('otp')
    } catch (e: any) { setError(e.response?.data?.detail || 'Failed to send code'); setDevStep('locked') }
  }

  async function verifyDevEnroll() {
    if (!devOtp.trim()) { setDevOtpError('Enter the code'); return }
    setDevStep('verifying')
    try {
      await api.post('/developer/enroll/verify', { code: devOtp })
      setDevOtp(''); setDevOtpError('')
      setDevStep('profile')
      await fetchProfile()
    } catch (e: any) { setDevOtpError(e.response?.data?.detail || 'Invalid code'); setDevStep('otp') }
  }

  async function saveDevProfile() {
    setDevSaving(true)
    try {
      await api.put('/developer/profile', {
        ...devForm,
        social_links: devForm.social_links.filter(s => s.trim())
      })
      setDevSaved(true); setTimeout(() => setDevSaved(false), 2500)
      setDevStep('projects')
      await fetchProfile()
    } catch (e: any) { setError(e.response?.data?.detail || 'Failed to save') }
    setDevSaving(false)
  }

  async function deleteProject(id: string) {
    try { await api.delete(`/developer/projects/${id}`); fetchProjects(); setDeleteModal(null); setDeleteConfirm('') }
    catch { /* ignore */ }
  }

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
    { id: 'developer', label: 'Developer' },
    { id: 'about', label: 'About' },
  ] as const

  return (
    <AppLayout>
      <div className={`min-h-screen ${dark ? 'bg-surface-900' : 'bg-gray-50'} p-4 sm:p-6`}>
        <div className="max-w-2xl mx-auto">
          <h1 className={`text-xl font-bold mb-6 ${text}`}>Settings</h1>

          {/* Tabs — scrollable on mobile */}
          <div ref={topRef} className={`flex gap-1 p-1 rounded-xl mb-6 overflow-x-auto scrollbar-hide ${dark ? 'bg-surface-800' : 'bg-gray-100'}`}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => switchTab(t.id)}
                className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap
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

          {/* ── Developer Tab ── */}
          {tab === 'developer' && (
            <div className="space-y-4">

              {/* LOCKED — not a developer yet */}
              {(devStep === 'locked' || devStep === 'sending') && (
                <div className={`${card} rounded-2xl p-8 text-center`}>
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h2 className={`font-bold text-lg mb-2 ${text}`}>Become a Developer</h2>
                  <p className={`text-sm mb-6 max-w-sm mx-auto ${muted}`}>
                    Integrate Ghydra threat detection into your apps. Get API keys, view analytics, and protect your users.
                  </p>
                  <div className={`text-left rounded-xl p-4 mb-6 space-y-2 ${dark ? 'bg-surface-700' : 'bg-gray-50'}`}>
                    {['Get project API keys','Real-time threat analytics dashboard','Integration guides for HTML, React, Python & more','User behaviour analytics (Pro)'].map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={`text-sm ${text}`}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={requestDevEnroll} disabled={devStep === 'sending'}
                    className="bg-accent hover:bg-accent-dim disabled:opacity-50 text-white font-medium px-8 py-3 rounded-xl transition-colors">
                    {devStep === 'sending' ? 'Sending code...' : 'Get Started — Verify Email'}
                  </button>
                  <p className={`text-xs mt-3 ${muted}`}>A verification code will be sent to {profile?.email}</p>
                </div>
              )}

              {/* OTP verification step */}
              {(devStep === 'otp' || devStep === 'verifying') && (
                <div className={`${card} rounded-2xl p-8 text-center`}>
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className={`font-bold text-lg mb-1 ${text}`}>Check your email</h2>
                  <p className={`text-sm mb-6 ${muted}`}>Enter the 6-digit code sent to <span className="text-accent">{profile?.email}</span></p>
                  <input value={devOtp} onChange={e => { setDevOtp(e.target.value.replace(/\D/g,'').slice(0,6)); setDevOtpError('') }}
                    placeholder="000000" maxLength={6}
                    className={`w-40 text-center text-2xl font-mono tracking-widest px-4 py-3 rounded-xl border outline-none mx-auto block mb-2 transition-all
                      ${dark ? 'bg-surface-900 border-surface-400 text-slate-100 focus:border-accent' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-accent'}
                      ${devOtpError ? 'border-red-500' : ''}`} />
                  {devOtpError && <p className="text-xs text-red-500 mb-3">{devOtpError}</p>}
                  <button onClick={verifyDevEnroll} disabled={devStep === 'verifying' || devOtp.length < 6}
                    className="bg-accent hover:bg-accent-dim disabled:opacity-50 text-white font-medium px-8 py-3 rounded-xl transition-colors mb-3">
                    {devStep === 'verifying' ? 'Verifying...' : 'Verify & Activate'}
                  </button>
                  <br />
                  <button onClick={() => setDevStep('locked')} className={`text-xs ${muted} hover:text-accent`}>← Go back</button>
                </div>
              )}

              {/* Developer profile setup */}
              {devStep === 'profile' && (
                <div className={`${card} rounded-2xl p-6`}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h2 className={`font-bold ${text}`}>Developer account activated!</h2>
                      <p className={`text-xs ${muted}`}>Set up your public developer profile</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${muted}`}>Name</label>
                        <input value={devForm.full_name} onChange={e => setDevForm(f => ({...f, full_name: e.target.value}))}
                          placeholder="Your name" className={input} />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${muted}`}>Pronouns</label>
                        <input value={devForm.pronouns} onChange={e => setDevForm(f => ({...f, pronouns: e.target.value}))}
                          placeholder="e.g. he/him" className={input} />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${muted}`}>Bio</label>
                      <textarea value={devForm.bio} onChange={e => setDevForm(f => ({...f, bio: e.target.value}))}
                        placeholder="Web & App Developer | ..." rows={3} className={input + ' resize-none'} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${muted}`}>Company</label>
                        <input value={devForm.company} onChange={e => setDevForm(f => ({...f, company: e.target.value}))}
                          placeholder="Your company" className={input} />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${muted}`}>Location</label>
                        <input value={devForm.location} onChange={e => setDevForm(f => ({...f, location: e.target.value}))}
                          placeholder="City, Country" className={input} />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${muted}`}>URL</label>
                      <input value={devForm.dev_url} onChange={e => setDevForm(f => ({...f, dev_url: e.target.value}))}
                        placeholder="https://yoursite.com" className={input} />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${muted}`}>Social accounts</label>
                      <div className="space-y-2">
                        {devForm.social_links.map((s, i) => (
                          <input key={i} value={s}
                            onChange={e => setDevForm(f => { const sl = [...f.social_links]; sl[i] = e.target.value; return {...f, social_links: sl} })}
                            placeholder={`Link to social profile ${i + 1}`} className={input} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-5">
                    <button onClick={() => setDevStep('projects')} className={`px-4 py-2.5 rounded-xl text-sm border transition-colors ${dark ? 'border-surface-400 text-slate-300 hover:bg-surface-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                      Skip for now
                    </button>
                    <button onClick={saveDevProfile} disabled={devSaving}
                      className="flex-1 bg-accent hover:bg-accent-dim disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
                      {devSaving ? 'Saving...' : devSaved ? 'Saved ✓' : 'Save Profile & Continue'}
                    </button>
                  </div>
                </div>
              )}

              {/* Fully unlocked developer portal */}
              {devStep === 'projects' && (
                <>
                  {/* Developer profile card */}
                  <div className={`${card} rounded-2xl p-5`}>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-accent/20 flex items-center justify-center shrink-0">
                          {profile?.avatar_url
                            ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                            : <span className="text-xl font-bold text-accent">{(profile?.full_name || 'D')[0].toUpperCase()}</span>}
                        </div>
                        <div>
                          <p className={`font-semibold ${text}`}>{profile?.full_name}</p>
                          <p className={`text-xs ${muted}`}>@{profile?.username || profile?.email?.split('@')[0]}</p>
                          {profile?.pronouns && <p className={`text-xs ${muted}`}>{profile.pronouns}</p>}
                        </div>
                      </div>
                      <button onClick={() => setDevStep('profile')}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${dark ? 'border-surface-400 text-slate-300 hover:bg-surface-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        Edit profile
                      </button>
                    </div>
                    {profile?.bio && <p className={`text-sm mb-3 ${text}`}>{profile.bio}</p>}
                    <div className={`flex flex-wrap gap-x-4 gap-y-1 text-xs ${muted}`}>
                      {profile?.company && <span>🏢 {profile.company}</span>}
                      {profile?.location && <span>📍 {profile.location}</span>}
                      {profile?.dev_url && <a href={profile.dev_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">🔗 {profile.dev_url}</a>}
                    </div>
                    {(profile?.social_links?.filter(s => s).length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {profile!.social_links.filter(s => s).map((s, i) => (
                          <a key={i} href={s} target="_blank" rel="noopener noreferrer"
                            className={`text-xs px-3 py-1 rounded-full border hover:text-accent transition-colors ${dark ? 'border-surface-400 text-slate-400' : 'border-gray-200 text-gray-500'}`}>
                            {new URL(s).hostname.replace('www.', '')}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Create project */}
                  <div className={`${card} rounded-2xl p-6`}>
                    <h2 className={`font-semibold mb-1 ${text}`}>Projects</h2>
                    <p className={`text-xs mb-4 ${muted}`}>Each project gets its own API key. A verification code will be sent to your email before the key is issued.</p>

                    {(projStep === 'form' || projStep === 'sending') && (
                      <div className="space-y-3 mb-6">
                        <input value={newProject.name} onChange={e => setNewProject(p => ({...p, name: e.target.value}))}
                          placeholder="Project name *" className={input} />
                        <input value={newProject.description} onChange={e => setNewProject(p => ({...p, description: e.target.value}))}
                          placeholder="Description (optional)" className={input} />
                        <input value={newProject.website} onChange={e => setNewProject(p => ({...p, website: e.target.value}))}
                          placeholder="Website URL (optional)" className={input} />
                        <button onClick={createProject} disabled={projStep === 'sending' || !newProject.name.trim()}
                          className="w-full bg-accent hover:bg-accent-dim disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
                          {projStep === 'sending' ? 'Sending verification code...' : '+ Create Project'}
                        </button>
                      </div>
                    )}

                    {(projStep === 'otp' || projStep === 'verifying') && (
                      <div className={`rounded-xl p-4 mb-6 ${dark ? 'bg-surface-700' : 'bg-gray-50'}`}>
                        <p className={`text-sm font-medium mb-1 ${text}`}>Verify to create project</p>
                        <p className={`text-xs mb-3 ${muted}`}>Enter the 6-digit code sent to {profile?.email}</p>
                        <div className="flex gap-2">
                          <input value={projOtp} onChange={e => { setProjOtp(e.target.value.replace(/\D/g,'').slice(0,6)); setProjOtpError('') }}
                            placeholder="000000" maxLength={6}
                            className={`flex-1 text-center font-mono tracking-widest px-3 py-2.5 rounded-xl border outline-none text-sm transition-all
                              ${dark ? 'bg-surface-900 border-surface-400 text-slate-100 focus:border-accent' : 'bg-white border-gray-200 text-gray-900 focus:border-accent'}
                              ${projOtpError ? 'border-red-500' : ''}`} />
                          <button onClick={createProject} disabled={projStep === 'verifying' || projOtp.length < 6 || creatingProject}
                            className="bg-accent hover:bg-accent-dim disabled:opacity-50 text-white text-sm font-medium px-4 rounded-xl transition-colors">
                            {creatingProject ? '...' : 'Confirm'}
                          </button>
                        </div>
                        {projOtpError && <p className="text-xs text-red-500 mt-2">{projOtpError}</p>}
                        <button onClick={() => { setProjStep('form'); setProjOtp(''); setProjOtpError('') }}
                          className={`text-xs mt-2 ${muted} hover:text-accent`}>← Cancel</button>
                      </div>
                    )}

                    {/* Project list */}
                    <div className="space-y-3">
                      {projects.length === 0
                        ? <p className={`text-sm text-center py-4 ${muted}`}>No projects yet.</p>
                        : projects.map(p => (
                          <div key={p.id} className={`rounded-xl p-4 ${dark ? 'bg-surface-700' : 'bg-gray-50'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className={`font-medium text-sm ${text}`}>{p.name}</p>
                                {p.website && <p className={`text-xs truncate ${muted}`}>{p.website}</p>}
                                <div className="flex items-center gap-2 mt-2">
                                  <code className={`text-xs font-mono px-2 py-1 rounded ${dark ? 'bg-surface-900 text-green-400' : 'bg-gray-100 text-gray-700'}`}>
                                    {revealedKey === p.id ? p.api_key : 'ghk_••••••••••••••••'}
                                  </code>
                                  <button onClick={() => setRevealedKey(revealedKey === p.id ? null : p.id)}
                                    className={`text-xs ${muted} hover:text-accent transition-colors`}>
                                    {revealedKey === p.id ? 'Hide' : 'Reveal'}
                                  </button>
                                  <button onClick={() => navigator.clipboard.writeText(p.api_key)}
                                    className={`text-xs ${muted} hover:text-accent transition-colors`}>Copy</button>
                                </div>
                              </div>
                              <button onClick={() => { setDeleteModal({ id: p.id, name: p.name }); setDeleteConfirm('') }}
                                className="text-xs text-red-400 hover:text-red-600 shrink-0">Delete</button>
                            </div>
                            <a href={`/developer/${p.id}/analytics`}
                              className="mt-3 flex items-center gap-1 text-xs text-accent hover:underline">View Analytics →</a>
                          </div>
                        ))
                      }
                    </div>
                  </div>

                  {/* Integration guide */}
                  <div className={`${card} rounded-2xl overflow-hidden`}>
                    <div className={`px-5 py-4 border-b ${dark ? 'border-surface-400' : 'border-gray-200'}`}>
                      <h3 className={`font-semibold text-sm ${text}`}>Integration Guide</h3>
                      <p className={`text-xs mt-0.5 ${muted}`}>Replace <code className="text-accent">YOUR_API_KEY</code> with your project key above.</p>
                    </div>
                    <CodeSnippets dark={dark} />
                  </div>
                </>
              )}
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

      {/* ── Delete Confirmation Modal ── */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-semibold ${text}`}>Delete project</h3>
                <p className={`text-xs ${muted}`}>{deleteModal.name}</p>
              </div>
            </div>
            <p className={`text-sm mb-1 ${muted}`}>
              This will permanently delete the project and revoke its API key. Any apps using it will stop working.
            </p>
            <p className={`text-sm mb-4 ${text}`}>
              Type <span className="font-mono text-red-500">{DELETE_PHRASE}</span> to confirm.
            </p>
            <input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={DELETE_PHRASE}
              className={`w-full px-3 py-2.5 rounded-xl text-sm outline-none border mb-4 transition-all
                ${dark ? 'bg-surface-900 border-surface-400 text-slate-100 focus:border-red-500 placeholder-slate-600'
                       : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-red-500 placeholder-gray-400'}`}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteModal(null); setDeleteConfirm('') }}
                className={`flex-1 py-2.5 rounded-xl text-sm border transition-colors
                  ${dark ? 'border-surface-400 text-slate-300 hover:bg-surface-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                Cancel
              </button>
              <button
                onClick={() => deleteProject(deleteModal.id)}
                disabled={deleteConfirm !== DELETE_PHRASE}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors">
                Delete project
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
