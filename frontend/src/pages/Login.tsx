import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../lib/theme'
import api from '../lib/api'

export default function Login() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const dark = theme === 'dark'
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', formData)
      
      // Store tokens
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.refresh_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      
      // Update API default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`
      
      // Navigate to dashboard
      navigate('/dashboard')
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Please verify your email before signing in.')
      } else {
        setError(err.response?.data?.detail || 'Invalid email or password.')
      }
    }
    setLoading(false)
  }

  const inputClass = `w-full px-4 py-3 rounded-xl text-base outline-none transition-all
    ${dark 
      ? 'bg-surface-700 border border-surface-400 text-slate-100 focus:border-accent placeholder-slate-500' 
      : 'bg-white border border-gray-200 text-gray-900 focus:border-accent placeholder-gray-400'
    }`

  return (
    <div className={`min-h-screen flex items-center justify-center p-4
      ${dark ? 'bg-surface-900' : 'bg-gradient-to-br from-blue-50 via-white to-blue-50'}`}>
      
      <div className="w-full max-w-sm">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center
            ${dark ? 'bg-surface-700' : 'bg-white shadow-lg'}`}>
            <img src="/GhydraLogo.png" alt="Ghydra" className="w-10 h-10" />
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
            Welcome Back
          </h1>
          <p className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
            Sign in to protect your device
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="example@youremail"
              className={inputClass}
            />
          </div>

          {/* Password */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 
                  ${dark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M13.73 4.51001C13.18 4.37001 12.61 4.30001 12 4.30001C7.52 4.30001 3.73 7.24001 2.46 11.2C3.06 13.08 4.18 14.71 5.66 15.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17.61 8.05001C18.71 9.21001 19.58 10.64 20.15 12.25C18.88 16.21 15.09 19.15 10.61 19.15C9.43 19.15 8.31 18.94 7.28 18.55" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.47 14.53C8.76 13.82 8.32 12.86 8.32 11.8C8.32 9.69001 10.02 7.99001 12.13 7.99001C13.19 7.99001 14.15 8.43001 14.86 9.14001" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15.51 12.7C15.25 14.11 14.1 15.26 12.69 15.52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3.5 20.5L20.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12.0003 5C7.52443 5 3.73042 7.94288 2.45703 12C3.73171 16.0571 7.52589 19 12.0003 19C16.4747 19 20.2687 16.0571 21.5421 12C20.2674 7.94288 16.4734 5 12.0003 5Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-2 border-gray-300 text-accent focus:ring-accent focus:ring-2"
              />
              <span className={`ml-2 ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
                Remember Me
              </span>
            </label>
            <Link to="/auth/forgot-password" className="text-accent hover:underline">
              Forgot Password?
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-dim disabled:opacity-50 disabled:cursor-not-allowed
                     text-white font-semibold py-3 px-4 rounded-xl transition-colors text-base"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className={`absolute inset-0 flex items-center`}>
              <div className={`w-full border-t ${dark ? 'border-surface-400' : 'border-gray-200'}`} />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className={`px-2 ${dark ? 'bg-surface-900 text-slate-500' : 'bg-white text-gray-500'}`}>
                or
              </span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className={`flex items-center justify-center py-3 px-4 rounded-xl border transition-colors
                ${dark 
                  ? 'border-surface-400 hover:bg-surface-700 text-slate-300' 
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
            >
              <img 
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0yMi41NiAxMi4yNUMyMi41NiAxMS40NyAyMi40OSAxMC43MiAyMi4zNiAxMEgxMlYxNC41MUgxNy45OUMxNy43NSAxNS41OSAxNy4xOSAxNi41IDE2LjM2IDE3LjEwOVYxOS44NDlIMTkuNjJDMjEuMzEgMTguMzM5IDIyLjU2IDE1LjQ3OSAyMi41NiAxMi4yNVoiIGZpbGw9IiM0Mjg1RjQiLz4KPHBhdGggZD0iTTEyIDI0QzE1LjI0IDI0IDE3LjA5IDIyLjg5IDE5LjYyIDIwLjg0OUwxNi4zNiAxNy4xMDlDMTUuMzMgMTcuNzg5IDE0LjAyIDIwLjE3OSAxMiAyMC4xNzlDOC44NyAyMC4xNzkgNi4yMiAxOC40MTkgNS4yOCAxNS44OTlIMi4wNVYxOC43MzlDNC43MyAyMS4yMzkgOC4xNCAyNCAyNCAyNCIgZmlsbD0iIzM0QTg1MyIvPgo8L3N2Zz4K"
                alt="Google"
                className="w-5 h-5 mr-2"
              />
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>
            <button
              type="button"
              className={`flex items-center justify-center py-3 px-4 rounded-xl border transition-colors
                ${dark 
                  ? 'border-surface-400 hover:bg-surface-700 text-slate-300' 
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <span className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
            Don't have any Account?{' '}
            <Link to="/auth/register" className="text-accent font-semibold hover:underline">
              Sign Up
            </Link>
          </span>
        </div>
      </div>
    </div>
  )
}