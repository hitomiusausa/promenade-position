import { useEffect, useState } from 'react'
import type { Figure, Role, ViewRole } from '../types'
import { DANCE_BPM } from '../types'
import { loadFigure } from '../data/loader'
import { localized, useI18n } from '../i18n'
import { totalBeats } from '../animation/interpolate'
import { useAnimation } from '../hooks/useAnimation'
import { FloorDiagram } from '../components/FloorDiagram'
import { RoleToggle } from '../components/RoleToggle'
import { PlaybackBar } from '../components/PlaybackBar'
import { StepTable } from '../components/StepTable'
import { StepDetailPanel } from '../components/StepDetailPanel'

export function FigureDetail({ dance, figureId }: { dance: string; figureId: string }) {
  const { dict } = useI18n()
  const [figure, setFigure] = useState<Figure | null>(null)
  const [error, setError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let active = true
    setError(false)
    setFigure(null)
    loadFigure(dance, figureId).then(
      (f) => active && setFigure(f),
      () => active && setError(true),
    )
    return () => { active = false }
  }, [dance, figureId, retryKey])

  if (error) {
    return (
      <p className="status">
        {dict.ui.loadError}{' '}
        <button onClick={() => setRetryKey((k) => k + 1)}>{dict.ui.retry}</button>
      </p>
    )
  }
  if (!figure) return <p className="status">{dict.ui.loading}</p>
  return <FigureDetailView figure={figure} dance={dance} />
}

function FigureDetailView({ figure, dance }: { figure: Figure; dance: string }) {
  const { dict, locale } = useI18n()
  const [view, setView] = useState<ViewRole>('man')
  const [selectedStep, setSelectedStep] = useState<number | null>(null)

  const primaryRole: Role = view === 'lady' ? 'lady' : 'man'
  const steps = figure.parts[primaryRole].steps
  const total = totalBeats(steps)
  const anim = useAnimation(total, DANCE_BPM[figure.dance] / 60)
  const animActive = anim.playing || (anim.t > 0 && anim.t < total)
  const parts =
    view === 'both'
      ? ([{ role: 'man', part: figure.parts.man }, { role: 'lady', part: figure.parts.lady }] as const)
      : ([{ role: primaryRole, part: figure.parts[primaryRole] }] as const)
  const selected = steps.find((s) => s.stepNo === selectedStep) ?? null

  return (
    <section>
      <p><a href={`#/figures/${dance}`}>← {dict.ui.back}</a></p>
      <div className="detail-header">
        <h2>{localized(figure.name, locale)}</h2>
        <RoleToggle value={view} onChange={setView} />
      </div>
      <div className="detail-grid">
        <div>
          <FloorDiagram
            parts={[...parts]}
            selectedStep={animActive ? null : selectedStep}
            onSelectStep={(n) => setSelectedStep((cur) => (cur === n ? null : n))}
            animTime={animActive ? anim.t : null}
            label={localized(figure.name, locale)}
          />
          <PlaybackBar anim={anim} total={total} />
        </div>
        <div>
          <StepTable steps={steps} selectedStep={selectedStep} onSelect={(n) => setSelectedStep((cur) => (cur === n ? null : n))} />
          {selected && <StepDetailPanel step={selected} />}
        </div>
      </div>
    </section>
  )
}
