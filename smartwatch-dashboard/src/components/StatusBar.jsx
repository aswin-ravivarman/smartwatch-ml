import { Wifi, WifiOff, Battery, Circle } from 'lucide-react'

export default function StatusBar({ connected, data }) {
  const now = new Date().toLocaleTimeString()
  const bat = data?.battery ?? null

  return (
    <div
      className="flex items-center justify-between mb-6 px-5 py-3 rounded-2xl"
      style={{
        background: 'white',
        border: '1px solid #dde3f0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="relative w-9 h-9">
          {connected && (
            <>
              <span className="pulse-ring absolute inset-0 rounded-full border border-[#0099cc]/40" />
              <span className="pulse-ring absolute inset-0 rounded-full border border-[#0099cc]/20"
                style={{ animationDelay: '0.5s' }} />
            </>
          )}
          <div className="absolute inset-0 rounded-full bg-[#0099cc]/10 flex items-center justify-center">
            <Circle size={14} fill={connected ? '#0099cc' : '#94a3b8'} stroke="none" />
          </div>
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-[#1e293b] leading-none">
            Health<span className="text-[#0099cc]">Monitor</span>
          </h1>
          <p className="text-xs font-mono text-[#94a3b8] mt-0.5">
            Device: <span className="text-[#0099cc]/80">watch_01</span>
          </p>
        </div>
      </div>

      {/* Right: Status chips */}
      <div className="flex items-center gap-2">
        {bat !== null && (
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#f8faff] border border-[#dde3f0] text-xs font-mono">
            <Battery size={12} className={bat < 20 ? 'text-[#dc2626]' : 'text-[#00a85a]'} />
            <span className={bat < 20 ? 'text-[#dc2626]' : 'text-[#64748b]'}>{bat}%</span>
          </div>
        )}

        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border"
          style={connected
            ? { background: '#f0fdf4', borderColor: '#bbf7d0', color: '#00a85a' }
            : { background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}
        >
          {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
          {connected ? 'Live' : 'Offline'}
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-[#f8faff] border border-[#dde3f0] text-xs font-mono text-[#64748b]">
          {now}
        </div>
      </div>
    </div>
  )
}