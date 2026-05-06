// ── EmailJS configuration ─────────────────────────────────────────────────────
// Get these from https://www.emailjs.com → Email Services → your service
export const EMAILJS_CONFIG = {
  serviceId:  import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  publicKey:  import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
}

// ── Default emergency contact (shown in Settings before user fills it in) ─────
export const DEFAULT_EMERGENCY = {
  name:  'Aswin',
  email: '2k22ece056@kiot.ac.in',
}