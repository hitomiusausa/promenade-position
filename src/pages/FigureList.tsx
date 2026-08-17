import { useEffect, useState } from 'react'
import type { Amalgamation, DanceId, FigureIndexEntry } from '../types'
import { loadAmalgamations, loadFigureIndex } from '../data/loader'
import { localized, useI18n } from '../i18n'
import { navigate } from '../router'

export function FigureList({ dance }: { dance: string }) {
  const { dict, locale } = useI18n()
  const [figures, setFigures] = useState<FigureIndexEntry[] | null>(null)
  const [amals, setAmals] = useState<Amalgamation[]>([])
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
    // アマルガメーションは無くてもページは成立する（他種目には未整備）
    loadAmalgamations(dance).then(
      (a) => active && setAmals(a),
      () => active && setAmals([]),
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
              <span className="card-title">
                {localized(f.name, locale)}
                {localized(f.name, locale) !== f.name.en && <span className="card-subtitle">{f.name.en}</span>}
              </span>
              <span className="badge">{dict.level[f.level]} / {f.stepCount}{dict.ui.steps}</span>
            </button>
          </li>
        ))}
      </ul>
      {amals.length > 0 && (
        <>
          <h2 className="section-title">{dict.ui.amalgamations}</h2>
          <p className="section-desc">{dict.ui.amalgamationsDesc}</p>
          <ul className="card-list">
            {amals.map((a) => {
              const chain = a.figures.map((f) => {
                const name = figures.find((x) => x.id === f.figure)?.name
                const label = name ? localized(name, locale) : f.figure
                return f.steps ? `${label}(${f.steps[0]}-${f.steps[1]})` : label
              }).join(' → ')
              return (
                <li key={a.id}>
                  <button className="card-button" onClick={() => navigate(`/amalgamation/${dance}/${a.id}`)}>
                    <span className="card-title">
                      {localized(a.name, locale)}
                      <span className="card-subtitle">{chain}</span>
                    </span>
                    <span className="badge">{a.figures.length}{dict.ui.figuresUnit}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
