import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useTheme } from '../lib/theme'

const FREE_FEATURES = [
  'Live threat detection dashboard',
  'Device & connection scanner',
  'Network traffic overview',
  'Threat feed (last 50 events)',
  'One-time model training',
  'Dark / light theme',
]

const PRO_FEATURES = [
  'Everything in Free',
  'Full IP geolocation threat map',
  'Unlimited threat history',
  'Real-time email alerts',
  'API access (500 req/min)',
  'Multi-device monitoring',
  'Priority model updates',
  'Dedicated support',
]

export default function Pricing() {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const text  = dark ? 'text-slate-100' : 'text-light-text'
  const muted = dark ? 'text-slate-400' : 'text-light-muted'
  const dim   = dark ? 'text-slate-600' : 'text-slate-400'

  return (
    <div className={`flex min-h-screen ${dark ? 'bg-surface-900' : 'bg-light-bg'}`}>
      <Sidebar />

      <main className="md:ml-56 flex-1 p-4 md:p-6 pt-16 md:pt-6">
        {/* Header */}
        <div className="mb-10">
          <h1 className={`text-xl font-bold ${text}`}>Pricing</h1>
          <p className={`text-xs mt-0.5 ${muted}`}>
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl">

          {/* Free */}
          <div className={`${dark ? 'card' : 'card-light'} p-6 flex flex-col`}>
            <div className="mb-6">
              <p className={`text-xs uppercase tracking-widest font-medium mb-2 ${dim}`}>Free</p>
              <div className="flex items-end gap-1 mb-1">
                <span className={`text-4xl font-bold font-mono ${text}`}>$0</span>
                <span className={`text-sm mb-1 ${muted}`}>/month</span>
              </div>
              <p className={`text-xs ${muted}`}>No credit card required.</p>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-0.5 text-threat-low shrink-0">✓</span>
                  <span className={muted}>{f}</span>
                </li>
              ))}
            </ul>

            <Link to="/dashboard" className="btn-outline text-center block">
              Get Started Free
            </Link>
          </div>

          {/* Pro */}
          <div className={`${dark ? 'card border-accent/40' : 'card-light border-accent/40'} p-6 flex flex-col relative`}>
            <div className={`absolute top-4 right-4 text-[10px] font-mono border px-2 py-0.5 rounded
              border-accent/30 text-accent bg-accent/5`}>
              COMING SOON
            </div>

            <div className="mb-6">
              <p className={`text-xs uppercase tracking-widest font-medium mb-2 ${dim}`}>Pro</p>
              <div className="flex items-end gap-1 mb-1">
                <span className={`text-4xl font-bold font-mono ${text}`}>$12</span>
                <span className={`text-sm mb-1 ${muted}`}>/month</span>
              </div>
              <p className={`text-xs ${muted}`}>Full threat intelligence suite.</p>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-0.5 text-accent shrink-0">✓</span>
                  <span className={muted}>{f}</span>
                </li>
              ))}
            </ul>

            <button disabled className="btn-primary text-center w-full opacity-50 cursor-not-allowed">
              Coming Soon
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-14 max-w-3xl">
          <h2 className={`text-sm font-semibold mb-5 ${text}`}>Frequently Asked</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Does the free tier require any setup?',
                a: 'Just open the Threats tab and click Activate. One-time training takes a few minutes, then it persists.',
              },
              {
                q: 'Where does my data go?',
                a: 'Scan results are stored only in memory on the backend. Nothing is persisted to a database or third party.',
              },
              {
                q: 'What is the IP threat map?',
                a: 'A live world map showing the origin of flagged connections. Available in the Pro tier.',
              },
            ].map(({ q, a }) => (
              <div key={q} className={`${dark ? 'card' : 'card-light'} p-5`}>
                <p className={`text-sm font-medium mb-1.5 ${text}`}>{q}</p>
                <p className={`text-sm ${muted}`}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
