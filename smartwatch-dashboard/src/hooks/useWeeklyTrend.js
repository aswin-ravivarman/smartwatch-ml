import { useState, useEffect } from 'react'
import { ref, query, limitToLast, get } from 'firebase/database'
import dayjs from 'dayjs'
import { db, DEVICE_ID } from '../lib/firebase'

/**
 * useWeeklyTrend()
 * Returns 7 days of daily averages: [{ day: 'Mon', hr, spo2, temp, stress }, ...]
 *
 * FIX: Uses limitToLast(2000) instead of orderByChild('ts').startAt(since)
 * because orderByChild requires a Firebase .indexOn rule for "ts" in database.rules.json.
 * Without that index, the query silently returns no data — causing the blank chart.
 * Client-side filtering by timestamp is equivalent and requires no DB rule changes.
 */
export function useWeeklyTrend() {
  const [trend,   setTrend]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const r    = ref(db, `/devices/${DEVICE_ID}/history`)
        // Fetch last 2000 records — plenty for 7 days at 15-sec intervals (≈40,320 max)
        // Avoids needing a Firebase index on "ts"
        const q    = query(r, limitToLast(2000))
        const snap = await get(q)

        if (!snap.exists()) {
          setTrend(buildEmpty())
          return
        }

        const raw   = snap.val()
        const arr   = Object.values(raw)
        const since = dayjs().subtract(7, 'day').valueOf()

        // Build day buckets for last 7 days
        const buckets = {}
        for (let i = 6; i >= 0; i--) {
          const d = dayjs().subtract(i, 'day').format('ddd')
          buckets[d] = { hr: [], spo2: [], temp: [], stress: [] }
        }

        // Filter client-side to last 7 days and bucket by day label
        arr.forEach(record => {
          if (!record.ts || record.ts < since) return
          const d = dayjs(record.ts).format('ddd')
          if (!buckets[d]) return
          if (record.heartRate   && record.heartRate > 0)   buckets[d].hr.push(record.heartRate)
          if (record.spo2        && record.spo2 > 0)        buckets[d].spo2.push(record.spo2)
          if (record.tempC       && record.tempC > 0)       buckets[d].temp.push(record.tempC)
          if (record.stressScore >= 0)                      buckets[d].stress.push(record.stressScore)
        })

        const avg = v => v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : null

        setTrend(
          Object.entries(buckets).map(([day, v]) => ({
            day,
            hr:     avg(v.hr),
            spo2:   avg(v.spo2),
            temp:   avg(v.temp),
            stress: avg(v.stress),
          }))
        )
      } catch (e) {
        console.error('useWeeklyTrend error:', e)
        setTrend(buildEmpty())
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return { trend, loading }
}

function buildEmpty() {
  return Array.from({ length: 7 }, (_, i) => ({
    day:    dayjs().subtract(6 - i, 'day').format('ddd'),
    hr:     null,
    spo2:   null,
    temp:   null,
    stress: null,
  }))
}