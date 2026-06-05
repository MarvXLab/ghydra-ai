import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { useTheme } from '../lib/theme'
import api from '../lib/api'

export default function DevAnalytics() {
  const { projectId } = useParams()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const card = dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-gray-200'
  const text = dark ? 'text-slate-100' : 'text-gray-900'
  const muted = dark ? 'text-slate-400' : 'text-gray-500'

  useEffect(() => {
    api.get(`/developer/projects/${projectId}/analytics`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) return (
    <AppLayout>
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-surface-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    </AppLayout>
  )

  const threats = data?.recent_activity?.filter((s: any) => s.is_threat) ?? []
  const clean = data?.recent_activity?.filter((s: any) => !s.is_threat) ?? []

  return (
    <AppLayout>
      <div className={`min-h-screen ${dark ? 'bg-surface-900' : 'bg-gray-50'} p-4 sm:p-6`}>
        <div className="max-w-4xl mx-auto">

          <div className="flex items-center gap-3 mb-6">
            <Link to="/settings" className={`text-sm ${muted} hover:text-accent transition-colors`}>← Settings</Link>
            <span className={muted}>/</span>
            <h1 className={`text-xl font-bold ${text}`}>{data?.project?.name ?? 'Analytics'}</h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Total Requests', value: data?.total_requests ?? 0, color: 'text-blue-500' },
              { label: 'Threats Blocked', value: data?.threats_blocked ?? 0, color: 'text-red-500' },
              { label: 'Clean Requests', value: (data?.total_requests ?? 0) - (data?.threats_blocked ?? 0), color: 'text-green-500' },
            ].map(s => (
              <div key={s.label} className={`${card} rounded-2xl p-4`}>
                <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className={`text-xs mt-1 ${muted}`}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Coming Soon — Pro User Behaviour */}
          <div className={`${card} rounded-2xl p-6 mb-4 border-dashed`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className={`font-semibold text-sm ${text}`}>User Behaviour Analytics <span className="ml-2 text-xs bg-accent/10 text-accent border border-accent/30 px-2 py-0.5 rounded-full">Pro · Coming Soon</span></p>
                <p className={`text-xs mt-0.5 ${muted}`}>See which buttons users click most, what features they use, and what to improve — without compromising their privacy.</p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Blocked IPs */}
            <div className={`${card} rounded-2xl overflow-hidden`}>
              <div className={`px-5 py-3 border-b ${dark ? 'border-surface-400' : 'border-gray-200'}`}>
                <h3 className={`font-semibold text-sm ${text}`}>Blocked Threats</h3>
              </div>
              <div className="divide-y divide-current divide-opacity-10 max-h-80 overflow-y-auto">
                {threats.length === 0 ? (
                  <p className={`text-sm text-center py-8 ${muted}`}>No threats detected yet.</p>
                ) : threats.map((s: any) => (
                  <div key={s.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-mono truncate ${text}`}>{s.ip_address ?? s.target}</p>
                      <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 shrink-0">
                        {(s.threat_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${muted}`}>{new Date(s.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className={`${card} rounded-2xl overflow-hidden`}>
              <div className={`px-5 py-3 border-b ${dark ? 'border-surface-400' : 'border-gray-200'}`}>
                <h3 className={`font-semibold text-sm ${text}`}>Recent Activity</h3>
              </div>
              <div className="divide-y divide-current divide-opacity-10 max-h-80 overflow-y-auto">
                {data?.recent_activity?.length === 0 ? (
                  <p className={`text-sm text-center py-8 ${muted}`}>No activity yet.</p>
                ) : data?.recent_activity?.map((s: any) => (
                  <div key={s.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-xs font-mono truncate ${text}`}>{s.target}</p>
                      <p className={`text-xs ${muted}`}>{s.type} · {new Date(s.created_at).toLocaleTimeString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${s.is_threat ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                      {s.is_threat ? 'Threat' : 'Clean'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
