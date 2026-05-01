import { useState, useEffect, useRef, useCallback } from 'react'
import { subscribeLatest, subscribeHistory, subscribeFall } from '../lib/firebase'
import toast from 'react-hot-toast'

const ML_ENDPOINT = 'https://smartwatch-ml.onrender.com/predict'
const ML_INTERVAL_MS = 15000
const KEEP_ALIVE_MS  = 9 * 60 * 1000   // ping every 9 min to prevent cold start

// ─── local rule-based fallback (runs instantly, no server needed) ───────────
function ruleBased(data) {
  const hr   = data.heartRate   ?? 75
  const spo2 = data.spo2        ?? 97
  const temp = data.tempC       ?? 36.5
  const ss   = data.stressScore ?? 40
  const fall = data.fallDetected ? 1 : 0

  if (fall)       return { disease: 'Fall Risk',    confidence: 95.0, riskLevel: 'high' }
  if (spo2 < 90)  return { disease: 'Hypoxia',      confidence: 90.0, riskLevel: 'high' }
  if (temp >= 38) return { disease: 'Hyperthermia', confidence: 85.0, riskLevel: 'high' }
  if (hr < 50)    return { disease: 'Bradycardia',  confidence: 80.0, riskLevel: 'moderate' }
  if (hr > 110)   return { disease: 'Tachycardia',  confidence: 80.0, riskLevel: 'moderate' }
  if (ss > 75)    return { disease: 'High Stress',  confidence: 75.0, riskLevel: 'moderate' }
  return                  { disease: 'Normal',       confidence: 92.0, riskLevel: 'normal' }
}

// ─── useLatest ───────────────────────────────────────────────────────────────
export function useLatest() {
  const [data, setData]           = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const unsub = subscribeLatest(val => {
      if (val) { setData(val); setConnected(true) }
      else setConnected(false)
    })
    return () => unsub()
  }, [])

  return { data, connected }
}

// ─── useHistory ──────────────────────────────────────────────────────────────
export function useHistory(n = 40) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    const unsub = subscribeHistory(n, setHistory)
    return () => unsub()
  }, [n])

  return history
}

// ─── useML ───────────────────────────────────────────────────────────────────
export function useML(data) {
  const [ml, setML]         = useState(null)
  const [source, setSource] = useState(null)   // 'server' | 'local'
  const prevDisease         = useRef(null)
  const lastCall            = useRef(0)

  // ── keep-alive: ping /health every 9 min so Render never cold-starts ──────
  useEffect(() => {
    const ping = () =>
      fetch(`${ML_ENDPOINT.replace('/predict', '/health')}`, { method: 'GET' })
        .catch(() => {})   // silent

    ping()   // ping immediately on mount to wake server early
    const id = setInterval(ping, KEEP_ALIVE_MS)
    return () => clearInterval(id)
  }, [])

  // ── prediction call ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!data?.heartRate || !data?.spo2) return

    const now = Date.now()
    if (now - lastCall.current < ML_INTERVAL_MS) return
    lastCall.current = now

    const features = {
      heartRate:    data.heartRate    ?? 0,
      spo2:         data.spo2         ?? 97,
      tempC:        data.tempC        ?? 36.5,
      stressScore:  data.stressScore  ?? 50,
      totalAccel:   data.totalAccel   ?? 1.0,
      fallDetected: data.fallDetected ? 1 : 0,
    }

    // Show local result immediately while server request is in-flight
    const local = ruleBased(data)
    setML({ ...local, ts: Date.now(), source: 'local' })
    setSource('local')

    fetch(ML_ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(features),
      signal:  AbortSignal.timeout(10000),   // give up after 10 s
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(result => {
        const mlData = {
          disease:    result.disease,
          confidence: result.confidence,
          riskLevel:  result.risk_level,
          ts:         Date.now(),
          source:     'server',
        }
        setML(mlData)
        setSource('server')

        // toast only on disease change
        if (result.disease !== prevDisease.current && result.disease !== 'Normal') {
          if (result.risk_level === 'high') {
            toast.error(
              `⚠️ ${result.disease} detected (${result.confidence?.toFixed(1)}%)`,
              { duration: 6000 }
            )
          } else {
            toast(`${result.disease} (${result.confidence?.toFixed(1)}%)`, { duration: 4000 })
          }
          prevDisease.current = result.disease
        }
      })
      .catch(() => {
        // server unreachable → stay with local result, no noisy toast
        setSource('local')
      })
  }, [data])

  return ml   // has .source field so MLPanel can show "RF model" vs "local rules"
}

// ─── useFallAlert ─────────────────────────────────────────────────────────
export function useFallAlert() {
  const [fall, setFall]   = useState(null)
  const lastFallTs        = useRef(0)

  useEffect(() => {
    const unsub = subscribeFall(val => {
      if (!val) return
      setFall(val)
      const ts = val.ts ?? 0
      if (ts !== lastFallTs.current) {
        lastFallTs.current = ts
        toast.error('🚨 FALL DETECTED on device!', {
          duration: 8000,
          style: { background: '#1a0a0f', border: '1px solid #ff3d5a', color: '#ff3d5a' },
        })
      }
    })
    return () => unsub()
  }, [])

  return fall
}