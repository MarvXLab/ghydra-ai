import { useEffect, useRef } from 'react'

interface Props {
  lines: string[]
  progress: number
  status: 'idle' | 'training' | 'done' | 'error'
}

export default function TrainingTerminal({ lines, progress, status }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [lines])

  const statusColor = {
    idle: 'text-slate-400',
    training: 'text-yellow-400',
    done: 'text-green-400',
    error: 'text-red-400',
  }[status]

  return (
    <div className="terminal w-full">
      {/* Title bar */}
      <div className="terminal-bar">
        <span className="terminal-dot bg-red-500" />
        <span className="terminal-dot bg-yellow-500" />
        <span className="terminal-dot bg-green-500" />
        <span className="ml-3 text-slate-500 text-xs font-mono">
          ghydra — model training
        </span>
        <span className={`ml-auto text-xs font-mono ${statusColor}`}>
          {status === 'training' ? `${progress}%` : status.toUpperCase()}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-surface-400">
        <div
          className="h-1 bg-accent transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Log output */}
      <div ref={bodyRef} className="terminal-body h-72">
        <div className="mb-2 text-slate-500">
          {'>'} Ghydra AI Engine v2.0 — NSL-KDD MLP Classifier
        </div>
        {lines.map((line, i) => (
          <div key={i} className="leading-6">
            <span className="text-slate-600 mr-2 select-none">[{String(i + 1).padStart(2, '0')}]</span>
            <span className={line.startsWith('ERROR') ? 'text-red-400' : line.includes('Accuracy') || line.includes('ready') ? 'text-green-300' : 'text-green-400'}>
              {line}
            </span>
          </div>
        ))}
        {status === 'training' && (
          <div className="mt-1">
            <span className="text-green-400">{'>'} </span>
            <span className="animate-blink text-green-400">_</span>
          </div>
        )}
        {status === 'done' && (
          <div className="mt-2 text-green-300 font-medium">
            {'>'} Model activated. Threat detection is live.
          </div>
        )}
      </div>
    </div>
  )
}
