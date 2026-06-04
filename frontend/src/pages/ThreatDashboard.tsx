import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { useTheme } from '../lib/theme'
import api from '../lib/api'

interface ThreatMapPoint {
  lat: number
  lng: number
  country: string
  city: string
  threat_score: number
  threat_type: string
  timestamp: string
}

interface ThreatData {
  threat_map: ThreatMapPoint[]
  model_loaded: boolean
}

interface SecurityEvent {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  source_ip: string
  country: string
  description: string
  timestamp: string
  status: 'open' | 'resolved'
}

// Sample world map component (simplified SVG)
const WorldMap = ({ threats, dark }: { threats: ThreatMapPoint[]; dark: boolean }) => {
  return (
    <div className={`relative w-full h-64 rounded-xl overflow-hidden
      ${dark ? 'bg-surface-900' : 'bg-slate-100'}`}>
      
      {/* Simplified world map background */}
      <svg
        viewBox="0 0 800 400"
        className="w-full h-full opacity-20"
        fill={dark ? '#334155' : '#64748b'}
      >
        {/* Simplified continent shapes */}
        <path d="M100 150 L200 120 L280 140 L350 130 L400 150 L380 200 L300 220 L200 200 L120 180 Z" />
        <path d="M450 100 L550 90 L620 110 L650 130 L630 180 L580 200 L500 190 L470 160 Z" />
        <path d="M200 250 L300 240 L380 260 L350 320 L280 340 L220 320 Z" />
        <path d="M500 200 L600 190 L680 210 L670 280 L600 300 L520 290 Z" />
      </svg>

      {/* Threat points */}
      {threats.map((threat, index) => (
        <div
          key={index}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
          style={{
            left: `${(threat.lng + 180) * (100/360)}%`,
            top: `${(90 - threat.lat) * (100/180)}%`
          }}
        >
          <div className={`w-3 h-3 rounded-full border-2 border-white shadow-lg
            ${threat.threat_score > 0.7 ? 'bg-red-500' : 
              threat.threat_score > 0.4 ? 'bg-orange-500' : 'bg-yellow-500'}`}
          />
        </div>
      ))}

      {/* Legend */}
      <div className="absolute top-4 right-4 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className={dark ? 'text-slate-300' : 'text-slate-700'}>Critical</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className={dark ? 'text-slate-300' : 'text-slate-700'}>High</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className={dark ? 'text-slate-300' : 'text-slate-700'}>Medium</span>
        </div>
      </div>
    </div>
  )
}

export default function Threats() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const dark = theme === 'dark'
  
  const [threatData, setThreatData] = useState<ThreatData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Sample security events (in real app, fetch from API)
  const [securityEvents] = useState<SecurityEvent[]>([
    {
      id: '1',
      type: 'SQL Injection',
      severity: 'critical',
      source_ip: '203.0.113.5',
      country: 'Unknown',
      description: 'SQL injection detected in login page',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      status: 'open'
    },
    {
      id: '2', 
      type: 'Malware detected',
      severity: 'high',
      source_ip: '192.168.1.100',
      country: 'US',
      description: 'Suspicious activity detected',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      status: 'open'
    },
    {
      id: '3',
      type: 'DDoS attack',
      severity: 'medium',
      source_ip: '10.0.0.1',
      country: 'CN',
      description: 'Multiple requests from same IP',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      status: 'resolved'
    },
    {
      id: '4',
      type: 'Suspicious activity detected',
      severity: 'medium',
      source_ip: '172.16.0.1',
      country: 'RU',
      description: 'Unusual login attempt pattern',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      status: 'open'
    }
  ])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/auth/login')
      return
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    
    fetchThreatData()
  }, [navigate])

  const fetchThreatData = async () => {
    try {
      const response = await api.get('/dashboard/threats')
      setThreatData(response.data)
    } catch (error) {
      console.error('Failed to fetch threat data:', error)
      // Mock data for demo
      setThreatData({
        threat_map: [
          { lat: 40.7128, lng: -74.0060, country: 'US', city: 'New York', threat_score: 0.8, threat_type: 'malware', timestamp: new Date().toISOString() },
          { lat: 51.5074, lng: -0.1278, country: 'UK', city: 'London', threat_score: 0.6, threat_type: 'phishing', timestamp: new Date().toISOString() },
          { lat: 35.6762, lng: 139.6503, country: 'JP', city: 'Tokyo', threat_score: 0.4, threat_type: 'suspicious', timestamp: new Date().toISOString() },
          { lat: -33.8688, lng: 151.2093, country: 'AU', city: 'Sydney', threat_score: 0.7, threat_type: 'botnet', timestamp: new Date().toISOString() },
        ],
        model_loaded: true
      })
    }
    setLoading(false)
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchThreatData()
    setRefreshing(false)
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = Date.now()
    const time = new Date(timestamp).getTime()
    const diff = now - time
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (minutes < 60) return `${minutes} min ago`
    return `${hours} hr ago`
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-50 border-red-200'
      case 'high': return 'text-orange-500 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-500 bg-gray-50 border-gray-200'
    }
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
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
              Threat Detection
            </h1>
            <p className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
              Real-time security monitoring
            </p>
          </div>
          
          <button
            onClick={refreshData}
            disabled={refreshing}
            className={`p-2 rounded-xl border transition-colors ${refreshing ? 'animate-spin' : ''}
              ${dark 
                ? 'border-surface-400 text-slate-400 hover:bg-surface-700' 
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          
          {/* Intrusion Attempts */}
          <div className={`p-4 rounded-xl ${dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-gray-500'}`}>
                Intrusion Attempts
              </span>
              <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">-3%</span>
            </div>
            <p className={`text-2xl font-bold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>6</p>
          </div>

          {/* Anomaly Alerts */}
          <div className={`p-4 rounded-xl ${dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-gray-500'}`}>
                Anomaly Alerts
              </span>
              <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">+5%</span>
            </div>
            <p className={`text-2xl font-bold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>22</p>
          </div>

          {/* Network Traffic */}
          <div className={`p-4 rounded-xl ${dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-gray-500'}`}>
                Network Traffic
              </span>
              <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">Warning</span>
            </div>
            <p className={`text-2xl font-bold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>12.5k</p>
          </div>

          {/* Threat Detection */}
          <div className={`p-4 rounded-xl ${dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-gray-500'}`}>
                AI Engine
              </span>
              <button className="text-xs text-accent hover:underline">Refresh</button>
            </div>
            <p className={`text-sm font-medium ${threatData?.model_loaded ? 'text-green-500' : 'text-red-500'}`}>
              {threatData?.model_loaded ? 'Active' : 'Offline'}
            </p>
          </div>
        </div>

        {/* World Map */}
        <div className={`mb-6 p-6 rounded-2xl ${dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-semibold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
              Global Threat Map
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
                Live
              </span>
            </div>
          </div>
          
          <WorldMap threats={threatData?.threat_map || []} dark={dark} />
        </div>

        {/* Security Events & Top Threat Sources */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Security Events */}
          <div className={`rounded-2xl overflow-hidden ${dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-gray-200'}`}>
            <div className="p-4 sm:p-6 border-b border-current border-opacity-10">
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
                  Security Events
                </h3>
                <button className="text-accent text-sm">View all</button>
              </div>
            </div>
            
            <div className="divide-y divide-current divide-opacity-10 max-h-96 overflow-y-auto">
              {securityEvents.map((event) => (
                <div key={event.id} className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getSeverityColor(event.severity)}`}>
                          {event.severity.toUpperCase()}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${event.status === 'open' ? 'bg-red-400' : 'bg-green-400'}`} />
                      </div>
                      <h4 className={`font-medium text-sm mb-1 ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
                        {event.type}
                      </h4>
                      <p className={`text-xs mb-2 ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
                        {event.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={`font-mono ${dark ? 'text-slate-500' : 'text-gray-500'}`}>
                          {event.source_ip}
                        </span>
                        <span className={dark ? 'text-slate-600' : 'text-gray-400'}>•</span>
                        <span className={dark ? 'text-slate-500' : 'text-gray-500'}>
                          {formatTimeAgo(event.timestamp)}
                        </span>
                      </div>
                    </div>
                    <button className={`text-xs px-2 py-1 rounded ${dark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Threat Sources */}
          <div className={`rounded-2xl ${dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-gray-200'}`}>
            <div className="p-4 sm:p-6 border-b border-current border-opacity-10">
              <h3 className={`font-semibold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
                Top Threat Sources
              </h3>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4">
              {[
                { ip: '203.0.113.5', count: 78, country: 'Unknown' },
                { ip: '192.168.1.100', count: 120, country: 'US' },
                { ip: '10.0.0.1', count: 56, country: 'CN' },
                { ip: '10.0.0.1', count: 56, country: 'RU' },
              ].map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className={`font-mono text-sm ${dark ? 'text-slate-200' : 'text-gray-900'}`}>
                      {source.ip}
                    </p>
                    <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-500'}`}>
                      {source.country}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
                      {source.count}
                    </p>
                    <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-500'}`}>
                      attempts
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}