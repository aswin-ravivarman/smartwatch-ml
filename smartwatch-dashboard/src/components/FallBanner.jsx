import { motion, AnimatePresence } from 'framer-motion'
import { AlertOctagon } from 'lucide-react'

export default function FallBanner({ fall }) {
  const active = !!fall?.detected
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{    opacity: 0, height: 0     }}
          className="overflow-hidden"
        >
          <div
            className="flex items-center gap-3 px-5 py-3 mb-4 rounded-xl text-sm font-mono"
            style={{
              background: 'rgba(255,61,90,0.12)',
              border: '1px solid rgba(255,61,90,0.5)',
              color: '#ff3d5a',
              boxShadow: '0 0 30px rgba(255,61,90,0.2)',
            }}
          >
            <AlertOctagon size={18} className="blink shrink-0" />
            <span className="font-bold tracking-wider uppercase">FALL DETECTED</span>
            <span className="ml-auto text-[#ff3d5a]/60 text-xs">
              Accel: {fall?.accel?.toFixed(2)}g
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
