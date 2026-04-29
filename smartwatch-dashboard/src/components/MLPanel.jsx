import { motion, AnimatePresence } from 'framer-motion'
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Zap } from 'lucide-react'

const riskStyle = {
  normal:   { color: '#00ff88', label: 'Normal',   Icon: CheckCircle   },
  moderate: { color: '#ffb020', label: 'Moderate', Icon: TrendingUp    },
  high:     { color: '#ff3d5a', label: 'High',     Icon: AlertTriangle },
  unknown:  { color: '#3a4a6b', label: 'Unknown',  Icon: Zap           },
}

export default function MLPanel({ ml }) {
  const risk    = riskStyle[ml?.riskLevel ?? 'unknown']
  const RIcon   = risk.Icon
  const conf    = ml?.confidence ?? 0
  const disease = ml?.disease ?? 'Awaiting data...'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel p-5 flex flex-col gap-4"
      style={{ borderColor: risk.color + '44' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#9b6dff]/10 flex items-center justify-center">
            <Brain size={15} className="text-[#9b6dff]" />
          </div>
          <span className="font-display text-xs uppercase tracking-widest text-[#3a4a6b]">ML Prediction</span>
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

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs font-mono text-[#3a4a6b]">
          <span>Confidence</span>
          <span style={{ color: risk.color }}>{conf.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[#1a2540] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: risk.color }}
            initial={{ width: 0 }}
            animate={{ width: `${conf}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {ml?.ts && (
        <p className="text-xs font-mono text-[#3a4a6b]">
          Updated: {new Date(ml.ts).toLocaleTimeString()}
        </p>
      )}
    </motion.div>
  )
}
