import { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import AppLayout from '../components/AppLayout'
import { useTheme } from '../lib/theme'
import api from '../lib/api'

const TIME_RANGES = ['Live', '1h', '4h', '7h', '24h', '1w', '1m', '3m', '6m', '1y'] as const
type Range = typeof TIME_RANGES[number]

function generateDataPoints(range: Range, spikeAt?: number) {
  const counts: Record<Range, number> = {
    'Live': 30, '1h': 60, '4h': 48, '7h': 42, '24h': 48,
    '1w': 56, '1m': 60, '3m': 90, '6m': 72, '1y': 52
  }
  const n = counts[range]
  return Array.from({ length: n }, (_, i) => {
    const base = 2 + Math.random() * 3
    const spike = spikeAt !== undefined && Math.abs(i - spikeAt) < 3 ? 8 + Math.random() * 10 : 0
    const mbps = parseFloat((base + spike).toFixed(2))
    return {
      t: i,
      label: range === 'Live' ? `${i}s` : range === '1h' ? `${i}m` : `${i}`,
      mbps,
      threat: spike > 0
    }
  })
}

const APPS = [
  { name: 'Chrome', icon: '🌐', mb: 142, color: '#4285F4' },
  { name: 'Zoom', icon: '📹', mb: 89, color: '#2D8CFF' },
  { name: 'Spotify', icon: '🎵', mb: 34, color: '#1DB954' },
  { name: 'System', icon: '⚙️', mb: 21, color: '#6b7280' },
  { name: 'Other', icon: '📦', mb: 15, color: '#9ca3af' },
]

export default function Network() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [range, setRange] = useState<Range>('Live')
  const [data, setData] = useState(() => generateDataPoints('Live', 22))
  const [scanResult, setScanResult] = useState<any>(null)
  const [scanning, setScanning] = useState(false)
  const [spikeAlert, setSpikeAlert] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const card = dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-gray-200'
  const text = dark ? 'text-slate-100' : 'text-gray-900'
  const muted = dark ? 'text-slate-400' : 'text-gray-500'

  useEffect(() => {
    const spikePos = Math.floor(Math.random() * 20) + 10
    const newData = generateDataPoints(range, range === 'Live' ? spikePos : undefined)
    setData(newData)
    setSpikeAlert(range === 'Live' && newData.some(d => d.threat))

    if (range === 'Live') {
      intervalRef.current = setInterval(() => {
        setData(prev => {
          const next = [...prev.slice(1), {
            t: prev[prev.length - 1].t + 1,
            label: `${prev[prev.length - 1].t + 1}s`,
            mbps: parseFloat((2 + Math.random() * 4).toFixed(2)),
            threat: Math.random() < 0.05
          }]
          setSpikeAlert(next.some(d => d.threat))
          return next
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [range])

  async function runScan() {
    setScanning(true); setScanResult(null)
    try {
      const res = await api.post('/scan/device', { user_agent: navigator.userAgent })
      setScanResult(res.data)
    } catch { setScanResult({ error: true }) }
    setScanning(false)
  }

  const totalMb = APPS.reduce((s, a) => s + a.mb, 0)
  const maxMbps = Math.max(...data.map(d => d.mbps))
  const spikePoints = data.filter(d => d.threat)
  const currentMbps = data[data.length - 1]?.mbps ?? 0

  return (
    <AppLayout>
      <div className={`min-h-screen ${dark ? 'bg-surface-900' : 'bg-gray-50'} p-4 sm:p-6`}>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-xl font-bold ${text}`}>Network Monitor</h1>
            <p className={`text-xs mt-0.5 ${muted}`}>Real-time traffic analysis & threat detection</p>
          </div>
          <div className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg border
            ${spikeAlert ? 'border-red-400 text-red-500 bg-red-500/5 animate-pulse' : 'border-green-500/30 text-green-500 bg-green-500/5'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${spikeAlert ? 'bg-red-400' : 'bg-green-400'}`} />
            {spikeAlert ? 'Spike Detected' : 'Normal'}
          </div>
        </div>

        {/* Spike alert banner */}
        {spikeAlert && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-sm text-red-700 flex-1">
              <span className="font-semibold">Suspicious network spike detected.</span> Unusual traffic volume may indicate an attack or data exfiltration. Run a device scan below.
            </p>
            <button onClick={runScan} className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg shrink-0 hover:bg-red-600 transition-colors">
              Scan Now
            </button>
          </div>
        )}

        {/* Live stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Current', value: `${currentMbps} MB/s`, color: 'text-blue-500' },
            { label: 'Peak', value: `${maxMbps.toFixed(2)} MB/s`, color: 'text-orange-500' },
            { label: 'Spikes', value: spikePoints.length, color: 'text-red-500' },
          ].map(s => (
            <div key={s.label} className={`${card} rounded-xl p-3`}>
              <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
              <p className={`text-xs ${muted}`}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className={`${card} rounded-2xl p-4 sm:p-5 mb-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-semibold text-sm ${text}`}>Network Usage</h2>
            {/* Time range selector */}
            <select value={range} onChange={e => setRange(e.target.value as Range)}
              className={`text-xs px-3 py-1.5 rounded-lg border outline-none transition-colors
                ${dark ? 'bg-surface-700 border-surface-400 text-slate-200' : 'bg-white border-gray-200 text-gray-700'}`}>
              {TIME_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#1e2433' : '#f0f0f0'} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: dark ? '#4b5563' : '#9ca3af' }}
                interval={Math.floor(data.length / 6)} />
              <YAxis tick={{ fontSize: 10, fill: dark ? '#4b5563' : '#9ca3af' }} unit=" MB/s" />
              <Tooltip
                contentStyle={{ background: dark ? '#13161e' : '#fff', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: dark ? '#e2e8f0' : '#1f2937' }}
                formatter={(v: number | string | undefined) => [`${v} MB/s`, 'Usage']}
              />
              {spikePoints.map(p => (
                <ReferenceLine key={p.t} x={p.label} stroke="#ef4444" strokeDasharray="3 3" />
              ))}
              <Line type="monotone" dataKey="mbps" stroke="#6366f1" strokeWidth={2}
                dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
            </LineChart>
          </ResponsiveContainer>

          {spikePoints.length > 0 && (
            <p className="text-xs text-red-400 mt-2">⚠ Red lines indicate suspicious spikes</p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* App/Site Traffic */}
          <div className={`${card} rounded-2xl p-5`}>
            <h3 className={`font-semibold text-sm mb-4 ${text}`}>Traffic by App / Site</h3>
            <div className="space-y-3">
              {APPS.map(app => (
                <div key={app.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{app.icon}</span>
                      <span className={`text-sm ${text}`}>{app.name}</span>
                    </div>
                    <span className={`text-xs font-mono ${muted}`}>{app.mb} MB</span>
                  </div>
                  <div className={`h-1.5 rounded-full ${dark ? 'bg-surface-600' : 'bg-gray-100'}`}>
                    <div className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${(app.mb / totalMb) * 100}%`, background: app.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device Scan */}
          <div className={`${card} rounded-2xl p-5`}>
            <h3 className={`font-semibold text-sm mb-2 ${text}`}>Network Threat Scan</h3>
            <p className={`text-xs mb-4 ${muted}`}>Scan your current connection for suspicious activity, malicious agents, and known attack signatures.</p>

            <button onClick={runScan} disabled={scanning}
              className="w-full bg-accent hover:bg-accent-dim disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors mb-4">
              {scanning ? 'Scanning...' : 'Run Network Scan'}
            </button>

            {scanResult && !scanResult.error && (
              <div className={`rounded-xl p-4 ${scanResult.is_threat ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm font-semibold ${scanResult.is_threat ? 'text-red-700' : 'text-green-700'}`}>
                    {scanResult.is_threat ? '⚠ Threat Detected' : '✓ Connection Clean'}
                  </span>
                </div>
                <div className={`h-1.5 rounded-full mb-2 ${dark ? 'bg-gray-200' : 'bg-gray-200'}`}>
                  <div className={`h-1.5 rounded-full ${scanResult.is_threat ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${scanResult.threat_score * 100}%` }} />
                </div>
                <p className={`text-xs ${scanResult.is_threat ? 'text-red-600' : 'text-green-600'}`}>
                  Threat score: {(scanResult.threat_score * 100).toFixed(1)}%
                  {scanResult.flags?.length > 0 && ` · ${scanResult.flags.join(', ')}`}
                </p>
              </div>
            )}
            {scanResult?.error && (
              <p className="text-xs text-red-500">Scan failed. Backend may be sleeping — try again in 30s.</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
