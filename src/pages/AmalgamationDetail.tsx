import { useEffect, useState } from 'react'
import type { CompositeFigure } from '../types'
import { loadAmalgamation } from '../data/loader'
import { localized, useI18n } from '../i18n'
import { FigureDetailView } from './FigureDetail'

export function AmalgamationDetail({ dance, amalgamationId }: { dance: string; amalgamationId: string }) {
  const { dict, locale } = useI18n()
  const [figure, setFigure] = useState<CompositeFigure | null>(null)
  const [error, setError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let active = true
    setError(false)
    setFigure(null)
    loadAmalgamation(dance, amalgamationId).then(
      (f) => active && setFigure(f),
      () => active && setError(true),
    )
    return () => { active = false }
  }, [dance, amalgamationId, retryKey])

  if (error) {
    return (
      <p className="status">
        {dict.ui.loadError}{' '}
        <button onClick={() => setRetryKey((k) => k + 1)}>{dict.ui.retry}</button>
      </p>
    )
  }
  if (!figure) return <p className="status">{dict.ui.loading}</p>
  const chain = figure.segments.map((s) => localized(s.name, locale)).join(' → ')
  return (
    <FigureDetailView
      figure={figure}
      backHref={`#/figures/${dance}`}
      segments={figure.segments}
      subtitle={`${dict.ui.amalgamation}: ${chain}`}
    />
  )
}
