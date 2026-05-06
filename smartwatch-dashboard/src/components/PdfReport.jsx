import dayjs from 'dayjs'

const COLS = {
  hr:     { label: 'HR',    key: 'heartRate',   unit: 'bpm', color: '#f97316' },
  spo2:   { label: 'SpO₂',  key: 'spo2',        unit: '%',   color: '#22d3ee' },
  temp:   { label: 'Temp',  key: 'tempC',        unit: '°C',  color: '#a855f7' },
  stress: { label: 'Stress',key: 'stressScore',  unit: '/100',color: '#00bcd4' },
}

function avg(arr) { return arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : '--' }
function max(arr) { return arr.length ? Math.max(...arr).toFixed(1) : '--' }
function min(arr) { return arr.length ? Math.min(...arr).toFixed(1) : '--' }

export default function PdfReport({ data, history, ml }) {
  const now  = new Date()
  const rows = history.slice(-40)

  return (
    <div id="pdf-report" style={{ display: 'none', fontFamily: 'DM Sans, sans-serif', background: '#fff', color: '#1e293b', padding: 40, width: 794 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0099cc', paddingBottom: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1e293b' }}>
            Health<span style={{ color: '#0099cc' }}>Monitor</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>
            Device: watch_01 · XIAO ESP32-S3
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Health Report</div>
          <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
            Generated: {dayjs(now).format('DD MMM YYYY, HH:mm:ss')}
          </div>
        </div>
      </div>

      {/* Current vitals */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', marginBottom: 12 }}>
          Current Vitals
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {Object.values(COLS).map(c => (
            <div key={c.key} style={{ background: '#f8faff', border: `1.5px solid ${c.color}44`, borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'monospace' }}>{c.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: c.color, marginTop: 4 }}>
                {data?.[c.key] != null ? Number(data[c.key]).toFixed(c.key === 'stressScore' ? 0 : 1) : '--'}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{c.unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics table */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', marginBottom: 12 }}>
          Statistics — Last {rows.length} Readings
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'monospace' }}>
          <thead>
            <tr style={{ background: '#f0f4ff' }}>
              {['Metric', 'Average', 'Maximum', 'Minimum', 'Unit'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#3a4a6b', borderBottom: '1px solid #dde3f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.values(COLS).map(c => {
              const vals = rows.map(r => r[c.key]).filter(v => v != null && v !== 0)
              return (
                <tr key={c.key} style={{ borderBottom: '1px solid #f0f4ff' }}>
                  <td style={{ padding: '8px 12px', color: c.color, fontWeight: 600 }}>{c.label}</td>
                  <td style={{ padding: '8px 12px', color: '#1e293b' }}>{avg(vals)}</td>
                  <td style={{ padding: '8px 12px', color: '#1e293b' }}>{max(vals)}</td>
                  <td style={{ padding: '8px 12px', color: '#1e293b' }}>{min(vals)}</td>
                  <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{c.unit}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ML Prediction */}
      {ml && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', marginBottom: 12 }}>
            ML Health Prediction
          </div>
          <div style={{ background: '#f8faff', border: '1px solid #dde3f0', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 32 }}>
            <div>
              <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', textTransform: 'uppercase' }}>Diagnosis</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: ml.riskLevel === 'normal' ? '#00a85a' : ml.riskLevel === 'high' ? '#dc2626' : '#d97706', marginTop: 4 }}>{ml.disease}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', textTransform: 'uppercase' }}>Risk Level</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, textTransform: 'capitalize', color: '#1e293b' }}>{ml.riskLevel}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', textTransform: 'uppercase' }}>Confidence</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, color: '#1e293b' }}>{ml.confidence?.toFixed(1)}%</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', textTransform: 'uppercase' }}>Engine</div>
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6, color: '#7c3aed', fontFamily: 'monospace' }}>{ml.source === 'server' ? '⚡ Random Forest' : '⚙ Local rules'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent readings table */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', marginBottom: 12 }}>
          Recent Readings Log
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'monospace' }}>
          <thead>
            <tr style={{ background: '#f0f4ff' }}>
              {['Time', 'HR (bpm)', 'SpO₂ (%)', 'Temp (°C)', 'Stress', 'Accel (g)'].map(h => (
                <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: '#3a4a6b', borderBottom: '1px solid #dde3f0', fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(-20).reverse().map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f8faff', background: i % 2 ? '#fafbff' : '#fff' }}>
                <td style={{ padding: '5px 10px', color: '#64748b' }}>{r.ts ? dayjs(r.ts).format('HH:mm:ss') : '--'}</td>
                <td style={{ padding: '5px 10px', color: '#f97316', fontWeight: 600 }}>{r.heartRate ?? '--'}</td>
                <td style={{ padding: '5px 10px', color: '#22d3ee', fontWeight: 600 }}>{r.spo2 ?? '--'}</td>
                <td style={{ padding: '5px 10px', color: '#a855f7', fontWeight: 600 }}>{r.tempC?.toFixed(1) ?? '--'}</td>
                <td style={{ padding: '5px 10px', color: '#00bcd4', fontWeight: 600 }}>{r.stressScore ?? '--'}</td>
                <td style={{ padding: '5px 10px', color: '#64748b' }}>{r.totalAccel?.toFixed(2) ?? '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 32, paddingTop: 12, borderTop: '1px solid #dde3f0', fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between' }}>
        <span>HealthMonitor Dashboard — Confidential Health Data</span>
        <span>XIAO ESP32-S3 · MAX30102 · DS18B20 · MPU6050</span>
      </div>
    </div>
  )
}