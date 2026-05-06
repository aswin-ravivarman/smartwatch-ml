import { useState, useRef, useCallback } from 'react'
import { ref, query, orderByKey, limitToLast, get } from 'firebase/database'
import { db, DEVICE_ID } from '../lib/firebase'

const CACHE_TTL_MS = 60_000   // 60 seconds

/**
 * useFullHistory(limit)
 * PERF FIX: Caches fetched results for 60 seconds.
 * On modal re-open within 60 s, returns cached data instantly — no Firebase roundtrip.
 */
export function useFullHistory(limit = 500) {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(false)

  // Cache stored in a ref so it survives re-renders but doesn't cause them
  const cacheRef = useRef({ data: null, ts: 0 })

  const fetchHistory = useCallback(async () => {
    // If cache is still fresh, skip the fetch
    const now = Date.now()
    if (cacheRef.current.data && now - cacheRef.current.ts < CACHE_TTL_MS) {
      setData(cacheRef.current.data)
      return
    }

    setLoading(true)
    try {
      const r    = ref(db, `/devices/${DEVICE_ID}/history`)
      const q    = query(r, orderByKey(), limitToLast(limit))
      const snap = await get(q)
      if (snap.exists()) {
        const raw = snap.val()
        const arr = Object.entries(raw)
          .map(([k, v]) => ({ ...v, _key: k }))
          .sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0))
        cacheRef.current = { data: arr, ts: Date.now() }
        setData(arr)
      }
    } catch (e) {
      console.error('useFullHistory error:', e)
    } finally {
      setLoading(false)
    }
  }, [limit])

  return { data, loading, fetchHistory }
}