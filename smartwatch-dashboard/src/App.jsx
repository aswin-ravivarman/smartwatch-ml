import { useState, useEffect, useRef, useMemo, memo } from 'react'
import { Toaster } from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  Heart, Droplets, Thermometer, Activity,
  Zap, Wind, BarChart2, CloudLightning, FileText,
} from 'lucide-react'

import { useLatest, useHistory, useML, useFallAlert } from './hooks/useHealth'
import MetricCard        from './components/MetricCard'
import SparkLine         from './components/SparkLine'
import HistoryChart      from './components/HistoryChart'
import MLPanel           from './components/MLPanel'
import FallModal         from './components/FallModal'
import StatusBar         from './components/StatusBar'
import MetricDetailModal from './components/MetricDetailModal'
import SettingsPanel     from './components/SettingsPanel'
import WeeklyTrend       from './components/WeeklyTrend'
import HRVCard           from './components/HRVCard'
import PdfReport         from './components/PdfReport'
import { exportHealthPDF } from './lib/exportPdf'
import { alertWarning, alertMild } from './lib/alertSound'

// ── Helpers ───────────────────────────────────────────────────────────────────
function hrZone(hr) {
  if (!hr)      return { label: 'Detecting...', color: 'muted'  }
  if (hr < 60)  return { label: 'Resting Low',  color: 'purple' }
  if (hr < 100) return { label: 'Normal',        color: 'green'  }
  if (hr < 140) return { label: 'Elevated',      color: 'amber'  }
  return               { label: 'High',           color: 'red'    }
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

// ── CSV Export ────────────────────────────────────────────────────────────────
function exportCSV(history) {
  if (!history?.length) return
  const headers = ['time', 'heartRate', 'spo2', 'tempC', 'stressScore', 'totalAccel', 'battery']
  const rows = history.map(d => [
    d.ts ? new Date(d.ts).toISOString() : '',
    d.heartRate ?? '',
    d.spo2 ?? '',
    d.tempC ?? '',
    d.stressScore ?? '',
    d.totalAccel ?? '',
    d.battery ?? '',
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `health-data-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  // PERF FIX: useTick() removed — clock now lives inside StatusBar itself

  // ── Theme (light by default) ──────────────────────────────────────────────
  const [theme, setTheme] = useState('light')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  // ── Firebase data ─────────────────────────────────────────────────────────
  const { data, connected } = useLatest()
  const rawHistory = useHistory(40)
  const ml         = useML(data)
  const fall       = useFallAlert()

  // PERF FIX: memoize history so HistoryChart doesn't re-render when reference identity changes
  const history = useMemo(() => rawHistory, [JSON.stringify(rawHistory)])

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

  // BUGFIX: filter 0-valued readings before passing to SparkLine
  const hrSpark     = useMemo(() => history.map(d => ({ v: d.heartRate   > 0 ? d.heartRate   : null })), [history])
  const spo2Spark   = useMemo(() => history.map(d => ({ v: d.spo2        > 0 ? d.spo2        : null })), [history])
  const tempSpark   = useMemo(() => history.map(d => ({ v: d.tempC       > 0 ? d.tempC       : null })), [history])
  const stressSpark = useMemo(() => history.map(d => ({ v: d.stressScore >= 0 ? d.stressScore : null })), [history])

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeMetric,  setActiveMetric]  = useState(null)
  const [showFallModal, setShowFallModal] = useState(false)
  const [settingsOpen,  setSettingsOpen]  = useState(false)
  const [exporting,     setExporting]     = useState(false)

  // ── Fall modal trigger ────────────────────────────────────────────────────
  useEffect(() => {
    if (isFall) setShowFallModal(true)
  }, [isFall])

  // ── Alert sounds on critical value changes ────────────────────────────────
  const prevHr   = useRef(0)
  const prevSpo2 = useRef(100)
  useEffect(() => {
    const soundEnabled = localStorage.getItem('hm_sound') !== 'false'
    if (!soundEnabled || !data) return

    if ((hr > 140 || (hr > 0 && hr < 45)) && hr !== prevHr.current) {
      alertWarning()
    }
    if (spo2 > 0 && spo2 < 90 && spo2 !== prevSpo2.current) {
      alertWarning()
    } else if (spo2 > 0 && spo2 < 95 && spo2 !== prevSpo2.current) {
      alertMild()
    }

    prevHr.current   = hr
    prevSpo2.current = spo2
  }, [hr, spo2, data])

  // ── PDF export ────────────────────────────────────────────────────────────
  async function handleExportPDF() {
    setExporting(true)
    await exportHealthPDF({ data, history, ml })
    setExporting(false)
  }

  // ── CSV export ────────────────────────────────────────────────────────────
  function handleExportCSV() {
    exportCSV(history)
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen z-10" style={{ background: 'var(--bg)' }}>
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* ── Status bar ── */}
        <StatusBar
          connected={connected}
          data={data}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenSettings={() => setSettingsOpen(true)}
          onExportPDF={handleExportPDF}
          onExportCSV={handleExportCSV}
          exporting={exporting}
        />

        {/* ── Offline notice ── */}
        {!connected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10 font-mono text-sm mb-6"
            style={{ color: 'var(--text2)' }}
          >
            <CloudLightning size={36} className="mx-auto mb-3" style={{ color: 'var(--text)' }} />
            Waiting for device data from Firebase...
          </motion.div>
        )}

        {/* ── Row 1 — 4 metric cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
          <MetricCard
            title="Heart Rate" value={hr || '--'} unit="bpm"
            subtitle={zone.label} icon={Heart} color={zone.color}
            alert={hr > 140 || (hr > 0 && hr < 45)}
            timestamp={data?.ts}
            onClick={() => setActiveMetric('hr')}
          >
            <SparkLine data={hrSpark} dataKey="v" color={zone.color} unit=" bpm" />
          </MetricCard>

          <MetricCard
            title="Blood Oxygen" value={spo2 || '--'} unit="%"
            subtitle={o2stat.label} icon={Droplets} color={o2stat.color}
            alert={spo2 > 0 && spo2 < 90}
            timestamp={data?.ts}
            onClick={() => setActiveMetric('spo2')}
          >
            <SparkLine data={spo2Spark} dataKey="v" color={o2stat.color} unit="%" />
          </MetricCard>

          <MetricCard
            title="Body Temp" value={temp ? temp.toFixed(1) : '--'} unit="°C"
            subtitle={tstat.label} icon={Thermometer} color={tstat.color}
            alert={temp >= 38}
            timestamp={data?.ts}
            onClick={() => setActiveMetric('temp')}
          >
            <SparkLine data={tempSpark} dataKey="v" color={tstat.color} unit="°C" />
          </MetricCard>

          <MetricCard
            title="Stress Score" value={stress >= 0 ? stress : '--'} unit="/100"
            subtitle={slabel} icon={Activity} color={scolor}
            alert={stress > 75}
            timestamp={data?.ts}
            onClick={() => setActiveMetric('stress')}
          >
            <SparkLine data={stressSpark} dataKey="v" color={scolor} unit="" />
          </MetricCard>
        </div>

        {/* ── Row 2 — History chart + ML panel ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="panel p-5 xl:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className="font-display text-xs uppercase tracking-widest"
                style={{ color: 'var(--text2)' }}
              >
                Trend — Last {history.length} readings
              </span>
              <BarChart2 size={14} style={{ color: 'var(--text2)' }} />
            </div>
            <HistoryChart data={history} />
          </motion.div>

          <MLPanel ml={ml} />
        </div>

        {/* ── Row 3 — Accel + Device vitals + Cloud status ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

          <MetricCard
            title="Total Accel" value={accel.toFixed(2)} unit="g"
            subtitle={isFall ? '⚠ Fall Event' : 'Normal motion'}
            icon={Zap} color={isFall ? 'red' : 'accent'} alert={isFall}
          />

          {/* Device Vitals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="panel p-5 flex flex-col gap-3"
          >
            <span
              className="font-display text-xs uppercase tracking-widest"
              style={{ color: 'var(--text2)' }}
            >
              Device Vitals
            </span>
            {[
              { label: 'X-axis',  value: `${(data?.accelX ?? 0).toFixed(2)} g` },
              { label: 'Y-axis',  value: `${(data?.accelY ?? 0).toFixed(2)} g` },
              { label: 'Z-axis',  value: `${(data?.accelZ ?? 0).toFixed(2)} g` },
              { label: 'Battery', value: `${data?.battery ?? '--'}%`            },
              { label: 'Online',  value: data?.online ? 'Yes' : 'No'            },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-between items-center text-xs font-mono"
              >
                <span style={{ color: 'var(--text2)' }}>{label}</span>
                <span style={{ color: 'var(--vitals-value)', fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </motion.div>

          {/* Cloud Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="panel p-5 flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <Wind size={14} style={{ color: 'var(--purple)' }} />
              <span
                className="font-display text-xs uppercase tracking-widest"
                style={{ color: 'var(--text2)' }}
              >
                Cloud Status
              </span>
            </div>
            {[
              { label: 'Firebase',   value: connected ? 'Connected' : 'Offline', ok: connected                       },
              { label: 'ML Engine',  value: ml?.disease ? 'Active' : 'Waiting',  ok: !!ml?.disease                   },
              { label: 'Risk Level', value: ml?.riskLevel ?? '---',              ok: ml?.riskLevel === 'normal'       },
              { label: 'Confidence', value: ml ? `${(ml.confidence ?? 0).toFixed(1)}%` : '---', ok: (ml?.confidence ?? 0) > 70 },
            ].map(({ label, value, ok }) => (
              <div
                key={label}
                className="flex justify-between items-center text-xs font-mono"
              >
                <span style={{ color: 'var(--text2)' }}>{label}</span>
                <span style={{ color: ok ? 'var(--green)' : 'var(--text2)', fontWeight: 600 }}>
                  {value}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Row 4 — HRV card + Weekly 7-day trend ── */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-4">
          <div className="xl:col-span-1">
            <HRVCard history={history} />
          </div>
          <div className="xl:col-span-3">
            <WeeklyTrend />
          </div>
        </div>

        {/* Footer */}
        <p className="text-center font-mono text-xs mt-4" style={{ color: 'var(--text2)' }}>
          SmartWatch Health Monitor — XIAO ESP32-S3 · MAX30102 · DS18B20 · MPU6050
        </p>
      </div>

      {/* ── Overlays ── */}
      <FallModal
        open={showFallModal}
        accel={accel}
        data={data}
        onClose={() => setShowFallModal(false)}
      />

      <MetricDetailModal
        metric={activeMetric}
        data={data}
        onClose={() => setActiveMetric(null)}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Hidden DOM node used by html2canvas for PDF capture */}
      <PdfReport data={data} history={history} ml={ml} />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background:  'var(--panel)',
            border:      '1px solid var(--border)',
            color:       'var(--text)',
            fontFamily:  'JetBrains Mono',
            fontSize:    13,
          },
        }}
      />
    </div>
  )
}