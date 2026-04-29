// ─────────────────────────────────────────────────────────────────
//  FILL IN your Firebase project values below
//  Firebase Console → Project Settings → Your apps → SDK setup
// ─────────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, query, limitToLast } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyA7yPWOpYF_bQ581mL4t914Ijg50q7somI",
  authDomain: "smartwatch-with-ml.firebaseapp.com",
  projectId: "smartwatch-with-ml",
  storageBucket: "smartwatch-with-ml.firebasestorage.app",
  messagingSenderId: "986493854009",
  appId: "1:986493854009:web:963ecc573c919f706b88e8",
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
