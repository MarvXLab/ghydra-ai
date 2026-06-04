import { useEffect } from 'react'
import api from '../lib/api'

export default function OAuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    if (!access_token) { window.location.replace('/auth/login'); return }
    localStorage.setItem('access_token', access_token)
    if (refresh_token) localStorage.setItem('refresh_token', refresh_token)
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    window.location.replace('/dashboard')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
      <div style={{ color: '#6b7280', fontSize: 14 }}>Signing you in...</div>
    </div>
  )
}
