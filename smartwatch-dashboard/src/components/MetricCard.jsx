import { motion } from 'framer-motion'

const colorMap = {
  accent: { text: 'text-[#00e5ff]', border: 'border-[#00e5ff]/30', glow: 'shadow-glow',       bg: 'bg-[#00e5ff]/5'  },
  green:  { text: 'text-[#00ff88]', border: 'border-[#00ff88]/30', glow: 'shadow-glow-green',  bg: 'bg-[#00ff88]/5'  },
  red:    { text: 'text-[#ff3d5a]', border: 'border-[#ff3d5a]/30', glow: 'shadow-glow-red',    bg: 'bg-[#ff3d5a]/5'  },
  amber:  { text: 'text-[#ffb020]', border: 'border-[#ffb020]/30', glow: 'shadow-glow-amber',  bg: 'bg-[#ffb020]/5'  },
  purple: { text: 'text-[#9b6dff]', border: 'border-[#9b6dff]/30', glow: '',                   bg: 'bg-[#9b6dff]/5'  },
  muted:  { text: 'text-[#3a4a6b]', border: 'border-[#1a2540]',    glow: '',                   bg: 'bg-[#3a4a6b]/5'  },
}

export default function MetricCard({ title, value, unit, subtitle, icon: Icon, color = 'accent', alert = false, children }) {
  const c = colorMap[alert ? 'red' : color] ?? colorMap.accent

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`panel p-5 flex flex-col gap-3 border ${alert ? c.border + ' ' + c.glow : 'border-[#1a2540]'}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[#3a4a6b] text-xs font-display uppercase tracking-widest">{title}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
            <Icon size={15} className={c.text} />
          </div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <span className={`font-display font-bold text-4xl leading-none ${c.text} ${alert ? 'blink' : ''}`}>
          {value ?? '--'}
        </span>
        {unit && <span className="text-[#3a4a6b] font-mono text-sm mb-1">{unit}</span>}
      </div>

      {subtitle && <p className="text-xs text-[#3a4a6b] font-mono">{subtitle}</p>}
      {children}
    </motion.div>
  )
}
