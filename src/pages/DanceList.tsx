import { useEffect, useState } from 'react'
import type { DanceInfo } from '../types'
import { loadDances } from '../data/loader'
import { localized, useI18n } from '../i18n'
import { navigate } from '../router'

export function DanceList() {
  const { dict, locale } = useI18n()
  const [dances, setDances] = useState<DanceInfo[] | null>(null)
  const [error, setError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let active = true
    setError(false)
    loadDances().then(
      (d) => active && setDances(d),
      () => active && setError(true),
    )
    return () => { active = false }
  }, [retryKey])

  if (error) {
    return (
      <p className="status">
        {dict.ui.loadError}{' '}
        <button onClick={() => setRetryKey((k) => k + 1)}>{dict.ui.retry}</button>
      </p>
    )
  }
  if (!dances) return <p className="status">{dict.ui.loading}</p>

  return (
    <section>
      <h2>{dict.ui.selectDance}</h2>
      <ul className="card-list">
        {dances.map((d) => (
          <li key={d.id}>
            <button
              className="card-button"
              disabled={!d.available}
              onClick={() => navigate(`/figures/${d.id}`)}
            >
              <span className="card-title">{localized(d.name, locale)}</span>
              {!d.available && <span className="badge">{dict.ui.comingSoon}</span>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
