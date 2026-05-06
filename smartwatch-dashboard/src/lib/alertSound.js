let ctx = null
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  return ctx
}

function beep({ freq = 880, duration = 0.2, type = 'sine', gain = 0.4, delay = 0 } = {}) {
  try {
    const ac  = getCtx()
    const osc = ac.createOscillator()
    const gn  = ac.createGain()
    osc.connect(gn)
    gn.connect(ac.destination)
    osc.type      = type
    osc.frequency.value = freq
    gn.gain.setValueAtTime(0, ac.currentTime + delay)
    gn.gain.linearRampToValueAtTime(gain, ac.currentTime + delay + 0.01)
    gn.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration)
    osc.start(ac.currentTime + delay)
    osc.stop(ac.currentTime + delay + duration + 0.05)
  } catch {}
}

/** 3 urgent high-pitched beeps — for fall or critical alert */
export function alertFall() {
  beep({ freq: 1100, duration: 0.18, type: 'square', gain: 0.5, delay: 0    })
  beep({ freq: 1100, duration: 0.18, type: 'square', gain: 0.5, delay: 0.25 })
  beep({ freq: 1100, duration: 0.18, type: 'square', gain: 0.5, delay: 0.50 })
}

/** Single mid-tone warning — elevated HR, low SpO₂ */
export function alertWarning() {
  beep({ freq: 660, duration: 0.3, type: 'sine', gain: 0.35, delay: 0    })
  beep({ freq: 660, duration: 0.3, type: 'sine', gain: 0.35, delay: 0.4  })
}

/** Gentle double-beep — metric crossing threshold */
export function alertMild() {
  beep({ freq: 440, duration: 0.15, type: 'sine', gain: 0.25, delay: 0    })
  beep({ freq: 520, duration: 0.15, type: 'sine', gain: 0.25, delay: 0.2  })
}