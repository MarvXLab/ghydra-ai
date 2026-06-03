import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import { useTheme } from '../lib/theme'
import api from '../lib/api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Threat {
  ip: string
  threat: boolean
  score: number
  flags: string[]
  ts: number
}

interface Analytics {
  total_scans: number
  threats_blocked: number
  clean_requests: number
  threat_rate: number
}

// Simulated chart history until real data comes in
function buildChartData(threats: Threat[]) {
  const buckets: Record<string, { time: string; threats: number; clean: number }> = {}
  threats.forEach(t => {
    const d = new Date(t.ts * 1000)
    const key = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
    if (!buckets[key]) buckets[key] = { time: key, threats: 0, clean: 0 }
    t.threat ? buckets[key].threats++ : buckets[key].clean++
  })
  return Object.values(buckets).slice(-12)
}

export default function Dashboard() {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [threats, setThreats]     = useState<Threat[]>([])
  const [modelLoaded, setModelLoaded] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ana, feed, status] = await Promise.all([
          api.get('/analytics'),
          api.get('/threats/feed'),
          api.get('/model/status'),
        ])
        setAnalytics(ana.data)
        setThreats(feed.data.threats)
        setModelLoaded(status.data.loaded)
      } catch { /* backend may be cold-starting */ }
    }
    fetchAll()
    const id = setInterval(fetchAll, 5000)
    return () => clearInterval(id)
  }, [])

  const chartData = buildChartData(threats)

  const text     = dark ? 'text-slate-100' : 'text-light-text'
  const muted    = dark ? 'text-slate-500' : 'text-light-muted'
  const rowHover = dark ? 'hover:bg-surface-600' : 'hover:bg-slate-50'

  return (
    <div className={`flex min-h-screen ${dark ? 'bg-surface-900' : 'bg-light-bg'}`}>
      <Sidebar />

      <main className="ml-56 flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-xl font-bold ${text}`}>Dashboard</h1>
            <p className={`text-xs mt-0.5 ${muted}`}>Live network analytics</p>
          </div>
          <div className={`flex items-center gap-2 text-xs font-mono border px-3 py-1.5 rounded
            ${modelLoaded
              ? 'border-green-500/30 text-green-400 bg-green-500/5'
              : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/5'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${modelLoaded ? 'bg-green-400 animate-pulse-slow' : 'bg-yellow-400'}`} />
            {modelLoaded ? 'AI Engine Active' : 'Model Not Loaded'}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Scans"     value={analytics?.total_scans ?? '—'}     accent="blue" />
          <StatCard label="Threats Blocked" value={analytics?.threats_blocked ?? '—'} accent="red" sub="requires model" />
          <StatCard label="Clean Requests"  value={analytics?.clean_requests ?? '—'}  accent="green" />
          <StatCard label="Threat Rate"     value={analytics ? `${(analytics.threat_rate * 100).toFixed(1)}%` : '—'} accent="yellow" />
        </div>

        {/* Chart */}
        <div className={`card ${!dark && 'card-light'} p-5`} style={{ background: dark ? '' : undefined }}>
          <h2 className={`text-sm font-semibold mb-4 ${text}`}>Traffic Overview</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: dark ? '#64748b' : '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: dark ? '#64748b' : '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: dark ? '#111520' : '#fff', border: `1px solid ${dark ? '#2d3650' : '#e2e8f0'}`, borderRadius: 6, fontSize: 12 }}
                  labelStyle={{ color: dark ? '#94a3b8' : '#64748b' }}
                />
                <Area type="monotone" dataKey="clean"   stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.08} strokeWidth={1.5} />
                <Area type="monotone" dataKey="threats" stroke="#ef4444" fill="#ef4444" fillOpacity={0.08} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-44 flex items-center justify-center text-sm ${muted}`}>
              No traffic data yet — run a scan to populate.
            </div>
          )}
        </div>

        {/* Recent threats table */}
        <div className={`${dark ? 'card' : 'card-light'}`}>
          <div className={`px-5 py-3.5 border-b ${dark ? 'border-surface-400' : 'border-light-border'} flex items-center justify-between`}>
            <h2 className={`text-sm font-semibold ${text}`}>Recent Threats</h2>
            <span className={`text-xs ${muted}`}>{threats.filter(t => t.threat).length} flagged</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b ${dark ? 'border-surface-400 text-slate-500' : 'border-light-border text-light-muted'}`}>
                  {['IP Address', 'Score', 'Flags', 'Severity', 'Time'].map(h => (
                    <th key={h} className="text-left px-5 py-2.5 font-medium uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {threats.filter(t => t.threat).slice(0, 10).map((t, i) => {
                  const sev = t.score > 0.7 ? 'critical' : t.score > 0.4 ? 'high' : 'medium'
                  return (
                    <tr key={i} className={`border-b ${dark ? 'border-surface-300' : 'border-light-border'} ${rowHover} transition-colors`}>
                      <td className={`px-5 py-3 font-mono ${dark ? 'text-slate-300' : 'text-light-text'}`}>{t.ip}</td>
                      <td className={`px-5 py-3 font-mono ${dark ? 'text-slate-300' : 'text-light-text'}`}>{t.score.toFixed(3)}</td>
                      <td className={`px-5 py-3 ${muted}`}>{t.flags.join(', ') || '—'}</td>
                      <td className="px-5 py-3"><span className={`badge-${sev}`}>{sev}</span></td>
                      <td className={`px-5 py-3 font-mono ${muted}`}>{new Date(t.ts * 1000).toLocaleTimeString()}</td>
                    </tr>
                  )
                })}
                {threats.filter(t => t.threat).length === 0 && (
                  <tr>
                    <td colSpan={5} className={`px-5 py-8 text-center text-sm ${muted}`}>
                      No threats detected yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
