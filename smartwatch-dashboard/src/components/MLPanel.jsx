import { motion, AnimatePresence } from 'framer-motion'
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Zap, Info } from 'lucide-react'
import { useState } from 'react'

const riskStyle = {
  normal:   { color: '#00ff88', label: 'Normal',   Icon: CheckCircle   },
  moderate: { color: '#ffb020', label: 'Moderate', Icon: TrendingUp    },
  high:     { color: '#ff3d5a', label: 'High',     Icon: AlertTriangle },
  unknown:  { color: 'var(--muted)', label: 'Unknown', Icon: Zap        },
}

export default function MLPanel({ ml }) {
  const risk    = riskStyle[ml?.riskLevel ?? 'unknown']
  const RIcon   = risk.Icon
  const conf    = ml?.confidence ?? 0
  const disease = ml?.disease    ?? 'Awaiting data...'
  const source  = ml?.source     ?? null
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel p-5 flex flex-col gap-4"
      style={{ borderColor: risk.color + '44' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(155,109,255,0.1)' }}>
            <Brain size={15} style={{ color: 'var(--purple)' }} />
          </div>
          <span className="font-display text-xs uppercase tracking-widest" style={{ color: 'var(--text2)' }}>
            ML Prediction
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={ml?.riskLevel}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1,   opacity: 1 }}
            exit={{    scale: 0.8, opacity: 0 }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-mono"
            style={{ background: risk.color + '18', color: risk.color, border: `1px solid ${risk.color}44` }}
          >
            <RIcon size={11} />
            {risk.label} Risk
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Disease label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={disease}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0   }}
          exit={{    opacity: 0, x:  10 }}
          className="font-display font-bold text-2xl"
          style={{ color: risk.color }}
        >
          {disease}
        </motion.div>
      </AnimatePresence>

      {/* Confidence bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs font-mono" style={{ color: 'var(--text2)' }}>
          <span>Confidence</span>
          <span style={{ color: risk.color }}>{conf.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: risk.color }}
            initial={{ width: 0 }}
            animate={{ width: `${conf}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {ml?.ts ? (
          <p className="text-xs font-mono" style={{ color: 'var(--text2)' }}>
            Updated: {new Date(ml.ts).toLocaleTimeString()}
          </p>
        ) : <span />}

        <AnimatePresence mode="wait">
          {source && (
            <motion.div
              key={source}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{    opacity: 0 }}
              className="relative flex items-center gap-1"
            >
              <motion.span
                className="text-xs font-mono px-2 py-0.5 rounded-full cursor-default"
                style={
                  source === 'server'
                    ? { background: 'rgba(155,109,255,0.1)', color: 'var(--purple)', border: '1px solid rgba(155,109,255,0.3)' }
                    : { background: 'rgba(148,163,184,0.1)', color: 'var(--text2)',  border: '1px solid var(--border)' }
                }
              >
                {source === 'server' ? '⚡ Random Forest' : '⚙ Local rules'}
              </motion.span>
              {/* Info button for "Local rules" */}
              {source === 'local' && (
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, display: 'flex' }}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(v => !v)}
                  title="What is Local rules?"
                >
                  <Info size={12} />
                </button>
              )}
              {/* Tooltip */}
              <AnimatePresence>
                {showTooltip && source === 'local' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute bottom-7 right-0 z-50 p-3 rounded-xl font-mono text-xs"
                    style={{
                      background: 'var(--panel)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      width: 240,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                      lineHeight: 1.6,
                    }}
                  >
                    {/* <strong style={{ color: 'var(--accent)' }}>⚙ Local rules</strong> */}
                    <br />
                    The ML server (Random Forest model on Render) is loading or offline. A fast built-in rule engine is being used instead — it checks your HR, SpO₂, temp, and stress thresholds instantly in your browser, with no server needed.
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}