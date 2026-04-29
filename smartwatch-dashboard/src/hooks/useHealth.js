import { useState, useEffect, useRef } from 'react'
import { subscribeLatest, subscribeHistory, subscribeFall } from '../lib/firebase'
import toast from 'react-hot-toast'

const ML_ENDPOINT = 'https://smartwatch-ml.onrender.com/predict'

export function useLatest() {
  const [data, setData] = useState(null)
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

export function useHistory(n = 40) {
  const [history, setHistory] = useState([])
  useEffect(() => {
    const unsub = subscribeHistory(n, setHistory)
    return () => unsub()
  }, [n])
  return history
}

// ML runs directly from browser — no Firebase Functions needed
export function useML(data) {
  const [ml, setML] = useState(null)
  const prevDisease = useRef(null)
  const lastCall = useRef(0)

  useEffect(() => {
    if (!data) return
    if (!data.heartRate || !data.spo2) return

    // Only call ML every 15 seconds
    const now = Date.now()
    if (now - lastCall.current < 15000) return
    lastCall.current = now

    const features = {
      heartRate:    data.heartRate    ?? 0,
      spo2:         data.spo2         ?? 97,
      tempC:        data.tempC        ?? 36.5,
      stressScore:  data.stressScore  ?? 50,
      totalAccel:   data.totalAccel   ?? 1.0,
      fallDetected: data.fallDetected ? 1 : 0,
    }

    fetch(ML_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features),
    })
      .then(r => r.json())
      .then(result => {
        const mlData = {
          disease:    result.disease,
          confidence: result.confidence,
          riskLevel:  result.risk_level,
          ts:         Date.now(),
        }
        setML(mlData)

        // Toast notification on disease change
        if (result.disease !== prevDisease.current && result.disease !== 'Normal') {
          if (result.risk_level === 'high') {
            toast.error(`⚠️ ${result.disease} detected (${result.confidence?.toFixed(1)}%)`, { duration: 6000 })
          } else {
            toast(`${result.disease} (${result.confidence?.toFixed(1)}%)`, { duration: 4000 })
          }
          prevDisease.current = result.disease
        }
      })
      .catch(err => {
        console.error('[ML] Fetch failed:', err)
        toast.error('ML service unreachable', { duration: 3000 })
      })
  }, [data])

  return ml
}

export function useFallAlert() {
  const [fall, setFall] = useState(null)
  const lastFallTs = useRef(0)
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