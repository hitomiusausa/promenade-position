import type { FigureStep } from '../types'
import { formatAlignment, formatStepDescription, formatTurn, useI18n } from '../i18n'

export interface StepTableProps {
  steps: FigureStep[]
  selectedStep: number | null
  onSelect: (stepNo: number) => void
}

export function StepTable({ steps, selectedStep, onSelect }: StepTableProps) {
  const { dict } = useI18n()
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
            <tr
              key={s.stepNo}
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
              <td className={`fw fw-${s.footwork}`}>{s.footwork === 'flat' || s.footwork === 'none' ? '—' : s.footwork}</td>
              <td>{formatAlignment(s.alignment, dict)}</td>
              <td>{formatTurn(s.amountOfTurn, dict)}</td>
              <td>{dict.riseFall[s.riseAndFall]}</td>
              <td>{dict.sway[s.sway]}</td>
              <td>{s.cbm ? dict.ui.yes : dict.ui.no}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
