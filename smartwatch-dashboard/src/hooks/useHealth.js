import { useState, useEffect, useRef } from 'react'
import { subscribeLatest, subscribeHistory, subscribeML, subscribeFall } from '../lib/firebase'
import toast from 'react-hot-toast'

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

export function useML() {
  const [ml, setML] = useState(null)
  const prevDisease = useRef(null)
  useEffect(() => {
    const unsub = subscribeML(val => {
      if (!val) return
      setML(val)
      if (val.disease && val.disease !== prevDisease.current && val.disease !== 'Normal') {
        if (val.riskLevel === 'high') {
          toast.error(`⚠️ ${val.disease} detected (${val.confidence?.toFixed(1)}%)`, { duration: 6000 })
        } else {
          toast(`${val.disease} (${val.confidence?.toFixed(1)}%)`, { duration: 4000 })
        }
        prevDisease.current = val.disease
      }
    })
    return () => unsub()
  }, [])
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
