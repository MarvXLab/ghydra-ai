import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useTheme } from '../lib/theme'
import api from '../lib/api'

export default function VerifyEmail() {
  const { theme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const dark = theme === 'dark'
  
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const email = location.state?.email || ''
  const verificationCode = location.state?.verificationCode || '' // Remove in production

  useEffect(() => {
    if (!email) {
      navigate('/auth/register')
    }
    // Auto-fill code in development
    if (verificationCode) {
      setCode(verificationCode)
    }
  }, [email, verificationCode, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/auth/verify-email', {
        email,
        code
      })
      
      setSuccess(true)
      setTimeout(() => {
        navigate('/auth/login')
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid verification code.')
    }
    setLoading(false)
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(value)
  }

  if (success) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4
        ${dark ? 'bg-surface-900' : 'bg-gradient-to-br from-green-50 via-white to-green-50'}`}>
        
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className={`text-2xl font-bold mb-4 ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
            Email Verified!
          </h1>
          <p className={`text-sm mb-6 ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
            Your account has been successfully verified. Redirecting to sign in...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4
      ${dark ? 'bg-surface-900' : 'bg-gradient-to-br from-blue-50 via-white to-blue-50'}`}>
      
      <div className="w-full max-w-sm">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center
            ${dark ? 'bg-surface-700' : 'bg-white shadow-lg'}`}>
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
            Verify Your Email
          </h1>
          <p className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
            Enter the 6-digit code sent to
          </p>
          <p className={`text-sm font-semibold ${dark ? 'text-slate-300' : 'text-gray-800'}`}>
            {email}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* OTP Input */}
          <div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              className={`w-full px-4 py-4 text-center text-2xl font-mono tracking-widest rounded-xl border outline-none transition-all
                ${dark 
                  ? 'bg-surface-700 border-surface-400 text-slate-100 focus:border-accent' 
                  : 'bg-white border-gray-200 text-gray-900 focus:border-accent'
                }`}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-accent hover:bg-accent-dim disabled:opacity-50 disabled:cursor-not-allowed
                     text-white font-semibold py-3 px-4 rounded-xl transition-colors text-base"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          {/* Resend Code */}
          <div className="text-center">
            <p className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-600'} mb-2`}>
              Didn't receive the code?
            </p>
            <button
              type="button"
              className="text-accent font-semibold hover:underline text-sm"
            >
              Resend Code
            </button>
          </div>
        </form>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link to="/auth/register" className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-600'} hover:underline`}>
            ← Back to registration
          </Link>
        </div>
      </div>
    </div>
  )
}