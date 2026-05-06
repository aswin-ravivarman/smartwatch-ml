import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertOctagon, X, PhoneCall, MessageCircle, Mail, CheckCircle, XCircle, Loader } from 'lucide-react'
import { notifyFall, loadContact } from '../lib/notify'
import { alertFall } from '../lib/alertSound'

const CH_ICON  = { whatsapp: MessageCircle, email: Mail, sms: PhoneCall }
const CH_COLOR = { whatsapp: '#25D366', email: '#0099cc', sms: '#f97316' }

const AUTO_CLOSE_SEC = 20

// ── Countdown ring ────────────────────────────────────────────────────────────
function CountdownRing({ seconds, total }) {
  const r         = 20
  const circ      = 2 * Math.PI * r
  const progress  = seconds / total
  const dashOffset = circ * (1 - progress)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <svg width={52} height={52} style={{ transform: 'rotate(-90deg)' }}>
        {/* track */}
        <circle
          cx={26} cy={26} r={r}
          fill="none"
          stroke="rgba(255,61,90,0.2)"
          strokeWidth={3}
        />
        {/* progress */}
        <circle
          cx={26} cy={26} r={r}
          fill="none"
          stroke="#ff3d5a"
          strokeWidth={3}
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        {/* number — counter-rotate so it reads upright */}
        <text
          x={26} y={26}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            transform: 'rotate(90deg)',
            transformOrigin: '26px 26px',
            fill: '#ff3d5a',
            fontSize: 13,
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 700,
          }}
        >
          {seconds}
        </text>
      </svg>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,61,90,0.6)', letterSpacing: '0.05em' }}>
        auto-close
      </span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FallModal({ open, accel, data, onClose }) {
  const [notifyResults, setNotifyResults] = useState([])
  const [notifying,     setNotifying]     = useState(false)
  const [countdown,     setCountdown]     = useState(AUTO_CLOSE_SEC)
  const didNotify = useRef(false)

  // ── Notifications ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      didNotify.current = false
      setNotifyResults([])
      setCountdown(AUTO_CLOSE_SEC)
      return
    }

    const soundEnabled = localStorage.getItem('hm_sound') !== 'false'
    if (soundEnabled) alertFall()

    if (didNotify.current) return
    didNotify.current = true

    const contact = loadContact()
    if (!contact?.name) return

    setNotifying(true)
    notifyFall({
      accel: accel ?? 0,
      hr:    data?.heartRate ?? 0,
      spo2:  data?.spo2      ?? 0,
      temp:  data?.tempC     ?? 0,
    }).then(results => {
      setNotifyResults(results)
      setNotifying(false)
    })
  }, [open])

  // ── Auto-close + countdown ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return

    setCountdown(AUTO_CLOSE_SEC)

    const closeId = setTimeout(onClose, AUTO_CLOSE_SEC * 1000)

    const tickId = setInterval(() => {
      setCountdown(n => {
        if (n <= 1) { clearInterval(tickId); return 0 }
        return n - 1
      })
    }, 1000)

    return () => {
      clearTimeout(closeId)
      clearInterval(tickId)
    }
  }, [open, onClose])

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {open && (
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
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(6px)',
            }}
          />

          {/* ── Centering container — flex does the centering, NOT transform ── */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 51,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              pointerEvents: 'none',  // let backdrop clicks pass through
            }}
          >
            {/* ── Modal panel ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.75, y: -30 }}
              animate={{ opacity: 1, scale: 1,    y: 0   }}
              exit={{   opacity: 0, scale: 0.85,  y: -20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              style={{
                pointerEvents: 'auto',
                width: 'min(440px, 92vw)',
              }}
            >
              <div
                className="fall-pulse"
                style={{
                  borderRadius: 20,
                  padding: '32px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 20,
                  textAlign: 'center',
                  position: 'relative',
                  background: 'linear-gradient(135deg, #1a0a0f 0%, #2d0f18 100%)',
                  border: '2px solid #ff3d5a',
                  boxShadow: '0 0 60px rgba(255,61,90,0.5), 0 20px 60px rgba(0,0,0,0.6)',
                }}
              >
                {/* Close button */}
                <button
                  onClick={onClose}
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#ff3d5a',
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={14} />
                </button>

                {/* Icon */}
                <div
                  className="fall-shake"
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,61,90,0.2)',
                    border: '2px solid rgba(255,61,90,0.5)',
                  }}
                >
                  <span style={{ fontSize: 40 }}>🤕</span>
                </div>

                {/* Title */}
                <div>
                  <div
                    className="blink"
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontWeight: 700,
                      fontSize: 28,
                      color: '#ff3d5a',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    FALL DETECTED!
                  </div>
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 13,
                      color: 'rgba(255,61,90,0.7)',
                      marginTop: 4,
                    }}
                  >
                    Impact: {accel?.toFixed(2) ?? '--'} g
                  </div>
                </div>

                {/* Body text */}
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#e2e8f0', lineHeight: 1.7, margin: 0 }}>
                  A sudden fall was detected.<br />
                  Emergency contact is being notified automatically.
                </p>

                {/* Notification status box */}
                <div
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,61,90,0.2)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      textAlign: 'left',
                      color: 'rgba(255,255,255,0.4)',
                      marginBottom: 2,
                    }}
                  >
                    Notification Status
                  </div>

                  {notifying && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#ff3d5a' }}>
                      <Loader size={12} className="blink" />
                      Sending alerts...
                    </div>
                  )}

                  {!notifying && notifyResults.length === 0 && (
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                      No emergency contact configured. Go to Settings to add one.
                    </div>
                  )}

                  {notifyResults.map(r => {
                    const Icon  = CH_ICON[r.channel]  ?? AlertOctagon
                    const color = CH_COLOR[r.channel] ?? '#ff3d5a'
                    return (
                      <div
                        key={r.channel}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
                      >
                        <Icon size={12} style={{ color }} />
                        <span style={{ color, textTransform: 'capitalize' }}>{r.channel}</span>
                        <span
                          style={{
                            marginLeft: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color:
                              r.status === 'sent'    ? '#00ff88'   :
                              r.status === 'skipped' ? '#94a3b8'   : '#ff3d5a',
                          }}
                        >
                          {r.status === 'sent'    && <><CheckCircle size={10} /> Sent</>}
                          {r.status === 'skipped' && <>Skipped {r.reason ? `(${r.reason})` : ''}</>}
                          {r.status === 'failed'  && <><XCircle size={10} /> Failed</>}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Action buttons + countdown ring */}
                <div style={{ display: 'flex', gap: 12, width: '100%', alignItems: 'center' }}>
                  <button
                    onClick={onClose}
                    style={{
                      flex: 1,
                      padding: '12px 0',
                      borderRadius: 12,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 13,
                      fontWeight: 700,
                      background: 'rgba(255,61,90,0.15)',
                      border: '1px solid rgba(255,61,90,0.4)',
                      color: '#ff3d5a',
                      cursor: 'pointer',
                    }}
                  >
                    I'm OK
                  </button>

                  <CountdownRing seconds={countdown} total={AUTO_CLOSE_SEC} />

                  <button
                    onClick={() => window.open('tel:112')}
                    style={{
                      flex: 1,
                      padding: '12px 0',
                      borderRadius: 12,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 13,
                      fontWeight: 700,
                      background: '#ff3d5a',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <PhoneCall size={14} />
                    Emergency
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}