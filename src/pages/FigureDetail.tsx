import { useEffect, useState } from 'react'
import type { AmalgamationSegment, Figure, Role, ViewRole } from '../types'
import { DANCE_BPM } from '../types'
import { loadFigure } from '../data/loader'
import { localized, useI18n } from '../i18n'
import { segmentOf } from '../data/amalgamation'
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
  return <FigureDetailView figure={figure} backHref={`#/figures/${dance}`} />
}

export function FigureDetailView({ figure, backHref, segments, subtitle }: { figure: Figure; backHref: string; segments?: AmalgamationSegment[]; subtitle?: string }) {
  const { dict, locale } = useI18n()
  const [view, setView] = useState<ViewRole>('man')
  const [selectedStep, setSelectedStep] = useState<number | null>(null)

  const primaryRole: Role = view === 'lady' ? 'lady' : 'man'
  const steps = figure.parts[primaryRole].steps
  const total = totalBeats(steps)
  const anim = useAnimation(total, DANCE_BPM[figure.dance] / 60)
  // 再生終了後も最終フレームを保持して確認できるようにする（俯瞰図へは⏮で戻る）
  const animActive = anim.playing || anim.t > 0
  const parts =
    view === 'both'
      ? ([{ role: 'man', part: figure.parts.man }, { role: 'lady', part: figure.ladyInCouple ?? figure.parts.lady, couple: figure.ladyInCouple ? { man: figure.parts.man, ladyOwn: figure.parts.lady } : undefined }] as const)
      : ([{ role: primaryRole, part: figure.parts[primaryRole] }] as const)
  const selected = steps.find((s) => s.stepNo === selectedStep) ?? null

  // 歩の選択時はアニメ表示（再生中・終了後の保持を含む）を解除して、俯瞰図のフォーカス表示に戻す
  const selectStep = (n: number) => {
    if (anim.playing) anim.pause()
    if (anim.t > 0) anim.seek(0)
    setSelectedStep((cur) => (cur === n ? null : n))
  }

  return (
    <section>
      <p><a href={backHref}>← {dict.ui.back}</a></p>
      <div className="detail-header">
        <h2>{localized(figure.name, locale)}{subtitle && <span className="detail-subtitle">{subtitle}</span>}</h2>
        <RoleToggle value={view} onChange={setView} />
      </div>
      <div className="detail-grid">
        <div>
          {view === 'both' && (
            <p className="both-legend">
              <span className="legend-dot legend-man" aria-hidden="true" /> {dict.ui.man}
              <span className="legend-dot legend-lady" aria-hidden="true" /> {dict.ui.lady}
            </p>
          )}
          <FloorDiagram
            parts={[...parts]}
            selectedStep={animActive ? null : selectedStep}
            onSelectStep={selectStep}
            animTime={animActive ? anim.t : null}
            label={localized(figure.name, locale)}
          />
          <PlaybackBar anim={anim} total={total} />
        </div>
        <div className={primaryRole === 'lady' ? 'role-lady' : undefined}>
          <StepTable steps={steps} selectedStep={selectedStep} onSelect={selectStep} segments={segments} />
          {selected && (
            <StepDetailPanel
              step={selected}
              heading={segments ? segmentHeading(segments, selected.stepNo, locale) : undefined}
            />
          )}
        </div>
      </div>
    </section>
  )
}

function segmentHeading(segments: AmalgamationSegment[], stepNo: number, locale: Parameters<typeof localized>[1]): string | undefined {
  const seg = segmentOf(segments, stepNo)
  if (!seg) return undefined
  return `${localized(seg.name, locale)} ${seg.sourceSteps[0] + (stepNo - seg.from)}`
}
