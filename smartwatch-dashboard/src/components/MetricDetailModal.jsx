import { useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, TrendingUp, TrendingDown, Minus,
  Heart, Droplets, Thermometer, Activity, RefreshCw
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import dayjs from 'dayjs'
import { useFullHistory } from '../hooks/useFullHistory'

// ── Metric config ────────────────────────────────────────────────────────────
const METRIC_CONFIG = {
  hr: {
    title: 'Heart Rate',
    unit: 'bpm',
    dataKey: 'heartRate',
    color: '#f97316',
    icon: Heart,
    domain: [40, 200],
    refLines: [
      { y: 60,  label: 'Min Normal', color: '#94a3b8' },
      { y: 100, label: 'Max Normal', color: '#94a3b8' },
      { y: 140, label: 'Elevated',   color: '#f97316' },
    ],
    insights: (vals) => {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      const max = Math.max(...vals)
      const min = Math.min(...vals)
      const tips = []
      if (avg > 100)
        tips.push({ icon: '⚠️', text: 'Average HR is elevated. Consider resting or checking with a doctor if persistent.' })
      if (avg < 60)
        tips.push({ icon: '💤', text: 'Resting HR is low — could indicate excellent fitness or bradycardia.' })
      if (max - min > 60)
        tips.push({ icon: '📈', text: `High variability (range: ${min}–${max} bpm). May be normal during activity.` })
      if (avg >= 60 && avg <= 90)
        tips.push({ icon: '✅', text: 'Heart rate looks healthy and within the normal resting range.' })
      tips.push({ icon: '💡', text: 'Normal resting HR for adults is 60–100 bpm. Athletes may have lower rates naturally.' })
      return { avg: avg.toFixed(0), max, min, tips }
    },
  },
  spo2: {
    title: 'Blood Oxygen (SpO₂)',
    unit: '%',
    dataKey: 'spo2',
    color: '#22d3ee',
    icon: Droplets,
    domain: [80, 100],
    refLines: [
      { y: 95, label: 'Safe threshold', color: '#94a3b8' },
      { y: 90, label: 'Critical',       color: '#ff3d5a' },
    ],
    insights: (vals) => {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      const max = Math.max(...vals)
      const min = Math.min(...vals)
      const tips = []
      if (avg < 90)
        tips.push({ icon: '🚨', text: 'Critical: SpO₂ below 90% indicates severe hypoxia. Seek immediate medical attention.' })
      else if (avg < 95)
        tips.push({ icon: '⚠️', text: 'SpO₂ below 95% is concerning. Monitor closely and seek medical advice.' })
      else
        tips.push({ icon: '✅', text: 'Oxygen saturation is in the healthy range (95–100%).' })
      if (min < 92)
        tips.push({ icon: '📉', text: `Dips below 92% detected (min: ${min}%). Could indicate sleep apnea or respiratory issues.` })
      tips.push({ icon: '💡', text: 'Healthy SpO₂ is 95–100%. Values below 90% need prompt medical evaluation.' })
      return { avg: avg.toFixed(1), max, min, tips }
    },
  },
  temp: {
    title: 'Body Temperature',
    unit: '°C',
    dataKey: 'tempC',
    color: '#a855f7',
    icon: Thermometer,
    domain: [34, 42],
    refLines: [
      { y: 36.1, label: 'Low normal',  color: '#94a3b8' },
      { y: 37.2, label: 'High normal', color: '#94a3b8' },
      { y: 38.0, label: 'Fever',       color: '#f97316' },
    ],
    insights: (vals) => {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      const max = Math.max(...vals)
      const min = Math.min(...vals)
      const tips = []
      if (avg >= 38)
        tips.push({ icon: '🌡️', text: `Fever detected (avg ${avg.toFixed(1)}°C). Stay hydrated and rest. Consult a doctor if above 39°C.` })
      else if (avg < 36.1)
        tips.push({ icon: '🥶', text: 'Temperature is below normal. This could be hypothermia — seek warmth and medical advice.' })
      else
        tips.push({ icon: '✅', text: 'Body temperature is within the normal range (36.1–37.2°C).' })
      tips.push({ icon: '💡', text: 'Normal body temp is 36.1–37.2°C. Wrist sensors may read ~0.5°C lower than oral temperature.' })
      return { avg: avg.toFixed(1), max: max.toFixed(1), min: min.toFixed(1), tips }
    },
  },
  stress: {
    title: 'Stress Score',
    unit: '/100',
    dataKey: 'stressScore',
    color: '#00e5ff',
    icon: Activity,
    domain: [0, 100],
    refLines: [
      { y: 30, label: 'Low stress', color: '#00ff88' },
      { y: 55, label: 'Moderate',   color: '#f97316' },
      { y: 75, label: 'High',       color: '#ff3d5a' },
    ],
    insights: (vals) => {
      // BUGFIX: use >= 0 check — stress of 0 (perfectly calm) is valid
      const valid = vals.filter(v => v >= 0)
      if (!valid.length)
        return { avg: '--', max: '--', min: '--', tips: [{ icon: '⏳', text: 'Not enough data yet.' }] }
      const avg = valid.reduce((a, b) => a + b, 0) / valid.length
      const max = Math.max(...valid)
      const min = Math.min(...valid)
      const tips = []
      if (avg > 75)
        tips.push({ icon: '😤', text: 'Chronically high stress. Try deep breathing, meditation, or take a break.' })
      else if (avg > 55)
        tips.push({ icon: '😐', text: 'Moderate stress levels. Ensure adequate sleep and limit caffeine intake.' })
      else
        tips.push({ icon: '😌', text: 'Stress levels are well-managed. Keep up the good habits!' })
      if (max > 80)
        tips.push({ icon: '📊', text: `Peak stress of ${max} detected. Identify triggers and use relaxation techniques.` })
      tips.push({ icon: '💡', text: 'Stress score is estimated from HRV, movement, and biometric patterns via the ML engine.' })
      return { avg: avg.toFixed(0), max, min, tips }
    },
  },
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, unit }) {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <div style={{ color: 'var(--text2)', fontSize: 10, marginBottom: 2 }}>
        {payload[0]?.payload?.time}
      </div>
      <div style={{ color: payload[0]?.color, fontWeight: 700 }}>
        {payload[0]?.value}{unit}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MetricDetailModal({ metric, data, onClose }) {
  const cfg = metric ? METRIC_CONFIG[metric] : null
  // PERF FIX: cached history (60s TTL) via updated useFullHistory
  const { data: fullHistory, loading, fetchHistory } = useFullHistory(500)

  // Fetch full Firebase history whenever the modal opens
  useEffect(() => {
    if (metric) fetchHistory()
  }, [metric])

  const chartData = useMemo(() => {
    if (!cfg) return []
    return fullHistory
      .filter(d => {
        const v = d[cfg.dataKey]
        if (v == null) return false
        // BUGFIX: for non-stress metrics, filter 0 (off-wrist). For stress, 0 is valid.
        if (cfg.dataKey === 'stressScore') return v >= 0
        return v > 0
      })
      .map(d => ({
        time:  d.ts ? dayjs(d.ts).format('HH:mm:ss') : '',
        value: d[cfg.dataKey],
      }))
  }, [fullHistory, cfg])

  // BUGFIX: filter rawVals correctly — use >= 0 for stress, > 0 for others
  const rawVals = useMemo(() => {
    if (!cfg) return []
    return chartData.map(d => d.value).filter(v => {
      if (cfg.dataKey === 'stressScore') return v >= 0
      return v > 0
    })
  }, [chartData, cfg])

  const insights = cfg && rawVals.length ? cfg.insights(rawVals) : null

  const trend =
    rawVals.length > 4
      ? rawVals[rawVals.length - 1] > rawVals[rawVals.length - 4]
        ? 'up'
        : rawVals[rawVals.length - 1] < rawVals[rawVals.length - 4]
        ? 'down'
        : 'stable'
      : 'stable'

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  const trendColor =
    trend === 'up' ? '#f97316' : trend === 'down' ? '#22d3ee' : 'var(--muted)'

  return (
    <AnimatePresence>
      {metric && cfg && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)',
            }}
          />

          {/* ── Centering container ── */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 51,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              pointerEvents: 'none',
            }}
          >
            {/* ── Modal panel — FEATURE: swipe-to-dismiss on mobile ── */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{   opacity: 0, y: 20,  scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80) onClose()
              }}
              style={{
                pointerEvents: 'auto',
                width: '100%',
                maxWidth: 700,
                maxHeight: '88vh',
                overflowY: 'auto',
                background: 'var(--panel)',
                border: `1.5px solid ${cfg.color}44`,
                borderRadius: 20,
                boxShadow: `0 0 40px ${cfg.color}22, 0 20px 60px rgba(0,0,0,0.4)`,
                cursor: 'grab',
              }}
            >
              {/* Swipe handle hint */}
              <div className="flex justify-center pt-3">
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
              </div>

              {/* ── Header ── */}
              <div
                className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
                style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: cfg.color + '18', border: `1px solid ${cfg.color}44` }}
                  >
                    <cfg.icon size={18} style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <div className="font-display font-bold text-base" style={{ color: 'var(--text)' }}>
                      {cfg.title}
                    </div>
                    <div className="font-mono text-xs" style={{ color: 'var(--text2)' }}>
                      Full analytics · Firebase history
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchHistory}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs"
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text2)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1,
                    }}
                    title="Refresh history"
                  >
                    <RefreshCw size={13} className={loading ? 'blink' : ''} />
                    {loading ? 'Loading…' : 'Refresh'}
                  </button>

                  <button
                    onClick={onClose}
                    className="rounded-full p-2"
                    style={{ background: 'var(--border)', border: 'none', cursor: 'pointer', color: 'var(--text2)', display: 'flex' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* ── Body ── */}
              <div className="p-6 flex flex-col gap-6">

                {/* Stats row */}
                {insights && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Current', val: rawVals[rawVals.length - 1] != null ? `${rawVals[rawVals.length - 1]}${cfg.unit}` : '--' },
                      { label: 'Average', val: `${insights.avg}${cfg.unit}` },
                      { label: 'Max',     val: `${insights.max}${cfg.unit}` },
                      { label: 'Min',     val: `${insights.min}${cfg.unit}` },
                    ].map(({ label, val }) => (
                      <div
                        key={label}
                        className="rounded-xl p-3 text-center"
                        style={{ background: cfg.color + '10', border: `1px solid ${cfg.color}28` }}
                      >
                        <div className="font-mono text-xs mb-1" style={{ color: 'var(--text2)' }}>{label}</div>
                        <div className="font-display font-bold text-lg" style={{ color: cfg.color }}>{val}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Trend + reading count */}
                <div className="flex items-center gap-2 font-mono text-xs" style={{ color: 'var(--text2)' }}>
                  <TrendIcon size={14} style={{ color: trendColor }} />
                  <span>Trend:</span>
                  <span style={{ color: trendColor, fontWeight: 600 }}>
                    {trend === 'up' ? 'Rising' : trend === 'down' ? 'Falling' : 'Stable'}
                  </span>
                  <span className="ml-auto">
                    {loading
                      ? 'Fetching readings from Firebase…'
                      : `${chartData.length} readings loaded`}
                  </span>
                </div>

                {/* Waveform chart */}
                <div>
                  <div
                    className="font-display text-xs uppercase tracking-widest mb-3"
                    style={{ color: 'var(--text2)' }}
                  >
                    Waveform — All readings from Firebase
                  </div>

                  {loading ? (
                    <div
                      className="flex flex-col items-center justify-center gap-3 rounded-xl"
                      style={{ height: 220, background: 'var(--bg)', border: '1px solid var(--border)' }}
                    >
                      <RefreshCw size={20} className="blink" style={{ color: cfg.color }} />
                      <span className="font-mono text-sm" style={{ color: 'var(--text2)' }}>
                        Fetching Firebase history…
                      </span>
                    </div>
                  ) : chartData.length === 0 ? (
                    <div
                      className="flex items-center justify-center rounded-xl"
                      style={{ height: 220, background: 'var(--bg)', border: '1px solid var(--border)' }}
                    >
                      <span className="font-mono text-sm" style={{ color: 'var(--text2)' }}>
                        No readings found in Firebase yet.
                      </span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`modal-grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={cfg.color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={cfg.color} stopOpacity={0}   />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: 'var(--text2)' }}
                          tickLine={false}
                          axisLine={false}
                          interval={Math.max(1, Math.floor(chartData.length / 6))}
                        />
                        <YAxis
                          domain={cfg.domain}
                          tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: 'var(--text2)' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip unit={cfg.unit} />} />
                        {cfg.refLines.map(r => (
                          <ReferenceLine
                            key={r.y}
                            y={r.y}
                            stroke={r.color}
                            strokeDasharray="4 4"
                            strokeOpacity={0.6}
                            label={{
                              value:      r.label,
                              fontSize:   9,
                              fill:       r.color,
                              fontFamily: 'JetBrains Mono',
                              position:   'insideTopRight',
                            }}
                          />
                        ))}
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={cfg.color}
                          strokeWidth={2}
                          fill={`url(#modal-grad-${metric})`}
                          dot={false}
                          isAnimationActive={false}
                          connectNulls
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* AI Insights */}
                {!loading && insights?.tips?.length > 0 && (
                  <div>
                    <div
                      className="font-display text-xs uppercase tracking-widest mb-3"
                      style={{ color: 'var(--text2)' }}
                    >
                      Health Insights
                    </div>
                    <div className="flex flex-col gap-2">
                      {insights.tips.map((tip, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-xl font-mono text-xs"
                          style={{
                            background:  'var(--bg)',
                            border:      '1px solid var(--border)',
                            color:       'var(--text)',
                            lineHeight:  1.6,
                          }}
                        >
                          <span style={{ fontSize: 16, flexShrink: 0 }}>{tip.icon}</span>
                          <span>{tip.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}