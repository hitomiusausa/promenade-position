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
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const rafRef = useRef(0)

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setT((prev) => {
        const next = prev + dt * beatsPerSec * speed
        if (next >= total) {
          setPlaying(false)
          return total
        }
        return next
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, speed, beatsPerSec, total])

  return {
    t, playing, speed,
    play: () => {
      setT((prev) => (prev >= total ? 0 : prev))
      setPlaying(true)
    },
    pause: () => setPlaying(false),
    seek: (v) => setT(Math.max(0, Math.min(total, v))),
    setSpeed,
  }
}
