import { useEffect, useState } from 'react'
import type { DanceId, FigureIndexEntry } from '../types'
import { loadFigureIndex } from '../data/loader'
import { localized, useI18n } from '../i18n'
import { navigate } from '../router'

export function FigureList({ dance }: { dance: string }) {
  const { dict, locale } = useI18n()
  const [figures, setFigures] = useState<FigureIndexEntry[] | null>(null)
  const [error, setError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let active = true
    setError(false)
    setFigures(null)
    loadFigureIndex(dance).then(
      (f) => active && setFigures(f),
      () => active && setError(true),
    )
    return () => { active = false }
  }, [dance, retryKey])

  if (error) {
    return (
      <p className="status">
        {dict.ui.loadError}{' '}
        <button onClick={() => setRetryKey((k) => k + 1)}>{dict.ui.retry}</button>
      </p>
    )
  }
  if (!figures) return <p className="status">{dict.ui.loading}</p>

  return (
    <section>
      <p><a href="#/">← {dict.ui.back}</a></p>
      <h2>{dict.dance[dance as DanceId] ?? dance} — {dict.ui.figureList}</h2>
      <ul className="card-list">
        {figures.map((f) => (
          <li key={f.id}>
            <button className="card-button" onClick={() => navigate(`/figure/${dance}/${f.id}`)}>
              <span className="card-title">{localized(f.name, locale)}</span>
              <span className="badge">{dict.level[f.level]} / {f.stepCount}{dict.ui.steps}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
