import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const colorMap = {
  accent: { text: '#00e5ff', border: 'rgba(0,229,255,0.3)',  bg: 'rgba(0,229,255,0.07)'  },
  green:  { text: '#00ff88', border: 'rgba(0,255,136,0.3)',  bg: 'rgba(0,255,136,0.07)'  },
  red:    { text: '#ff3d5a', border: 'rgba(255,61,90,0.3)',   bg: 'rgba(255,61,90,0.07)'  },
  amber:  { text: '#ffb020', border: 'rgba(255,176,32,0.3)',  bg: 'rgba(255,176,32,0.07)' },
  purple: { text: '#9b6dff', border: 'rgba(155,109,255,0.3)', bg: 'rgba(155,109,255,0.07)'},
  muted:  { text: 'var(--muted)', border: 'var(--border)', bg: 'rgba(148,163,184,0.07)' },
}

// UX: "Updated Xs ago" label — ticks every second locally
function LastUpdated({ timestamp }) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    function compute() {
      if (!timestamp) { setLabel(''); return }
      const secs = Math.floor((Date.now() - timestamp) / 1000)
      if (secs < 5)        setLabel('Updated just now')
      else if (secs < 60)  setLabel(`Updated ${secs}s ago`)
      else if (secs < 120) setLabel('Last seen 1 min ago')
      else                 setLabel(`Last seen ${Math.floor(secs / 60)} min ago`)
    }

    compute()
    const id = setInterval(compute, 1000)
    return () => clearInterval(id)
  }, [timestamp])

  if (!label) return null

  const isStale = timestamp && (Date.now() - timestamp) > 90_000
  return (
    <p
      className="text-xs font-mono"
      style={{ color: isStale ? 'var(--amber)' : 'var(--muted)', opacity: 0.8 }}
    >
      {label}
    </p>
  )
}

export default function MetricCard({
  title, value, unit, subtitle, icon: Icon,
  color = 'accent', alert = false, children, onClick, timestamp,
}) {
  const c = colorMap[alert ? 'red' : color] ?? colorMap.accent

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`panel p-5 flex flex-col gap-3 ${onClick ? 'metric-card-clickable' : ''}`}
      style={{ borderColor: alert ? c.border : 'var(--border)' }}
      onClick={onClick}
      title={onClick ? `Click to view ${title} details` : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-xs uppercase tracking-widest" style={{ color: 'var(--text2)' }}>{title}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: c.bg }}>
            <Icon size={15} style={{ color: c.text }} />
          </div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <span className={`font-display font-bold text-4xl leading-none ${alert ? 'blink' : ''}`} style={{ color: c.text }}>
          {value ?? '--'}
        </span>
        {unit && <span className="font-mono text-sm mb-1" style={{ color: 'var(--text2)' }}>{unit}</span>}
      </div>

      {subtitle && <p className="text-xs font-mono" style={{ color: 'var(--text2)' }}>{subtitle}</p>}

      {/* UX FIX: Last updated timestamp */}
      <LastUpdated timestamp={timestamp} />

      {onClick && (
        <p className="text-xs font-mono" style={{ color: 'var(--muted)', opacity: 0.7 }}>
          ↗ Click for full analytics
        </p>
      )}
      {children}
    </motion.div>
  )
}