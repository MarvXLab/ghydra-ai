import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../lib/theme'
import api from '../lib/api'

export default function Register() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const dark = theme === 'dark'
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/auth/register', {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password
      })

      // Navigate to verification with email
      navigate('/auth/verify-email', { 
        state: { 
          email: formData.email,
          verificationCode: response.data.verification_code // Remove in production
        }
      })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
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
            Create Account
          </h1>
          <p className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
            Sign up to protect your digital life
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Enter your full name"
              className={inputClass}
            />
          </div>

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
              placeholder="Enter your email"
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
                placeholder="Create a strong password"
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

          {/* Confirm Password */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${dark ? 'text-slate-300' : 'text-gray-700'}`}>
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm your password"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 
                  ${dark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M13.73 4.51001C13.18 4.37001 12.61 4.30001 12 4.30001C7.52 4.30001 3.73 7.24001 2.46 11.2C3.06 13.08 4.18 14.71 5.66 15.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className={`absolute inset-0 flex items-center`}>
              <div className={`w-full border-t ${dark ? 'border-surface-400' : 'border-gray-200'}`} />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className={`px-2 ${dark ? 'bg-surface-900 text-slate-500' : 'bg-white text-gray-500'}`}>
                or continue with
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
                className="w-5 h-5"
              />
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

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <span className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
            Already have an account?{' '}
            <Link to="/auth/login" className="text-accent font-semibold hover:underline">
              Sign In
            </Link>
          </span>
        </div>
      </div>
    </div>
  )
}