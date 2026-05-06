import { useState, useEffect } from 'react'
import { Wifi, WifiOff, Circle, Settings, FileDown, Loader } from 'lucide-react'

// PERF FIX: Clock tick lives here now — not in App — so only StatusBar re-renders every second
function useClock() {
  const [now, setNow] = useState(new Date().toLocaleTimeString())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

// UX: Battery bar component — visual fill green→amber→red
function BatteryBar({ bat }) {
  if (bat === null) return null
  const color = bat > 50 ? 'var(--green)' : bat > 20 ? 'var(--amber)' : 'var(--red)'
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      title={`Battery: ${bat}%`}
    >
      {/* Battery icon shell */}
      <div className="flex items-center gap-1">
        <div
          style={{
            width: 22, height: 11, borderRadius: 2,
            border: `1.5px solid ${color}`,
            position: 'relative', display: 'flex', alignItems: 'center',
          }}
        >
          <div
            style={{
              width: `${bat}%`, maxWidth: '100%',
              height: '100%',
              background: color,
              borderRadius: 1,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        {/* Battery nub */}
        <div style={{ width: 2, height: 5, background: color, borderRadius: 1 }} />
      </div>
      <span style={{ color: bat < 20 ? 'var(--red)' : 'var(--text2)' }}>{bat}%</span>
    </div>
  )
}

export default function StatusBar({
  connected,
  data,
  theme,
  onToggleTheme,
  onOpenSettings,
  onExportPDF,
  onExportCSV,
  exporting,
}) {
  const now    = useClock()
  const bat    = data?.battery ?? null
  const isDark = theme === 'dark'

  return (
    <div
      className="flex items-center justify-between mb-6 px-5 py-3 rounded-2xl"
      style={{
        background: 'var(--panel)',
        border:     '1px solid var(--border)',
        boxShadow:  '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* ── Left: Logo ── */}
      <div className="flex items-center gap-3">
        <div className="relative w-9 h-9">
          {connected && (
            <>
              <span
                className="pulse-ring absolute inset-0 rounded-full"
                style={{ border: '1px solid rgba(0,153,204,0.4)' }}
              />
              <span
                className="pulse-ring absolute inset-0 rounded-full"
                style={{ border: '1px solid rgba(0,153,204,0.2)', animationDelay: '0.5s' }}
              />
            </>
          )}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,153,204,0.1)' }}
          >
            <Circle
              size={14}
              fill={connected ? '#0099cc' : 'var(--muted)'}
              stroke="none"
            />
          </div>
        </div>

        <div>
          <h1
            className="font-display font-bold text-xl leading-none"
            style={{ color: 'var(--text)' }}
          >
            Health<span style={{ color: '#0099cc' }}>Monitor</span>
          </h1>
          <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text2)' }}>
            Device:{' '}
            <span style={{ color: 'rgba(0,153,204,0.8)' }}>watch_01</span>
          </p>
        </div>
      </div>

      {/* ── Right: chips ── */}
      <div className="flex items-center gap-2 flex-wrap justify-end">

        {/* UX FIX: Battery bar (visual) instead of plain number */}
        <BatteryBar bat={bat} />

        {/* Live / Offline */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono"
          style={
            connected
              ? { background: 'rgba(0,168,90,0.1)', border: '1px solid rgba(0,168,90,0.3)', color: 'var(--green)' }
              : { background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: 'var(--red)'   }
          }
        >
          {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
          {connected ? 'Live' : 'Offline'}
        </div>

        {/* Clock — updates itself via useClock() */}
        <div
          className="px-3 py-1.5 rounded-lg text-xs font-mono"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text2)' }}
        >
          {now}
        </div>

        {/* CSV Export — FEATURE: new button alongside PDF */}
        <button
          onClick={onExportCSV}
          title="Export CSV data"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono"
          style={{
            background: 'var(--bg)',
            border:     '1px solid var(--border)',
            color:      'var(--text2)',
            cursor:     'pointer',
          }}
        >
          <FileDown size={11} />
          CSV
        </button>

        {/* PDF Export */}
        <button
          onClick={onExportPDF}
          disabled={exporting}
          title="Export PDF health report"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono"
          style={{
            background: 'var(--bg)',
            border:     '1px solid var(--border)',
            color:      'var(--text2)',
            cursor:     exporting ? 'not-allowed' : 'pointer',
            opacity:    exporting ? 0.55 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {exporting
            ? <Loader size={11} className="blink" />
            : <FileDown size={11} />
          }
          PDF
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="Settings"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono"
          style={{
            background: 'var(--bg)',
            border:     '1px solid var(--border)',
            color:      'var(--text2)',
            cursor:     'pointer',
          }}
        >
          <Settings size={11} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className={`theme-toggle ${isDark ? 'dark' : ''}`}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        />
      </div>
    </div>
  )
}