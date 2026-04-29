const functions = require('firebase-functions')
const admin     = require('firebase-admin')
const axios     = require('axios')

admin.initializeApp()
const db = admin.database()

// ── FILL IN your ML backend URL here ──────────────────────────────
// Render.com / Railway free tier URL after deploying ml-backend/
const ML_ENDPOINT = 'https://YOUR-ML-BACKEND.onrender.com/predict'

// Trigger: fires every time /devices/{deviceId}/latest is written
exports.runMLPrediction = functions
  .database.ref('/devices/{deviceId}/latest')
  .onWrite(async (change, context) => {
    const deviceId = context.params.deviceId
    const data = change.after.val()
    if (!data) return null

    const features = {
      heartRate:    data.heartRate    ?? 0,
      spo2:         data.spo2         ?? 97,
      tempC:        data.tempC        ?? 36.5,
      stressScore:  data.stressScore  ?? 50,
      totalAccel:   data.totalAccel   ?? 1.0,
      fallDetected: data.fallDetected ? 1 : 0,
    }

    functions.logger.info(`[ML] Predicting for ${deviceId}`, features)

    try {
      const response = await axios.post(ML_ENDPOINT, features, {
        timeout: 8000,
        headers: { 'Content-Type': 'application/json' },
      })
      const result = response.data

      await db.ref(`/devices/${deviceId}/mlResult`).set({
        disease:    result.disease    ?? 'Unknown',
        confidence: result.confidence ?? 0,
        riskLevel:  result.risk_level ?? 'normal',
        ts:         Date.now(),
      })

      functions.logger.info(`[ML] Written: ${result.disease}`)

      // FCM push notification on high risk
      if (result.risk_level === 'high') {
        const tokenSnap = await db.ref(`/devices/${deviceId}/fcmToken`).get()
        if (tokenSnap.exists()) {
          await admin.messaging().send({
            token: tokenSnap.val(),
            notification: {
              title: '⚠️ Health Alert',
              body: `${result.disease} detected (${result.confidence?.toFixed(1)}% confidence)`,
            },
          })
        }
      }
    } catch (err) {
      functions.logger.error('[ML] Failed:', err.message)
      await db.ref(`/devices/${deviceId}/mlResult`).set({
        disease: 'Service error', confidence: 0, riskLevel: 'unknown', ts: Date.now(),
      })
    }

    return null
  })

// Trigger: fall detected → push notification
exports.fallAlert = functions
  .database.ref('/devices/{deviceId}/latest/fallDetected')
  .onWrite(async (change, context) => {
    if (!change.after.val()) return null
    const deviceId = context.params.deviceId
    functions.logger.warn(`[FALL] Alert for ${deviceId}`)

    const tokenSnap = await db.ref(`/devices/${deviceId}/fcmToken`).get()
    if (!tokenSnap.exists()) return null

    await admin.messaging().send({
      token: tokenSnap.val(),
      notification: { title: '🚨 Fall Detected', body: 'A fall was detected on your smartwatch!' },
      android: { priority: 'high' },
    })
    return null
  })
