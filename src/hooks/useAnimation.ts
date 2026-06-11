import { useEffect, useRef, useState } from 'react'

export interface Animation {
  t: number
  playing: boolean
  speed: number
  play: () => void
  pause: () => void
  seek: (t: number) => void
  setSpeed: (s: number) => void
}

export function useAnimation(total: number, beatsPerSec: number): Animation {
  const [t, setTState] = useState(0)
  const tRef = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const rafRef = useRef(0)

  const setT = (v: number) => {
    tRef.current = v
    setTState(v)
  }

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      const next = tRef.current + dt * beatsPerSec * speed
      if (next >= total) {
        setT(total)
        setPlaying(false)
        return
      }
      setT(next)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, speed, beatsPerSec, total])

  return {
    t, playing, speed,
    play: () => {
      if (tRef.current >= total) setT(0)
      setPlaying(true)
    },
    pause: () => setPlaying(false),
    seek: (v) => setT(Math.max(0, Math.min(total, v))),
    setSpeed,
  }
}
