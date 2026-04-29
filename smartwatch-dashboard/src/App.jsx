import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Heart, Droplets, Thermometer, Activity, Zap, Wind, BarChart2, CloudLightning } from 'lucide-react'

import { useLatest, useHistory, useML, useFallAlert } from './hooks/useHealth'
import MetricCard   from './components/MetricCard'
import SparkLine    from './components/SparkLine'
import HistoryChart from './components/HistoryChart'
import MLPanel      from './components/MLPanel'
import FallBanner   from './components/FallBanner'
import StatusBar    from './components/StatusBar'

function hrZone(hr) {
  if (!hr)      return { label: 'Detecting...', color: 'muted'  }
  if (hr < 60)  return { label: 'Resting Low',  color: 'purple' }
  if (hr < 100) return { label: 'Normal',        color: 'green'  }
  if (hr < 140) return { label: 'Elevated',      color: 'amber'  }
  return                { label: 'High',          color: 'red'    }
}
function spo2Status(s) {
  if (!s || s === 0) return { label: 'No finger', color: 'muted'  }
  if (s >= 95)       return { label: 'Normal',    color: 'green'  }
  if (s >= 90)       return { label: 'Low',       color: 'amber'  }
  return                    { label: 'Critical',  color: 'red'    }
}
function tempStatus(t) {
  if (!t || t === 0) return { label: 'No sensor',  color: 'muted'  }
  if (t < 36.1)      return { label: 'Below norm', color: 'purple' }
  if (t < 37.2)      return { label: 'Normal',     color: 'green'  }
  if (t < 38.0)      return { label: 'Low fever',  color: 'amber'  }
  if (t < 39.0)      return { label: 'Fever',      color: 'red'    }
  return                    { label: 'High fever', color: 'red'    }
}
function stressColor(s) {
  if (s < 0)  return 'muted'
  if (s < 30) return 'green'
  if (s < 55) return 'accent'
  if (s < 75) return 'amber'
  return        'red'
}

function useTick() {
  const [, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT(n => n + 1), 1000)
    return () => clearInterval(id)
  }, [])
}

export default function App() {
  useTick()
  const { data, connected } = useLatest()
  const history  = useHistory(40)
  const ml       = useML()
  const fall     = useFallAlert()

  const hr     = data?.heartRate   ?? 0
  const spo2   = data?.spo2        ?? 0
  const temp   = data?.tempC       ?? 0
  const stress = data?.stressScore ?? -1
  const slabel = data?.stressLevel ?? 'Measuring...'
  const accel  = data?.totalAccel  ?? 0
  const isFall = data?.fallDetected ?? false

  const zone   = hrZone(hr)
  const o2stat = spo2Status(spo2)
  const tstat  = tempStatus(temp)
  const scolor = stressColor(stress)

  const hrSpark     = history.map(d => ({ v: d.heartRate   }))
  const spo2Spark   = history.map(d => ({ v: d.spo2        }))
  const tempSpark   = history.map(d => ({ v: d.tempC       }))
  const stressSpark = history.map(d => ({ v: d.stressScore }))

  return (
    <div className="relative min-h-screen bg-bg z-10">
      <div className="max-w-6xl mx-auto px-4 py-6">

        <StatusBar connected={connected} data={data} />
        <FallBanner fall={isFall ? { detected: true, accel } : null} />

        {!connected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-10 text-[#3a4a6b] font-mono text-sm mb-6"
          >
            <CloudLightning size={36} className="mx-auto mb-3 text-[#1a2540]" />
            Waiting for device data from Firebase...
          </motion.div>
        )}

        {/* Row 1 — 4 metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
          <MetricCard title="Heart Rate" value={hr || '--'} unit="bpm"
            subtitle={zone.label} icon={Heart} color={zone.color}
            alert={hr > 140 || (hr > 0 && hr < 45)}>
            <SparkLine data={hrSpark} dataKey="v" color={zone.color} unit=" bpm" />
          </MetricCard>

          <MetricCard title="Blood Oxygen" value={spo2 || '--'} unit="%"
            subtitle={o2stat.label} icon={Droplets} color={o2stat.color}
            alert={spo2 > 0 && spo2 < 90}>
            <SparkLine data={spo2Spark} dataKey="v" color={o2stat.color} unit="%" />
          </MetricCard>

          <MetricCard title="Body Temp" value={temp ? temp.toFixed(1) : '--'} unit="°C"
            subtitle={tstat.label} icon={Thermometer} color={tstat.color}
            alert={temp >= 38}>
            <SparkLine data={tempSpark} dataKey="v" color={tstat.color} unit="°C" />
          </MetricCard>

          <MetricCard title="Stress Score" value={stress >= 0 ? stress : '--'} unit="/100"
            subtitle={slabel} icon={Activity} color={scolor}
            alert={stress > 75}>
            <SparkLine data={stressSpark} dataKey="v" color={scolor} unit="" />
          </MetricCard>
        </div>

        {/* Row 2 — History chart + ML panel */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="panel p-5 xl:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-display text-xs uppercase tracking-widest text-[#3a4a6b]">
                Trend — Last {history.length} readings
              </span>
              <BarChart2 size={14} className="text-[#3a4a6b]" />
            </div>
            <HistoryChart data={history} />
          </motion.div>

          <MLPanel ml={ml} />
        </div>

        {/* Row 3 — Accel + Device vitals + Cloud status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard title="Total Accel" value={accel.toFixed(2)} unit="g"
            subtitle={isFall ? '⚠ Fall Event' : 'Normal motion'}
            icon={Zap} color={isFall ? 'red' : 'accent'} alert={isFall} />

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="panel p-5 flex flex-col gap-3"
          >
            <span className="font-display text-xs uppercase tracking-widest text-[#3a4a6b]">Device Vitals</span>
            {[
              { label: 'X-axis',   value: `${(data?.accelX ?? 0).toFixed(2)} g` },
              { label: 'Y-axis',   value: `${(data?.accelY ?? 0).toFixed(2)} g` },
              { label: 'Z-axis',   value: `${(data?.accelZ ?? 0).toFixed(2)} g` },
              { label: 'Battery',  value: `${data?.battery ?? '--'}%`           },
              { label: 'Online',   value: data?.online ? 'Yes' : 'No'           },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#3a4a6b]">{label}</span>
                <span className="text-[#c8d8f0]">{value}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="panel p-5 flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <Wind size={14} className="text-[#9b6dff]" />
              <span className="font-display text-xs uppercase tracking-widest text-[#3a4a6b]">Cloud Status</span>
            </div>
            {[
              { label: 'Firebase',   value: connected ? 'Connected' : 'Offline', ok: connected },
              { label: 'ML Engine',  value: ml?.disease ? 'Active' : 'Waiting',  ok: !!ml?.disease },
              { label: 'Risk Level', value: ml?.riskLevel ?? '---',              ok: ml?.riskLevel === 'normal' },
              { label: 'Confidence', value: ml ? `${(ml.confidence ?? 0).toFixed(1)}%` : '---', ok: (ml?.confidence ?? 0) > 70 },
            ].map(({ label, value, ok }) => (
              <div key={label} className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#3a4a6b]">{label}</span>
                <span style={{ color: ok ? '#00ff88' : '#3a4a6b' }}>{value}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <p className="text-center text-[#1a2540] font-mono text-xs mt-8">
          SmartWatch Health Monitor — XIAO ESP32-S3 · MAX30102 · DS18B20 · MPU6050
        </p>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0d1424', border: '1px solid #1a2540',
            color: '#c8d8f0', fontFamily: 'JetBrains Mono', fontSize: 13,
          },
        }}
      />
    </div>
  )
}
