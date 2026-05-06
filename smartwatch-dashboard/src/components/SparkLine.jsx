import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'

const colorMap = {
  accent: '#00e5ff', green: '#00ff88', red: '#ff3d5a',
  amber:  '#ffb020', purple: '#9b6dff', muted: '#3a4a6b',
}

function CustomTooltip({ active, payload, unit }) {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <span style={{ color: '#c8d8f0' }}>{payload[0].value}{unit}</span>
    </div>
  )
}

export default function SparkLine({ data, dataKey, color = 'accent', unit = '' }) {
  const hex = colorMap[color] ?? colorMap.accent
  const id  = `spark-${color}-${dataKey}`
  return (
    <ResponsiveContainer width="100%" height={50}>
      {/* BUGFIX: connectNulls so 0-replaced-with-null readings don't show as dips */}
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={hex} stopOpacity={0.3} />
            <stop offset="95%" stopColor={hex} stopOpacity={0}   />
          </linearGradient>
        </defs>
        <Tooltip content={<CustomTooltip unit={unit} />} />
        <Area type="monotone" dataKey={dataKey} stroke={hex} strokeWidth={1.5}
          fill={`url(#${id})`} dot={false} isAnimationActive={false} connectNulls />
      </AreaChart>
    </ResponsiveContainer>
  )
}