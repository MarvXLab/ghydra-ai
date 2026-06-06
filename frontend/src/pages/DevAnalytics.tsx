import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import AppLayout from '../components/AppLayout'
import { useTheme } from '../lib/theme'
import api from '../lib/api'

export default function DevAnalytics() {
  const { projectId } = useParams()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const bg   = dark ? 'bg-[#0a0a0a]' : 'bg-gray-50'
  const card = dark ? 'bg-[#111] border border-[#222]' : 'bg-white border border-gray-200'
  const text = dark ? 'text-gray-100' : 'text-gray-900'
  const muted = dark ? 'text-gray-500' : 'text-gray-400'
  const divider = dark ? 'border-[#222]' : 'border-gray-100'

  useEffect(() => {
    api.get(`/developer/projects/${projectId}/analytics`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) return (
    <AppLayout>
      <div className={`min-h-screen flex items-center justify-center ${bg}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    </AppLayout>
  )

  const total    = data?.total_requests ?? 0
  const blocked  = data?.threats_blocked ?? 0
  const allowed  = data?.allowed ?? (total - blocked)
  const topIps   = data?.top_ips ?? []
  const topAgents = data?.top_agents ?? []
  const topPaths  = data?.top_paths ?? []
  const chart: any[] = (data?.chart ?? []).map((c: any, i: number) => ({
    i,
    t: new Date(c.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    allowed: c.is_threat ? 0 : 1,
    denied:  c.is_threat ? 1 : 0,
  }))

  function StatBadge({ label, value, color }: { label: string; value: number | string; color: string }) {
    return (
      <span className="flex items-center gap-1.5 text-xs">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        <span className={text}>{label}</span>
        <span className={muted}>{value}</span>
      </span>
    )
  }

  function TopTable({ title, rows }: { title: string; rows: { value: string; count: number }[] }) {
    const max = rows[0]?.count || 1
    return (
      <div className={`${card} rounded-xl overflow-hidden`}>
        <div className={`px-4 py-3 border-b ${divider}`}>
          <p className={`text-sm font-medium ${text}`}>{title}</p>
        </div>
        {rows.length === 0 ? (
          <p className={`text-xs text-center py-6 ${muted}`}>No data yet</p>
        ) : rows.map((r, i) => (
          <div key={i} className={`px-4 py-2.5 flex items-center justify-between gap-3 border-b last:border-0 ${divider}`}>
            <p className={`text-xs font-mono truncate flex-1 ${text}`}>{r.value}</p>
            <div className="flex items-center gap-2 shrink-0">
              <div className={`h-1 rounded-full ${dark ? 'bg-[#222]' : 'bg-gray-100'}`} style={{ width: 60 }}>
                <div className="h-1 rounded-full bg-blue-500" style={{ width: `${(r.count / max) * 60}px` }} />
              </div>
              <span className={`text-xs font-mono w-6 text-right ${muted}`}>{r.count}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <AppLayout>
      <div className={`min-h-screen ${bg} p-4 sm:p-6`}>
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <Link to="/settings" className={`text-xs ${muted} hover:text-blue-500 transition-colors`}>← Settings</Link>
            <span className={muted}>/</span>
            <span className={`text-xs ${muted}`}>{data?.project?.name ?? 'Analytics'}</span>
            <span className={muted}>/</span>
            <span className={`text-xs ${text}`}>Traffic</span>
          </div>

          {/* Status card + Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4 mb-4">

            {/* Status */}
            <div className={`${card} rounded-xl p-5 flex flex-col justify-between`}>
              <div className="flex flex-col items-center justify-center flex-1 py-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${blocked > 0 ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                  <svg className={`w-7 h-7 ${blocked > 0 ? 'text-red-500' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className={`text-sm font-semibold ${text}`}>
                  {blocked > 0 ? 'Threats Detected' : 'Protection Active'}
                </p>
                <p className={`text-xs mt-0.5 ${muted}`}>
                  {blocked > 0 ? `${blocked} request${blocked !== 1 ? 's' : ''} blocked` : 'All systems normal'}
                </p>
              </div>
              <div className={`border-t ${divider} pt-3 space-y-2`}>
                <div className={`flex justify-between text-xs`}>
                  <span className={muted}>Total Requests</span>
                  <span className={`font-mono ${text}`}>{total}</span>
                </div>
                <div className={`flex justify-between text-xs`}>
                  <span className={muted}>Threats Blocked</span>
                  <span className="font-mono text-red-500">{blocked}</span>
                </div>
                <div className={`flex justify-between text-xs`}>
                  <span className={muted}>Allowed</span>
                  <span className="font-mono text-blue-500">{allowed}</span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className={`${card} rounded-xl p-4`}>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <StatBadge label="Allowed" value={allowed} color="bg-blue-500" />
                <StatBadge label="Denied" value={blocked} color="bg-red-500" />
                <StatBadge label="Total" value={total} color="bg-gray-500" />
              </div>
              {chart.length === 0 ? (
                <div className={`flex items-center justify-center h-40 text-xs ${muted}`}>
                  No traffic recorded yet — make API calls using your project key to see data here.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={chart} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                    <defs>
                      <linearGradient id="allowed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="denied" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#1a1a1a' : '#f0f0f0'} />
                    <XAxis dataKey="t" tick={{ fontSize: 10, fill: dark ? '#444' : '#bbb' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: dark ? '#444' : '#bbb' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: dark ? '#111' : '#fff', border: `1px solid ${dark ? '#222' : '#e5e7eb'}`, borderRadius: 8, fontSize: 11 }} />
                    <Area type="monotone" dataKey="allowed" stroke="#3b82f6" strokeWidth={1.5} fill="url(#allowed)" />
                    <Area type="monotone" dataKey="denied"  stroke="#ef4444" strokeWidth={1.5} fill="url(#denied)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top tables row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <TopTable title="Top IPs" rows={topIps} />
            <TopTable title="Top User Agents" rows={topAgents} />
            <TopTable title="Top Request Paths" rows={topPaths} />
          </div>

          {/* Recent activity + Coming soon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`${card} rounded-xl overflow-hidden`}>
              <div className={`px-4 py-3 border-b ${divider}`}>
                <p className={`text-sm font-medium ${text}`}>Recent Activity</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {(data?.recent_activity ?? []).length === 0 ? (
                  <p className={`text-xs text-center py-6 ${muted}`}>No activity yet</p>
                ) : data.recent_activity.map((s: any) => (
                  <div key={s.id} className={`px-4 py-2.5 flex items-center justify-between gap-3 border-b last:border-0 ${divider}`}>
                    <div className="min-w-0">
                      <p className={`text-xs font-mono truncate ${text}`}>{s.target}</p>
                      <p className={`text-xs ${muted}`}>{s.ip_address} · {new Date(s.created_at).toLocaleTimeString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded border shrink-0 font-mono
                      ${s.is_threat ? 'text-red-500 border-red-500/30 bg-red-500/5' : 'text-blue-500 border-blue-500/30 bg-blue-500/5'}`}>
                      {s.is_threat ? 'DENIED' : 'ALLOW'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* User Behaviour — coming soon */}
            <div className={`${card} rounded-xl p-5 flex flex-col items-center justify-center text-center`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${dark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                <svg className={`w-5 h-5 ${muted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className={`text-sm font-medium ${text}`}>User Behaviour Analytics</p>
              <p className={`text-xs mt-1 mb-3 ${muted}`}>See what buttons users click most, top features used, and what to ship next.</p>
              <span className={`text-xs px-3 py-1 rounded-full border ${dark ? 'border-[#333] text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                Pro · Coming Soon
              </span>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
