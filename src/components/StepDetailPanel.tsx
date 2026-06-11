import type { FigureStep } from '../types'
import { formatAlignment, formatFootwork, formatStepDescription, formatTurn, localized, useI18n } from '../i18n'

export function StepDetailPanel({ step }: { step: FigureStep }) {
  const { dict, locale } = useI18n()
  const rows: Array<[string, string, string]> = [
    ['count', dict.ui.count, step.count],
    ['footwork', dict.ui.footwork, formatFootwork(step.footwork, dict)],
    ['alignment', dict.ui.alignment, formatAlignment(step.alignment, dict)],
    ['amountOfTurn', dict.ui.amountOfTurn, formatTurn(step.amountOfTurn, dict)],
    ['riseAndFall', dict.ui.riseAndFall, dict.riseFall[step.riseAndFall]],
    ['sway', dict.ui.sway, dict.sway[step.sway]],
    ['cbm', dict.ui.cbm, step.cbm ? dict.ui.yes : dict.ui.no],
  ]
  const note = step.note ? localized(step.note, locale) : ''
  return (
    <div className="step-detail">
      <h3>
        {dict.ui.step} {step.stepNo} — {formatStepDescription(step.foot, step.stepDescription, dict)}
      </h3>
      <dl>
        {rows.map(([id, k, v]) => (
          <div key={id} className="detail-row">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
        {note && (
          <div className="detail-row">
            <dt>{dict.ui.note}</dt>
            <dd>{note}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
