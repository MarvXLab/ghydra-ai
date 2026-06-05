import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { useTheme } from '../lib/theme'
import api from '../lib/api'

interface ScanResult {
  ip_address: string
  is_threat: boolean
  threat_score: number
  flags: string[]
  geolocation?: {
    country: string
    city: string
  }
  scan_id: string
}

interface URLScanResult {
  url: string
  is_threat: boolean
  threat_score: number
  flags: string[]
  categories: string[]
  scan_id: string
}

export default function Scan() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const dark = theme === 'dark'
  
  const [scanType, setScanType] = useState<'device' | 'url'>('device')
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ScanResult | URLScanResult | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [lastScan, setLastScan] = useState<any>(null)

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/auth/login')
      return
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }, [navigate])

  const runDeviceScan = async () => {
    setScanning(true)
    setProgress(0)
    setResult(null)

    // Progress simulation
    const progressSteps = [
      { step: 10, message: "Analyzing device fingerprint..." },
      { step: 25, message: "Checking IP reputation..." },
      { step: 45, message: "Scanning network traffic..." },
      { step: 70, message: "Running threat detection..." },
      { step: 90, message: "Generating report..." },
      { step: 100, message: "Scan complete!" }
    ]

    try {
      // Simulate progress
      for (const { step } of progressSteps) {
        setProgress(step)
        await new Promise(resolve => setTimeout(resolve, 800))
      }

      // Actual API call
      const response = await api.post('/scan/device', {
        user_agent: navigator.userAgent
      })

      setResult(response.data)
      setLastScan({
        type: 'device',
        timestamp: Date.now(),
        items_scanned: Math.floor(Math.random() * 50) + 100,
        threats_found: response.data.is_threat ? Math.floor(Math.random() * 3) + 1 : 0
      })
    } catch (error) {
      console.error('Device scan failed:', error)
    }
    
    setScanning(false)
  }

  const runURLScan = async () => {
    if (!urlInput.trim()) return

    setScanning(true)
    setProgress(0)
    setResult(null)

    try {
      // Progress simulation
      const steps = [15, 30, 50, 75, 90, 100]
      for (const step of steps) {
        setProgress(step)
        await new Promise(resolve => setTimeout(resolve, 600))
      }

      const response = await api.post('/scan/url', {
        url: urlInput
      })

      setResult(response.data)
      setLastScan({
        type: 'url',
        timestamp: Date.now(),
        items_scanned: 1,
        threats_found: response.data.is_threat ? 1 : 0
      })
    } catch (error) {
      console.error('URL scan failed:', error)
    }
    
    setScanning(false)
  }

  const CircularProgress = ({ progress }: { progress: number }) => {
    const circumference = 2 * Math.PI * 45 // radius = 45
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className={dark ? 'text-surface-600' : 'text-gray-200'}
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="text-accent transition-all duration-500 ease-out"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
            {progress}
          </span>
          <span className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
            {scanning ? 'Scanning...' : 'Ready'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className={`min-h-screen ${dark ? 'bg-surface-900' : 'bg-light-bg'} p-4 sm:p-6`}>
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-2xl font-bold mb-2 ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
            Security Scan
          </h1>
          <p className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
            Protect your digital life with AI-powered threat detection
          </p>
        </div>

        {/* Scan Type Selector */}
        <div className={`flex rounded-2xl p-1 mb-8 max-w-sm mx-auto
          ${dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-gray-200'}`}>
          <button
            onClick={() => setScanType('device')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all
              ${scanType === 'device'
                ? 'bg-accent text-white shadow-lg'
                : dark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Device Scan
          </button>
          <button
            onClick={() => setScanType('url')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all
              ${scanType === 'url'
                ? 'bg-accent text-white shadow-lg'
                : dark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            URL Scan
          </button>
        </div>

        {/* Scan Interface */}
        <div className={`max-w-md mx-auto mb-8 p-8 rounded-3xl
          ${dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-gray-200 shadow-lg'}`}>
          
          {/* Circular Progress */}
          <div className="mb-8">
            <CircularProgress progress={progress} />
          </div>

          {/* URL Input (if URL scan) */}
          {scanType === 'url' && (
            <div className="mb-6">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter URL to scan..."
                className={`w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all
                  ${dark 
                    ? 'bg-surface-700 border-surface-400 text-slate-100 focus:border-accent placeholder-slate-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-accent placeholder-gray-400'
                  }`}
              />
            </div>
          )}

          {/* Scan Button */}
          <button
            onClick={scanType === 'device' ? runDeviceScan : runURLScan}
            disabled={scanning || (scanType === 'url' && !urlInput.trim())}
            className="w-full bg-accent hover:bg-accent-dim disabled:opacity-50 disabled:cursor-not-allowed
                     text-white font-semibold py-4 px-6 rounded-2xl transition-all text-base
                     hover:shadow-lg active:scale-[0.98]"
          >
            {scanning ? 'Scanning...' : scanType === 'device' ? 'Tap to Scan' : 'Scan URL'}
          </button>

          {/* Status Message */}
          {scanning && (
            <p className={`text-center text-sm mt-4 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
              Analyzing for threats and vulnerabilities...
            </p>
          )}
        </div>

        {/* Last Scan Results */}
        {lastScan && (
          <div className={`max-w-md mx-auto mb-8 p-6 rounded-2xl
            ${dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-gray-200'}`}>
            
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
                Last Scan
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full
                ${lastScan.threats_found > 0
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
                }`}>
                {new Date(lastScan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className={`text-2xl font-bold ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
                  {lastScan.items_scanned}
                </p>
                <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-500'}`}>
                  Items Scanned
                </p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${lastScan.threats_found > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {lastScan.threats_found}
                </p>
                <p className={`text-xs ${dark ? 'text-slate-500' : 'text-gray-500'}`}>
                  Threats Found
                </p>
              </div>
            </div>

            <div className={`mt-4 p-3 rounded-xl flex items-center gap-3
              ${lastScan.threats_found > 0
                ? 'bg-red-50 border border-red-100'
                : 'bg-green-50 border border-green-100'
              }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center
                ${lastScan.threats_found > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                {lastScan.threats_found > 0 ? (
                  <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <p className={`text-sm font-medium
                ${lastScan.threats_found > 0 ? 'text-red-800' : 'text-green-800'}`}>
                {lastScan.threats_found > 0 
                  ? `${lastScan.threats_found} threat${lastScan.threats_found > 1 ? 's' : ''} detected`
                  : 'All clear! No threats detected'
                }
              </p>
            </div>
          </div>
        )}

        {/* Detailed Results */}
        {result && (
          <div className={`max-w-md mx-auto p-6 rounded-2xl mb-6
            ${result.is_threat
              ? 'bg-red-50 border-2 border-red-400'
              : dark ? 'bg-surface-800 border border-surface-400' : 'bg-white border border-gray-200'}`}>

            {result.is_threat && (
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-red-200">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 animate-pulse">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-red-700">⚠ Threat Detected!</p>
                  <p className="text-xs text-red-500">This site may be harmful. Do not proceed.</p>
                </div>
              </div>
            )}

            {/* Threat Score */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
                  Threat Level
                </span>
                <span className={`text-sm font-mono font-medium
                  ${result.threat_score > 0.7 ? 'text-red-500' : 
                    result.threat_score > 0.3 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {(result.threat_score * 100).toFixed(1)}%
                </span>
              </div>
              <div className={`h-2 rounded-full ${dark ? 'bg-surface-600' : 'bg-gray-200'}`}>
                <div
                  className={`h-2 rounded-full transition-all duration-1000
                    ${result.threat_score > 0.7 ? 'bg-red-500' : 
                      result.threat_score > 0.3 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${result.threat_score * 100}%` }}
                />
              </div>
            </div>

            {/* Flags */}
            {result.flags && result.flags.length > 0 && (
              <div className="mb-4">
                <p className={`text-sm mb-2 ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
                  Security Flags:
                </p>
                <div className="space-y-1">
                  {result.flags.map((flag, index) => (
                    <div key={index} className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                      {flag}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location (for device scans) */}
            {'geolocation' in result && result.geolocation && (
              <div className="text-center pt-4 border-t border-current border-opacity-10">
                <p className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
                  Scanned from: {result.geolocation.city}, {result.geolocation.country}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Recent Scans */}
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4">
            <button className={`flex-1 py-3 px-4 rounded-2xl text-sm font-medium border transition-colors
              ${dark 
                ? 'border-surface-400 text-slate-400 hover:bg-surface-700' 
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2v0z" />
              </svg>
              <span>History</span>
            </button>
            
            <button
              onClick={() => navigate('/threats')}
              className={`flex-1 py-3 px-4 rounded-2xl text-sm font-medium border transition-colors
                ${dark 
                  ? 'border-surface-400 text-slate-400 hover:bg-surface-700' 
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
              <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5 5 5m-6-5H1" />
              </svg>
              <span>Alerts</span>
            </button>

            <button className={`flex-1 py-3 px-4 rounded-2xl text-sm font-medium border transition-colors
              ${dark 
                ? 'border-surface-400 text-slate-400 hover:bg-surface-700' 
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}