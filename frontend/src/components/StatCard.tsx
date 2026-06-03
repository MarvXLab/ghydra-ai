import { useTheme } from '../lib/theme'

interface Props {
  label: string
  value: string | number
  sub?: string
  accent?: 'blue' | 'red' | 'green' | 'yellow'
}

const accentMap = {
  blue:   'text-accent',
  red:    'text-threat-critical',
  green:  'text-threat-low',
  yellow: 'text-threat-medium',
}

export default function StatCard({ label, value, sub, accent = 'blue' }: Props) {
  const { theme } = useTheme()
  return (
    <div className={`${theme === 'dark' ? 'stat-card' : 'card-light p-5 flex flex-col gap-1'}`}>
      <p className={`text-xs font-medium uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-light-muted'}`}>
        {label}
      </p>
      <p className={`text-3xl font-bold font-mono ${accentMap[accent]}`}>{value}</p>
      {sub && <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-light-muted'}`}>{sub}</p>}
    </div>
  )
}
