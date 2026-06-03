import { useEffect, useRef, useState } from 'react'
import { useBeforeUnload } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TrainingTerminal from '../components/TrainingTerminal'
import { useTheme } from '../lib/theme'
import api from '../lib/api'

interface Threat {
  ip: string
  threat: boolean
  score: number
  flags: string[]
  ts: number
}

type TrainingStatus = 'idle' | 'training' | 'done' | 'error'

export default function Threats() {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const [modelLoaded,  setModelLoaded]  = useState(false)
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>('idle')
  const [log,          setLog]          = useState<string[]>([])
  const [progress,     setProgress]     = useState(0)
  const [threats,      setThreats]      = useState<Threat[]>([])
  const [activating,   setActivating]   = useState(false)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Warn on refresh during training
  useBeforeUnload(
    (e) => {
      if (trainingStatus === 'training') {
        e.preventDefault()
        return 'Model training is in progress. Refreshing will interrupt it.'
      }
    }
  )

  // On mount — check model status
  useEffect(() => {
    checkStatus()
    const feed = setInterval(fetchThreats, 5000)
    return () => {
      clearInterval(feed)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  async function checkStatus() {
    try {
      const res = await api.get('/model/status')
      setModelLoaded(res.data.loaded)
      const t = res.data.training?.status as TrainingStatus
      if (t === 'training' || t === 'done') {
        setTrainingStatus(t)
        setLog(res.data.training.log ?? [])
        setProgress(res.data.training.progress ?? 0)
        if (t === 'training') startPollingLog()
      }
    } catch { /* ignore */ }
  }

  async function fetchThreats() {
    try {
      const res = await api.get('/threats/feed')
      setThreats(res.data.threats)
    } catch { /* ignore */ }
  }

  function startPollingLog() {
    if (pollRef.current) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get('/model/log')
        setLog(res.data.log)
        setProgress(res.data.progress)
        const s: TrainingStatus = res.data.status
        setTrainingStatus(s)
        if (s === 'done') {
          setModelLoaded(true)
          setActivating(false)
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
        }
        if (s === 'error') {
          setActivating(false)
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
        }
      } catch { /* ignore */ }
    }, 1200)
  }

  async function handleActivate() {
    setActivating(true)
    try {
      await api.post('/model/train')
      setTrainingStatus('training')
      startPollingLog()
    } catch (err: any) {
      if (err.response?.data?.message === 'Model already trained') {
        setModelLoaded(true)
        setTrainingStatus('done')
      }
      setActivating(false)
    }
  }

  const text     = dark ? 'text-slate-100' : 'text-light-text'
  const muted    = dark ? 'text-slate-500' : 'text-light-muted'
  const rowHover = dark ? 'hover:bg-surface-600' : 'hover:bg-slate-50'

  const showTerminal = trainingStatus === 'training' || trainingStatus === 'done' || activating

  return (
    <div className={`flex min-h-screen ${dark ? 'bg-surface-900' : 'bg-light-bg'}`}>
      <Sidebar />

      <main className="ml-56 flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-xl font-bold ${text}`}>Threat Detection</h1>
            <p className={`text-xs mt-0.5 ${muted}`}>Real-time AI threat analysis</p>
          </div>
          <div className={`flex items-center gap-2 text-xs font-mono border px-3 py-1.5 rounded
            ${modelLoaded
              ? 'border-green-500/30 text-green-400 bg-green-500/5'
              : 'border-red-500/30 text-red-400 bg-red-500/5'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${modelLoaded ? 'bg-green-400 animate-pulse-slow' : 'bg-red-400'}`} />
            {modelLoaded ? 'AI Engine Active' : 'Engine Offline'}
          </div>
        </div>

        {/* Activation gate */}
        {!modelLoaded && !showTerminal && (
          <div className={`${dark ? 'card' : 'card-light'} p-8 text-center`}>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4
              ${dark ? 'bg-surface-500' : 'bg-slate-100'}`}>
              <img
                src="https://cdn-icons-png.flaticon.com/128/13409/13409733.png"
                alt=""
                style={{ filter: dark ? 'invert(50%)' : 'invert(20%)', width: 24, height: 24 }}
              />
            </div>
            <h2 className={`text-base font-bold mb-2 ${text}`}>AI Engine Not Activated</h2>
            <p className={`text-sm mb-6 max-w-sm mx-auto ${muted}`}>
              The threat detection model needs to be trained once. This takes a few minutes.
              You can navigate the site — just don't refresh this tab.
            </p>
            <div className={`text-xs font-mono border rounded px-4 py-3 mb-6 text-left max-w-sm mx-auto space-y-1
              ${dark ? 'border-surface-400 bg-surface-900 text-slate-400' : 'border-light-border bg-slate-50 text-light-muted'}`}>
              <div>Model: MLP 256→128→64</div>
              <div>Dataset: NSL-KDD (125,973 records)</div>
              <div>Estimated time: 3–8 minutes</div>
              <div>Persists after training: yes</div>
            </div>
            <button
              onClick={handleActivate}
              disabled={activating}
              className="btn-primary px-8 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {activating ? 'Starting...' : 'Activate AI Engine'}
            </button>
          </div>
        )}

        {/* Training terminal */}
        {showTerminal && (
          <div className="space-y-3">
            {trainingStatus === 'training' && (
              <div className={`flex items-center gap-2 text-xs font-mono border px-4 py-2.5 rounded
                ${dark ? 'border-yellow-500/30 text-yellow-300 bg-yellow-500/5' : 'border-yellow-400/40 text-yellow-600 bg-yellow-50'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse-slow" />
                Training in progress — do not refresh this page. You may navigate to other tabs.
              </div>
            )}
            <TrainingTerminal lines={log} progress={progress} status={trainingStatus} />
          </div>
        )}

        {/* Live threat feed — only show when model is active */}
        {modelLoaded && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className={`${dark ? 'card' : 'card-light'} p-5`}>
                <p className={`text-xs uppercase tracking-widest mb-1 ${muted}`}>Total Flagged</p>
                <p className="text-2xl font-bold font-mono text-threat-critical">
                  {threats.filter(t => t.threat).length}
                </p>
              </div>
              <div className={`${dark ? 'card' : 'card-light'} p-5`}>
                <p className={`text-xs uppercase tracking-widest mb-1 ${muted}`}>Last Seen</p>
                <p className={`text-sm font-mono ${text}`}>
                  {threats[0] ? new Date(threats[0].ts * 1000).toLocaleTimeString() : '—'}
                </p>
              </div>
              <div className={`${dark ? 'card' : 'card-light'} p-5`}>
                <p className={`text-xs uppercase tracking-widest mb-1 ${muted}`}>Top Source IP</p>
                <p className={`text-sm font-mono ${text}`}>
                  {threats.filter(t => t.threat)[0]?.ip ?? '—'}
                </p>
              </div>
            </div>

            {/* Threat table */}
            <div className={`${dark ? 'card' : 'card-light'}`}>
              <div className={`px-5 py-3.5 border-b ${dark ? 'border-surface-400' : 'border-light-border'} flex items-center justify-between`}>
                <h2 className={`text-sm font-semibold ${text}`}>Live Threat Feed</h2>
                <span className={`text-xs font-mono ${muted}`}>auto-refresh 5s</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`border-b ${dark ? 'border-surface-400 text-slate-500' : 'border-light-border text-light-muted'}`}>
                      {['Source IP', 'Threat Score', 'Attack Flags', 'Severity', 'Timestamp'].map(h => (
                        <th key={h} className="text-left px-5 py-2.5 font-medium uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {threats.filter(t => t.threat).map((t, i) => {
                      const sev = t.score > 0.7 ? 'critical' : t.score > 0.4 ? 'high' : 'medium'
                      return (
                        <tr key={i} className={`border-b ${dark ? 'border-surface-300' : 'border-light-border'} ${rowHover} transition-colors`}>
                          <td className={`px-5 py-3 font-mono font-medium ${dark ? 'text-slate-200' : 'text-light-text'}`}>{t.ip}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`h-1 w-16 rounded-full ${dark ? 'bg-surface-400' : 'bg-slate-200'}`}>
                                <div
                                  className={`h-1 rounded-full ${sev === 'critical' ? 'bg-threat-critical' : sev === 'high' ? 'bg-threat-high' : 'bg-threat-medium'}`}
                                  style={{ width: `${t.score * 100}%` }}
                                />
                              </div>
                              <span className={`font-mono ${muted}`}>{t.score.toFixed(3)}</span>
                            </div>
                          </td>
                          <td className={`px-5 py-3 ${muted}`}>{t.flags.join(', ') || 'Anomalous traffic'}</td>
                          <td className="px-5 py-3"><span className={`badge-${sev}`}>{sev}</span></td>
                          <td className={`px-5 py-3 font-mono ${muted}`}>{new Date(t.ts * 1000).toLocaleTimeString()}</td>
                        </tr>
                      )
                    })}
                    {threats.filter(t => t.threat).length === 0 && (
                      <tr>
                        <td colSpan={5} className={`px-5 py-8 text-center text-sm ${muted}`}>
                          No threats in feed. Network is clean.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
