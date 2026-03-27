let audio: AudioContext | null = null

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audio) {
    try {
      audio = new AudioContext()
    } catch {
      return null
    }
  }
  return audio
}

function beep(freq: number, duration: number, type: OscillatorType = 'square', gain = 0.06): void {
  const c = ctx()
  if (!c || c.state === 'suspended') {
    void c?.resume()
  }
  if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.value = gain
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
  o.connect(g)
  g.connect(c.destination)
  o.start()
  o.stop(c.currentTime + duration + 0.02)
}

export function resumeAudio(): void {
  void ctx()?.resume()
}

export function playShoot(): void {
  beep(680, 0.045, 'square', 0.05)
}

export function playThrust(): void {
  beep(110, 0.028, 'sawtooth', 0.018)
}

export function playExplosion(): void {
  const c = ctx()
  if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'sawtooth'
  o.frequency.setValueAtTime(220, c.currentTime)
  o.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.2)
  g.gain.value = 0.08
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22)
  o.connect(g)
  g.connect(c.destination)
  o.start()
  o.stop(c.currentTime + 0.25)
}

export function playShieldHit(): void {
  beep(400, 0.06, 'square', 0.035)
}

export function playRingHit(): void {
  beep(520, 0.04, 'triangle', 0.045)
}

export function playCoreHit(): void {
  beep(200, 0.08, 'sine', 0.055)
}

export function playCastleClear(): void {
  beep(440, 0.07, 'square', 0.05)
  beep(660, 0.09, 'square', 0.045)
}

/** Big moment when the castle core is destroyed */
export function playCoreDestroyed(): void {
  const c = ctx()
  if (!c) return
  void c.resume()

  const t0 = c.currentTime
  const boom = c.createOscillator()
  const bg = c.createGain()
  boom.type = 'sawtooth'
  boom.frequency.setValueAtTime(95, t0)
  boom.frequency.exponentialRampToValueAtTime(28, t0 + 0.55)
  bg.gain.setValueAtTime(0.11, t0)
  bg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.62)
  boom.connect(bg)
  bg.connect(c.destination)
  boom.start(t0)
  boom.stop(t0 + 0.65)

  const t1 = t0 + 0.04
  const s = c.createOscillator()
  const sg = c.createGain()
  s.type = 'square'
  s.frequency.setValueAtTime(880, t1)
  s.frequency.exponentialRampToValueAtTime(120, t1 + 0.18)
  sg.gain.setValueAtTime(0.045, t1)
  sg.gain.exponentialRampToValueAtTime(0.001, t1 + 0.22)
  s.connect(sg)
  sg.connect(c.destination)
  s.start(t1)
  s.stop(t1 + 0.24)

  const t2 = t0 + 0.14
  const s2 = c.createOscillator()
  const s2g = c.createGain()
  s2.type = 'triangle'
  s2.frequency.setValueAtTime(1320, t2)
  s2.frequency.linearRampToValueAtTime(220, t2 + 0.35)
  s2g.gain.setValueAtTime(0.038, t2)
  s2g.gain.exponentialRampToValueAtTime(0.001, t2 + 0.42)
  s2.connect(s2g)
  s2g.connect(c.destination)
  s2.start(t2)
  s2.stop(t2 + 0.45)
}

export function playMineSpawn(): void {
  beep(300, 0.06, 'triangle', 0.03)
}
