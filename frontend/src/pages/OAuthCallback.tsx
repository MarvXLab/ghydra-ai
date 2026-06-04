import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function OAuthCallback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    if (!access_token) { navigate('/auth/login'); return }
    localStorage.setItem('access_token', access_token)
    if (refresh_token) localStorage.setItem('refresh_token', refresh_token)
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    navigate('/dashboard')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900">
      <div className="text-slate-400 text-sm">Signing you in...</div>
    </div>
  )
}
