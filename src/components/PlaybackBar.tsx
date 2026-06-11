import type { Animation } from '../hooks/useAnimation'
import { useI18n } from '../i18n'

const SPEEDS = [0.5, 1, 2]

export function PlaybackBar({ anim, total }: { anim: Animation; total: number }) {
  const { dict } = useI18n()
  return (
    <div className="playback-bar">
      <button
        className="play-button"
        aria-label={anim.playing ? dict.ui.pause : dict.ui.play}
        onClick={anim.playing ? anim.pause : anim.play}
      >
        {anim.playing ? '⏸' : '▶'}
      </button>
      <input
        type="range"
        min={0}
        max={total}
        step={0.01}
        value={anim.t}
        aria-label={dict.ui.playbackPosition}
        onChange={(e) => anim.seek(Number(e.target.value))}
      />
      <span className="speeds">
        {SPEEDS.map((s) => (
          <button key={s} aria-pressed={anim.speed === s} className={anim.speed === s ? 'active' : ''} onClick={() => anim.setSpeed(s)}>
            {s}x
          </button>
        ))}
      </span>
    </div>
  )
}
