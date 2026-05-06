import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'

/**
 * HRVCard — computes RMSSD (Root Mean Square of Successive Differences)
 * from the HR history array. RMSSD is the gold-standard short-term HRV metric.
 *
 * Formula: RMSSD = sqrt( mean( (RR[i+1] - RR[i])^2 ) )
 * RR interval (ms) = 60000 / HR (bpm)
 *
 * The ESP32 + MAX30102 pushes HR readings every ~15s, so this gives
 * a coarse but useful HRV approximation without firmware changes.
 */
function computeRMSSD(history) {
  // Use only valid HR readings (> 0)
  const hrs = history
    .map(d => d.heartRate)
    .filter(v => v && v > 0)

  if (hrs.length < 4) return null

  // Convert BPM → RR interval in ms
  const rr = hrs.map(hr => 60000 / hr)

  // Successive differences squared
  const diffs = []
  for (let i = 1; i < rr.length; i++) {
    diffs.push((rr[i] - rr[i - 1]) ** 2)
  }

  const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length
  return Math.sqrt(mean).toFixed(1)
}

function hrvStatus(rmssd) {
  if (rmssd === null) return { label: 'Not enough data', color: 'var(--muted)' }
  const v = parseFloat(rmssd)
  if (v < 20)  return { label: 'Low — High stress / fatigue', color: 'var(--red)'    }
  if (v < 40)  return { label: 'Below average',               color: 'var(--amber)'  }
  if (v < 70)  return { label: 'Good',                        color: 'var(--green)'  }
  return               { label: 'Excellent recovery',          color: 'var(--accent)' }
}

export default function HRVCard({ history }) {
  const rmssd  = useMemo(() => computeRMSSD(history), [history])
  const status = hrvStatus(rmssd)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="panel p-5 flex flex-col gap-3 h-full"
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-xs uppercase tracking-widest" style={{ color: 'var(--text2)' }}>
          HRV · RMSSD
        </span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(0,229,255,0.08)' }}>
          <Activity size={15} style={{ color: 'var(--accent)' }} />
        </div>
      </div>

      <div className="flex items-end gap-2">
        <span className="font-display font-bold text-4xl leading-none" style={{ color: status.color }}>
          {rmssd ?? '--'}
        </span>
        {rmssd && (
          <span className="font-mono text-sm mb-1" style={{ color: 'var(--text2)' }}>ms</span>
        )}
      </div>

      <p className="text-xs font-mono" style={{ color: status.color }}>
        {status.label}
      </p>

      <p className="text-xs font-mono" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
        Higher RMSSD = better recovery & lower stress. Derived from last {history.filter(d => d.heartRate > 0).length} HR readings.
      </p>
    </motion.div>
  )
}