import { motion } from 'framer-motion'
import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import { useWeeklyTrend } from '../hooks/useWeeklyTrend'
import { Calendar, BarChart2 } from 'lucide-react'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <div className="font-bold mb-1" style={{ color: 'var(--text)', fontFamily: 'JetBrains Mono', fontSize: 11 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, fontFamily: 'JetBrains Mono', fontSize: 11 }}>
          {p.name}: {p.value ?? 'No data'}
        </div>
      ))}
    </div>
  )
}

// UX FIX: Check if all 7 days are empty (new device / not enough data)
function isAllEmpty(trend) {
  return trend.every(d => d.hr === null && d.spo2 === null && d.temp === null && d.stress === null)
}

export default function WeeklyTrend() {
  const { trend, loading } = useWeeklyTrend()

  const noData = !loading && trend.length > 0 && isAllEmpty(trend)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="panel p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={14} style={{ color: 'var(--text2)' }} />
          <span className="font-display text-xs uppercase tracking-widest" style={{ color: 'var(--text2)' }}>
            Weekly Trend — 7-Day Daily Averages
          </span>
        </div>
        {loading && (
          <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>Loading Firebase...</span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ height: 200 }}>
          <div className="font-mono text-sm" style={{ color: 'var(--text2)' }}>Fetching 7-day history...</div>
        </div>
      ) : noData ? (
        /* UX FIX: Empty state when device is new / no data yet */
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-xl"
          style={{ height: 200, background: 'var(--bg)', border: '1px dashed var(--border)' }}
        >
          <BarChart2 size={28} style={{ color: 'var(--muted)' }} />
          <p className="font-mono text-sm text-center" style={{ color: 'var(--text2)', maxWidth: 280, lineHeight: 1.6 }}>
            Not enough data yet — check back after your first full day of wear.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={trend} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day"
              tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: 'var(--text2)' }}
              tickLine={false} axisLine={false}
            />
            {/* Left Y-axis: HR */}
            <YAxis
              yAxisId="hr"
              domain={[40, 160]}
              tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: 'var(--text2)' }}
              tickLine={false} axisLine={false}
            />
            {/* Right Y-axis: SpO₂ */}
            <YAxis
              yAxisId="spo2"
              orientation="right"
              domain={[85, 100]}
              tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: 'var(--text2)' }}
              tickLine={false} axisLine={false}
            />
            {/* BUGFIX: Add second right Y-axis for temp (hidden ticks, separate scale) */}
            <YAxis
              yAxisId="temp"
              orientation="right"
              domain={[34, 42]}
              hide
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text2)' }} />

            <defs>
              <linearGradient id="hrBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#f97316" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.2} />
              </linearGradient>
            </defs>

            <Bar yAxisId="hr" dataKey="hr" name="Avg HR (bpm)"
              fill="url(#hrBarGrad)" radius={[4,4,0,0]} maxBarSize={32} />
            <Line yAxisId="spo2" type="monotone" dataKey="spo2" name="Avg SpO₂ (%)"
              stroke="#22d3ee" strokeWidth={2.5} dot={{ fill: '#22d3ee', r: 4 }} connectNulls />
            <Line yAxisId="hr" type="monotone" dataKey="stress" name="Avg Stress"
              stroke="#9b6dff" strokeWidth={2} strokeDasharray="5 3"
              dot={{ fill: '#9b6dff', r: 3 }} connectNulls />
            {/* BUGFIX: Temperature line — was collected but never rendered */}
            <Line yAxisId="temp" type="monotone" dataKey="temp" name="Avg Temp (°C)"
              stroke="#f43f5e" strokeWidth={2} strokeDasharray="3 2"
              dot={{ fill: '#f43f5e', r: 3 }} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}