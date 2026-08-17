import { Fragment } from 'react'
import type { AmalgamationSegment, FigureStep } from '../types'
import { formatAlignment, formatStepDescription, formatTurn, localized, useI18n } from '../i18n'

export interface StepTableProps {
  steps: FigureStep[]
  selectedStep: number | null
  onSelect: (stepNo: number) => void
  /** アマルガメーションのフィガー境界（見出し行を挿入する） */
  segments?: AmalgamationSegment[]
}

export function StepTable({ steps, selectedStep, onSelect, segments }: StepTableProps) {
  const { dict, locale } = useI18n()
  const headerFor = (stepNo: number) => segments?.find((s) => s.from === stepNo)
  return (
    <>
      {/* スマホ: 歩番号チップ */}
      <div className="step-chips">
        {steps.map((s) => (
          <button
            key={s.stepNo}
            className={selectedStep === s.stepNo ? 'chip active' : 'chip'}
            aria-pressed={selectedStep === s.stepNo}
            onClick={() => onSelect(s.stepNo)}
          >
            {s.stepNo}
          </button>
        ))}
      </div>
      {/* PC: ISTD表 */}
      <table className="step-table">
        <thead>
          <tr>
            <th>{dict.ui.step}</th>
            <th>{dict.ui.footColumn}</th>
            <th>{dict.ui.count}</th>
            <th>FW</th>
            <th>{dict.ui.alignment}</th>
            <th>{dict.ui.amountOfTurn}</th>
            <th>{dict.ui.riseAndFall}</th>
            <th>{dict.ui.sway}</th>
            <th>{dict.ui.cbm}</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((s) => (
            <Fragment key={s.stepNo}>
            {headerFor(s.stepNo) && (
              <tr className="segment-row">
                <th colSpan={9} scope="rowgroup">
                  ▶ {localized(headerFor(s.stepNo)!.name, locale)}
                  {(() => { const h = headerFor(s.stepNo)!; return h.sourceSteps[1] - h.sourceSteps[0] + 1 !== h.to - h.from + 1 || h.sourceSteps[0] !== 1 ? ` (${h.sourceSteps[0]}-${h.sourceSteps[1]})` : '' })()}
                  {headerFor(s.stepNo)!.note && <span className="segment-note"> — {localized(headerFor(s.stepNo)!.note!, locale)}</span>}
                </th>
              </tr>
            )}
            <tr
              role="button"
              tabIndex={0}
              className={selectedStep === s.stepNo ? 'selected' : ''}
              onClick={() => onSelect(s.stepNo)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(s.stepNo)
                }
              }}
            >
              <td>{s.stepNo}</td>
              <td>{formatStepDescription(s.foot, s.stepDescription, dict)}</td>
              <td>{s.count}</td>
              <td className={`fw fw-${s.footwork}`}>{s.footwork === 'none' ? '—' : /^[HT]+$/.test(s.footwork) ? s.footwork : dict.footwork[s.footwork]}</td>
              <td>{formatAlignment(s.alignment, dict)}</td>
              <td>{formatTurn(s.amountOfTurn, dict)}</td>
              <td>{dict.riseFall[s.riseAndFall]}</td>
              <td>{dict.sway[s.sway]}</td>
              <td>{s.cbm ? dict.ui.yes : dict.ui.no}</td>
            </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </>
  )
}
