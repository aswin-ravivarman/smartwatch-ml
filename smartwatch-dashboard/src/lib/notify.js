import emailjs from '@emailjs/browser'
import { EMAILJS_CONFIG } from '../config/emergency'

/**
 * loadContact() — reads emergency config from localStorage
 */
export function loadContact() {
  try {
    const raw = localStorage.getItem('hm_emergency')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

/**
 * saveContact(cfg) — persists to localStorage
 */
export function saveContact(cfg) {
  localStorage.setItem('hm_emergency', JSON.stringify(cfg))
}

/**
 * notifyFall({ accel, hr, spo2, temp }) — sends email alert only
 * Returns array of { channel, status: 'sent'|'failed'|'skipped', reason? }
 */
export async function notifyFall(vitals) {
  const contact = loadContact()
  if (!contact?.name) return [{ channel: 'email', status: 'skipped', reason: 'No contact configured' }]

  const { name, email } = contact
  const { accel = 0, hr = 0, spo2 = 0, temp = 0 } = vitals
  const time = new Date().toLocaleTimeString()
  const msg  = `🚨 FALL DETECTED on HealthMonitor!\nContact: ${name}\nTime: ${time}\nImpact: ${accel.toFixed(2)}g | HR: ${hr} bpm | SpO₂: ${spo2}% | Temp: ${temp}°C\nPlease check on them immediately.`

  if (!email) {
    return [{ channel: 'email', status: 'skipped', reason: 'No email address configured' }]
  }

  try {
    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      {
        to_name:     name,
        to_email:    email,
        fall_time:   time,
        impact:      `${accel.toFixed(2)}g`,
        heart_rate:  `${hr} bpm`,
        spo2:        `${spo2}%`,
        temperature: `${temp}°C`,
        message:     msg,
      },
      EMAILJS_CONFIG.publicKey
    )
    return [{ channel: 'email', status: 'sent' }]
  } catch (e) {
    return [{ channel: 'email', status: 'failed', reason: e.message }]
  }
}