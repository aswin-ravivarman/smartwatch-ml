import { Wifi, WifiOff, Battery, Circle } from 'lucide-react'

export default function StatusBar({ connected, data }) {
  const now = new Date().toLocaleTimeString()
  const bat = data?.battery ?? null

  return (
    <div className="flex items-center justify-between mb-6 px-1">
      <div className="flex items-center gap-3">
        <div className="relative w-9 h-9">
          {connected && (
            <>
              <span className="pulse-ring absolute inset-0 rounded-full border border-[#00e5ff]/30" />
              <span className="pulse-ring absolute inset-0 rounded-full border border-[#00e5ff]/20" style={{ animationDelay: '0.5s' }} />
            </>
          )}
          <div className="absolute inset-0 rounded-full bg-[#00e5ff]/10 flex items-center justify-center">
            <Circle size={14} fill={connected ? '#00e5ff' : '#3a4a6b'} stroke="none" />
          </div>
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-[#c8d8f0] leading-none">
            Health<span className="text-[#00e5ff]">Monitor</span>
          </h1>
          <p className="text-xs font-mono text-[#3a4a6b] mt-0.5">
            Device: <span className="text-[#00e5ff]/70">watch_01</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {bat !== null && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#0d1424] border border-[#1a2540] text-xs font-mono">
            <Battery size={12} className={bat < 20 ? 'text-[#ff3d5a]' : 'text-[#00ff88]'} />
            <span className={bat < 20 ? 'text-[#ff3d5a]' : 'text-[#3a4a6b]'}>{bat}%</span>
          </div>
        )}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono border"
          style={connected
            ? { background: 'rgba(0,255,136,0.08)', borderColor: 'rgba(0,255,136,0.3)', color: '#00ff88' }
            : { background: 'rgba(255,61,90,0.08)',  borderColor: 'rgba(255,61,90,0.3)',  color: '#ff3d5a' }}
        >
          {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
          {connected ? 'Live' : 'Offline'}
        </div>
        <div className="px-2 py-1 rounded-md bg-[#0d1424] border border-[#1a2540] text-xs font-mono text-[#3a4a6b]">
          {now}
        </div>
      </div>
    </div>
  )
}
