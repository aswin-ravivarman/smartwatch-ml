import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Bell, Save, CheckCircle } from 'lucide-react'
import { loadContact, saveContact } from '../lib/notify'
import { DEFAULT_EMERGENCY } from '../config/emergency'

export default function SettingsPanel({ open, onClose }) {
  const [cfg,          setCfg]          = useState(DEFAULT_EMERGENCY)
  const [saved,        setSaved]        = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('hm_sound') !== 'false')

  useEffect(() => {
    if (open) {
      const c = loadContact()
      if (c) setCfg(c)
      setSaved(false)
    }
  }, [open])

  function set(field, val) {
    setCfg(p => ({ ...p, [field]: val }))
  }

  function handleSave() {
    saveContact(cfg)
    localStorage.setItem('hm_sound', soundEnabled ? 'true' : 'false')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Slide-in panel */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 overflow-y-auto"
            style={{
              width: 'min(400px, 95vw)',
              background: 'var(--panel)',
              borderLeft: '1px solid var(--border)',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.2)',
            }}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
              style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)' }}
            >
              <span className="font-display font-bold text-lg" style={{ color: 'var(--text)' }}>
                Settings
              </span>
              <button
                onClick={onClose}
                style={{
                  background: 'var(--border)',
                  border: 'none',
                  borderRadius: '50%',
                  padding: 6,
                  cursor: 'pointer',
                  color: 'var(--text2)',
                  display: 'flex',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">

              {/* ── Emergency Contact ── */}
              <section>
                <div
                  className="font-display text-xs uppercase tracking-widest mb-3"
                  style={{ color: 'var(--text2)' }}
                >
                  Emergency Contact
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { icon: User, field: 'name',  type: 'text',  placeholder: 'Full name' },
                    { icon: Mail, field: 'email', type: 'email', placeholder: 'contact@email.com' },
                  ].map(({ icon: Icon, field, type, placeholder }) => (
                    <div
                      key={field}
                      className="flex items-center gap-3 rounded-xl px-4 py-3"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                    >
                      <Icon size={14} style={{ color: 'var(--text2)', flexShrink: 0 }} />
                      <input
                        type={type}
                        value={cfg[field] ?? ''}
                        onChange={e => set(field, e.target.value)}
                        placeholder={placeholder}
                        className="flex-1 bg-transparent font-mono text-sm outline-none"
                        style={{ color: 'var(--text)', caretColor: 'var(--accent)' }}
                      />
                    </div>
                  ))}
                </div>

                {/* Info note */}
                <div
                  className="mt-3 rounded-xl px-4 py-3 font-mono text-xs flex items-start gap-2"
                  style={{
                    background: 'rgba(0,153,204,0.06)',
                    border: '1px solid rgba(0,153,204,0.2)',
                    color: 'var(--text2)',
                    lineHeight: 1.6,
                  }}
                >
                  <Mail size={12} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
                  <span>
                    Fall alerts are sent via <span style={{ color: 'var(--accent)' }}>EmailJS</span>.
                    Configure your Service ID, Template ID, and Public Key in{' '}
                    <code style={{ color: 'var(--accent)' }}>src/config/emergency.js</code>.
                  </span>
                </div>
              </section>

              {/* ── Alert Sounds ── */}
              <section>
                <div
                  className="font-display text-xs uppercase tracking-widest mb-3"
                  style={{ color: 'var(--text2)' }}
                >
                  Alert Sounds
                </div>
                <div
                  className="flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer"
                  style={{
                    background: soundEnabled ? 'rgba(0,153,204,0.08)' : 'var(--bg)',
                    border: `1px solid ${soundEnabled ? 'rgba(0,153,204,0.3)' : 'var(--border)'}`,
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setSoundEnabled(v => !v)}
                >
                  <div className="flex items-center gap-3">
                    <Bell size={14} style={{ color: soundEnabled ? 'var(--accent)' : 'var(--text2)' }} />
                    <div>
                      <div className="font-mono text-sm font-bold" style={{ color: 'var(--text)' }}>
                        Sound Alerts
                      </div>
                      <div className="font-mono text-xs" style={{ color: 'var(--text2)' }}>
                        Beep on critical HR, SpO₂, and fall events
                      </div>
                    </div>
                  </div>
                  <button
                    className={`theme-toggle ${soundEnabled ? 'dark' : ''}`}
                    style={{ background: soundEnabled ? 'var(--accent)' : undefined }}
                    onClick={e => { e.stopPropagation(); setSoundEnabled(v => !v) }}
                  />
                </div>
              </section>

              {/* ── Save button ── */}
              <button
                onClick={handleSave}
                className="w-full py-3 rounded-xl font-mono font-bold text-sm flex items-center justify-center gap-2"
                style={{
                  background: saved ? 'var(--green)' : 'var(--accent)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'background 0.3s',
                }}
              >
                {saved
                  ? <><CheckCircle size={15} /> Saved!</>
                  : <><Save size={15} /> Save Settings</>
                }
              </button>

              <p className="font-mono text-xs text-center" style={{ color: 'var(--text2)', lineHeight: 1.6 }}>
                Settings are stored in your browser's localStorage.
              </p>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}