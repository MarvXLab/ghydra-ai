import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { useTheme } from '../lib/theme'
import api from '../lib/api'

interface DashboardStats {
  total_scans: number
  threats_found: number
  clean_scans: number
  threat_rate: number
  recent_scans: Array<{
    id: string
    type: string
    target: string
    is_threat: boolean
    threat_score: number
    created_at: string
    geolocation?: {
      country: string
      city: string
    }
  }>
  model_status: string
}

export default function Dashboard() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const dark = theme === 'dark'
  
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [backendOffline, setBackendOffline] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { navigate('/auth/login'); return }
    fetchUser()
    fetchDashboardStats()
  }, [navigate])

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me')
      setUser(res.data)
      // keep localStorage in sync
      localStorage.setItem('user', JSON.stringify(res.data))
    } catch {
      const cached = localStorage.getItem('user')
      if (cached) setUser(JSON.parse(cached))
    }
  }

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/dashboard/stats')
      setStats(response.data)
      setBackendOffline(false)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setBackendOffline(true)
    }
    setLoading(false)
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getSeverityColor = (score: number) => {
    if (score >= 0.7) return 'text-red-500'
    if (score >= 0.4) return 'text-orange-500'
    if (score >= 0.2) return 'text-yellow-500'
    return 'text-green-500'
  }

  if (loading) {
    return (
      <AppLayout>
        <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-surface-900' : 'bg-light-bg'}`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className={`min-h-screen ${dark ? 'bg-surface-900' : 'bg-light-bg'} p-4 sm:p-6`}>
        
        {/* Offline banner */}
        {backendOffline && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-yellow-50 border border-yellow-200 flex items-center gap-3">
            <svg className="w-4 h-4 text-yellow-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-sm text-yellow-700 flex-1">
              Backend is not responding. Go to <a href="/settings" className="font-semibold underline">Settings → Security</a> and tap <span className="font-semibold">Test Connection</span> to diagnose.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className={`text-xl sm:text-2xl font-bold ${dark ? 'text-slate-100' : 'text-light-text'}`}>
                Welcome back, {user?.full_name?.split(' ')[0] || user?.username || 'there'} 👋
              </h1>
              <p className={`text-sm ${dark ? 'text-slate-400' : 'text-light-muted'}`}>
                {user?.email || ''}
              </p>
            </div>
            {/* Status Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border
              ${stats?.model_status === 'active'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-yellow-50 text-yellow-700 border-yellow-200'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${stats?.model_status === 'active' ? 'bg-green-400' : 'bg-yellow-400'}`} />
              {stats?.model_status === 'active' ? 'Protected' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          {/* Total Scans */}
          <div className={`p-4 rounded-2xl ${dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-light-border shadow-sm'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className={`text-2xl font-bold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
              {stats?.total_scans || 0}
            </p>
            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-500'}`}>
              Total Scans
            </p>
          </div>

          {/* Threats Found */}
          <div className={`p-4 rounded-2xl ${dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-light-border shadow-sm'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <p className={`text-2xl font-bold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
              {stats?.threats_found || 0}
            </p>
            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-500'}`}>
              Threats Found
            </p>
          </div>

          {/* Clean Scans */}
          <div className={`p-4 rounded-2xl ${dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-light-border shadow-sm'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dark ? 'bg-green-500/10' : 'bg-green-50'}`}>
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className={`text-2xl font-bold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
              {stats?.clean_scans || 0}
            </p>
            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-500'}`}>
              Clean Scans
            </p>
          </div>

          {/* Threat Rate */}
          <div className={`p-4 rounded-2xl ${dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-light-border shadow-sm'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className={`text-2xl font-bold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
              {((stats?.threat_rate || 0) * 100).toFixed(1)}%
            </p>
            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-500'}`}>
              Threat Rate
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          
          {/* Scan Device */}
          <button
            onClick={() => navigate('/scan')}
            className={`p-6 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]
              ${dark ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-blue-500 to-blue-600'} 
              text-white shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <img 
                  src="https://cdn-icons-png.flaticon.com/128/12785/12785948.png"
                  alt="scan"
                  className="w-6 h-6"
                  style={{ filter: 'invert(1)' }}
                />
              </div>
              <svg className="w-6 h-6 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-1">Security Scan</h3>
            <p className="text-sm opacity-80">Scan your device for threats</p>
          </button>

          {/* View Threats */}
          <button
            onClick={() => navigate('/threats')}
            className={`p-6 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]
              ${dark ? 'bg-gradient-to-br from-red-600 to-red-700' : 'bg-gradient-to-br from-red-500 to-red-600'} 
              text-white shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <img 
                  src="https://cdn-icons-png.flaticon.com/128/1827/1827349.png"
                  alt="alerts"
                  className="w-6 h-6"
                  style={{ filter: 'invert(1)' }}
                />
              </div>
              <svg className="w-6 h-6 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-1">Threat Alerts</h3>
            <p className="text-sm opacity-80">View security incidents</p>
          </button>
        </div>

        {/* Recent Activity */}
        <div className={`rounded-2xl overflow-hidden ${dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-light-border shadow-sm'}`}>
          
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-current border-opacity-10">
            <div className="flex items-center justify-between">
              <h2 className={`font-semibold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
                Recent Scans
              </h2>
              <button className="text-accent text-sm font-medium">
                View All
              </button>
            </div>
          </div>

          {/* Scan List */}
          <div className="divide-y divide-current divide-opacity-10">
            {stats?.recent_scans?.slice(0, 5).map((scan) => (
              <div key={scan.id} className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  
                  {/* Left side */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    
                    {/* Status Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                      ${scan.is_threat 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-green-100 text-green-600'
                      }`}>
                      {scan.is_threat ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-medium text-sm truncate ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
                          {scan.type === 'device' ? 'Device Scan' : 
                           scan.type === 'url' ? 'URL Scan' : 'IP Scan'}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize
                          ${scan.is_threat 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-green-100 text-green-700'
                          }`}>
                          {scan.is_threat ? 'Threat' : 'Clean'}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
                        {scan.geolocation ? `${scan.geolocation.city}, ${scan.geolocation.country}` : 'Unknown location'}
                      </p>
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-mono font-medium ${getSeverityColor(scan.threat_score)}`}>
                      {(scan.threat_score * 100).toFixed(0)}%
                    </p>
                    <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
                      {formatTime(scan.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {(!stats?.recent_scans || stats.recent_scans.length === 0) && (
              <div className="p-8 text-center">
                <svg className={`w-12 h-12 mx-auto mb-4 ${dark ? 'text-slate-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 01-2 2m-6 9l2 2 4-4" />
                </svg>
                <h3 className={`font-medium mb-1 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
                  No scans yet
                </h3>
                <p className={`text-sm ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
                  Run your first security scan to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}