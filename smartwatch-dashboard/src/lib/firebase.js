// ─────────────────────────────────────────────────────────────────
//  FILL IN your Firebase project values below
//  Firebase Console → Project Settings → Your apps → SDK setup
// ─────────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, query, limitToLast } from 'firebase/database'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)

export const DEVICE_ID = 'watch_01'

export function subscribeLatest(callback) {
  const r = ref(db, `/devices/${DEVICE_ID}/latest`)
  return onValue(r, snap => callback(snap.val()))
}

export function subscribeHistory(n = 40, callback) {
  const r = query(ref(db, `/devices/${DEVICE_ID}/history`), limitToLast(n))
  return onValue(r, snap => {
    const raw = snap.val()
    if (!raw) return callback([])
    const arr = Object.values(raw).sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0))
    callback(arr)
  })
}

export function subscribeML(callback) {
  const r = ref(db, `/devices/${DEVICE_ID}/mlResult`)
  return onValue(r, snap => callback(snap.val()))
}

export function subscribeFall(callback) {
  const r = ref(db, `/devices/${DEVICE_ID}/alerts/fall`)
  return onValue(r, snap => callback(snap.val()))
}
