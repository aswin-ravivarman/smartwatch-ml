import {
  ComposedChart, Line, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import dayjs from 'dayjs'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip text-xs">
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }} className="flex gap-2">
          <span>{p.name}:</span>
          <span className="font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function HistoryChart({ data }) {
  const formatted = data.map(d => ({
    ...d,
    time: d.ts ? dayjs(d.ts).format('HH:mm') : '',
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={formatted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,37,64,0.8)" />
        <XAxis dataKey="time"
          tick={{ fill: '#3a4a6b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          tickLine={false} axisLine={false} />
        <YAxis yAxisId="hr" domain={[40, 180]}
          tick={{ fill: '#3a4a6b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          tickLine={false} axisLine={false} />
        <YAxis yAxisId="spo2" orientation="right" domain={[85, 100]}
          tick={{ fill: '#3a4a6b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#3a4a6b' }} />
        <defs>
          <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#00e5ff" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <Area yAxisId="hr" type="monotone" dataKey="heartRate" name="HR (bpm)"
          stroke="#00e5ff" strokeWidth={2} fill="url(#hrGrad)" dot={false} isAnimationActive={false} />
        <Line yAxisId="spo2" type="monotone" dataKey="spo2" name="SpO₂ (%)"
          stroke="#00ff88" strokeWidth={2} dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
