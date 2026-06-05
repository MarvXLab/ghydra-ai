import { useState, useEffect, useRef } from 'react'
import AppLayout from '../components/AppLayout'
import { useTheme } from '../lib/theme'
import api from '../lib/api'

interface Scan {
  id: string
  type: string
  target: string
  is_threat: boolean
  threat_score: number
  created_at: string
}

interface Stats {
  total_scans: number
  threats_found: number
  clean_scans: number
  threat_rate: number
  recent_scans: Scan[]
  model_status: string
}

type TrainingStatus = 'idle' | 'training' | 'done' | 'error'

export default function ThreatDashboard() {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const [stats, setStats] = useState<Stats | null>(null)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>('idle')
  const [log, setLog] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [activating, setActivating] = useState(false)
  const [loading, setLoading] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  const card = dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-gray-200'
  const text = dark ? 'text-slate-100' : 'text-gray-900'
  const muted = dark ? 'text-slate-400' : 'text-gray-500'

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    checkModelStatus()
    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => { clearInterval(interval); if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [log])

  async function checkModelStatus() {
    try {
      const res = await api.get('/')
      setModelLoaded(res.data.model_loaded)
      if (res.data.model_loaded) setTrainingStatus('done')
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function fetchStats() {
    try {
      const res = await api.get('/dashboard/stats')
      setStats(res.data)
      setModelLoaded(res.data.model_status === 'active')
    } catch { /* ignore */ }
  }

  function startPollingLog() {
    if (pollRef.current) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get('/model/log')
        setLog(res.data.log ?? [])
        setProgress(res.data.progress ?? 0)
        const s: TrainingStatus = res.data.status
        setTrainingStatus(s)
        if (s === 'done' || s === 'error') {
          if (s === 'done') setModelLoaded(true)
          setActivating(false)
          clearInterval(pollRef.current!); pollRef.current = null
        }
      } catch { /* ignore */ }
    }, 1500)
  }

  async function handleActivate() {
    setActivating(true)
    setLog(['[ghydra] Initializing AI threat engine...'])
    try {
      await api.post('/model/train')
      setTrainingStatus('training')
      startPollingLog()
    } catch (err: any) {
      if (err.response?.data?.message === 'Model already trained') {
        setModelLoaded(true); setTrainingStatus('done')
      }
      setActivating(false)
    }
  }

  const sevBadge = (score: number) =>
    score >= 0.7 ? 'bg-red-100 text-red-700 border-red-200' :
    score >= 0.4 ? 'bg-orange-100 text-orange-700 border-orange-200' :
                   'bg-yellow-100 text-yellow-700 border-yellow-200'
  const sevLabel = (score: number) => score >= 0.7 ? 'Critical' : score >= 0.4 ? 'High' : 'Medium'

  const threats = stats?.recent_scans?.filter(s => s.is_threat) ?? []
  const showTerminal = trainingStatus === 'training' || trainingStatus === 'error' || activating

  if (loading) return (
    <AppLayout>
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-surface-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className={`min-h-screen ${dark ? 'bg-surface-900' : 'bg-gray-50'} p-4 sm:p-6`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-xl font-bold ${text}`}>Threat Detection</h1>
            <p className={`text-xs mt-0.5 ${muted}`}>Real-time AI threat analysis</p>
          </div>
          <div className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg border
            ${modelLoaded ? 'border-green-500/30 text-green-500 bg-green-500/5' : 'border-red-500/30 text-red-400 bg-red-500/5'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${modelLoaded ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {modelLoaded ? 'AI Active' : 'Engine Offline'}
          </div>
        </div>

        {/* AI Activation Gate */}
        {!modelLoaded && !showTerminal && (
          <div className={`${card} rounded-2xl p-8 text-center mb-6`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${dark ? 'bg-surface-600' : 'bg-gray-100'}`}>
              <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className={`text-base font-bold mb-2 ${text}`}>AI Engine Not Activated</h2>
            <p className={`text-sm mb-5 max-w-sm mx-auto ${muted}`}>
              Train the threat detection model once to bring the AI engine online. Takes 3–8 minutes. Persists permanently after training.
            </p>
            <div className={`text-xs font-mono rounded-lg px-4 py-3 mb-5 text-left max-w-xs mx-auto space-y-1
              ${dark ? 'bg-surface-900 border border-surface-400 text-slate-400' : 'bg-gray-50 border border-gray-200 text-gray-500'}`}>
              <div>Model: MLP 256→128→64</div>
              <div>Dataset: NSL-KDD · 125,973 records</div>
              <div>Est. time: 3–8 minutes</div>
            </div>
            <button onClick={handleActivate} disabled={activating}
              className="bg-accent hover:bg-accent-dim disabled:opacity-50 text-white font-medium px-8 py-2.5 rounded-xl transition-colors">
              {activating ? 'Starting...' : 'Activate AI Engine'}
            </button>
          </div>
        )}

        {/* Training Terminal */}
        {showTerminal && (
          <div className={`${card} rounded-2xl overflow-hidden mb-6`}>
            <div className={`flex items-center gap-2 px-4 py-3 border-b ${dark ? 'border-surface-400 bg-surface-900' : 'border-gray-200 bg-gray-50'}`}>
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className={`ml-2 text-xs font-mono ${muted}`}>ghydra-ai-engine — training</span>
              <span className="ml-auto text-xs font-mono text-accent">{progress}%</span>
            </div>
            <div className="h-48 overflow-y-auto p-4 font-mono text-xs text-green-400 bg-black/90 space-y-0.5">
              {log.map((line, i) => <div key={i} className={line.startsWith('[error]') ? 'text-red-400' : ''}>{line}</div>)}
              {trainingStatus === 'training' && <div className="animate-pulse">█</div>}
              <div ref={logEndRef} />
            </div>
            <div className={`h-1 ${dark ? 'bg-surface-600' : 'bg-gray-200'}`}>
              <div className="h-1 bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            {trainingStatus === 'error' && (
              <div className="p-4 flex justify-center">
                <button onClick={() => { setTrainingStatus('idle'); setLog([]); setProgress(0) }}
                  className="text-sm text-accent hover:underline">← Try again</button>
              </div>
            )}
          </div>
        )}

        {/* Stats — only when model active */}
        {modelLoaded && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total Scans', value: stats?.total_scans ?? 0, color: 'text-blue-500' },
                { label: 'Threats Found', value: stats?.threats_found ?? 0, color: 'text-red-500' },
                { label: 'Clean Scans', value: stats?.clean_scans ?? 0, color: 'text-green-500' },
                { label: 'Threat Rate', value: `${((stats?.threat_rate ?? 0) * 100).toFixed(1)}%`, color: 'text-orange-500' },
              ].map(s => (
                <div key={s.label} className={`${card} rounded-xl p-4`}>
                  <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
                  <p className={`text-xs mt-1 ${muted}`}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Real Map — OpenStreetMap via iframe */}
            <div className={`${card} rounded-2xl overflow-hidden mb-6`}>
              <div className={`flex items-center justify-between px-5 py-3 border-b ${dark ? 'border-surface-400' : 'border-gray-200'}`}>
                <h2 className={`font-semibold text-sm ${text}`}>Global Threat Map</h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className={`text-xs ${muted}`}>Live</span>
                </div>
              </div>
              <div className="relative">
                <iframe
                  src="https://www.openstreetmap.org/export/embed.html?bbox=-180,-90,180,90&layer=mapnik"
                  className="w-full h-64 border-0"
                  title="Threat Map"
                  style={{ filter: dark ? 'invert(0.9) hue-rotate(180deg) brightness(0.85)' : 'none' }}
                />
                {/* Overlay threat dots from real scan data */}
                <div className="absolute inset-0 pointer-events-none">
                  {threats.slice(0, 8).map((t, i) => (
                    <div key={i} className="absolute animate-pulse"
                      style={{ left: `${20 + (i * 10) % 70}%`, top: `${20 + (i * 13) % 60}%` }}>
                      <div className={`w-3 h-3 rounded-full border-2 border-white shadow-lg
                        ${t.threat_score >= 0.7 ? 'bg-red-500' : t.threat_score >= 0.4 ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Threat feed + top sources */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Live threat feed */}
              <div className={`${card} rounded-2xl overflow-hidden`}>
                <div className={`px-5 py-3 border-b ${dark ? 'border-surface-400' : 'border-gray-200'} flex items-center justify-between`}>
                  <h3 className={`font-semibold text-sm ${text}`}>Live Threat Feed</h3>
                  <span className={`text-xs ${muted}`}>10s refresh</span>
                </div>
                <div className="divide-y divide-current divide-opacity-10 max-h-80 overflow-y-auto">
                  {threats.length === 0 ? (
                    <p className={`text-sm text-center py-8 ${muted}`}>No threats detected. Network is clean.</p>
                  ) : threats.map(t => (
                    <div key={t.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-sm font-mono truncate ${text}`}>{t.target}</p>
                        <p className={`text-xs ${muted}`}>{t.type} · {new Date(t.created_at).toLocaleTimeString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium shrink-0 ${sevBadge(t.threat_score)}`}>
                        {sevLabel(t.threat_score)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scan breakdown */}
              <div className={`${card} rounded-2xl overflow-hidden`}>
                <div className={`px-5 py-3 border-b ${dark ? 'border-surface-400' : 'border-gray-200'}`}>
                  <h3 className={`font-semibold text-sm ${text}`}>Threat Breakdown</h3>
                </div>
                <div className="p-5 space-y-4">
                  {[
                    { label: 'URL Threats', value: threats.filter(t => t.type === 'url').length, total: stats?.total_scans ?? 1, color: 'bg-red-500' },
                    { label: 'Device Threats', value: threats.filter(t => t.type === 'device').length, total: stats?.total_scans ?? 1, color: 'bg-orange-500' },
                    { label: 'Clean Scans', value: stats?.clean_scans ?? 0, total: stats?.total_scans ?? 1, color: 'bg-green-500' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className={muted}>{item.label}</span>
                        <span className={text}>{item.value}</span>
                      </div>
                      <div className={`h-1.5 rounded-full ${dark ? 'bg-surface-600' : 'bg-gray-100'}`}>
                        <div className={`h-1.5 rounded-full ${item.color} transition-all duration-700`}
                          style={{ width: `${Math.min((item.value / item.total) * 100, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
