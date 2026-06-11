import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LocaleProvider } from '../i18n'
import { StepTable } from './StepTable'
import { StepDetailPanel } from './StepDetailPanel'
import type { FigureStep } from '../types'

const step: FigureStep = {
  stepNo: 2, foot: 'L', stepDescription: { move: 'side' }, count: '2', beats: 1,
  footwork: 'T', alignment: { relation: 'backing', direction: 'DC' },
  amountOfTurn: { direction: 'right', amount: '1/4', between: [1, 2] },
  riseAndFall: 'continue_rise', sway: 'R', cbm: false,
  position: { x: 0, y: 0, angle: 315 },
}

describe('StepTable', () => {
  it('チップクリックで onSelect が呼ばれる', () => {
    const onSelect = vi.fn()
    render(
      <LocaleProvider>
        <StepTable steps={[step]} selectedStep={null} onSelect={onSelect} />
      </LocaleProvider>,
    )
    fireEvent.click(document.querySelector('.step-chips button')!)
    expect(onSelect).toHaveBeenCalledWith(2)
  })
  it('表の行はキーボードでも選択できる', () => {
    const onSelect = vi.fn()
    render(
      <LocaleProvider>
        <StepTable steps={[step]} selectedStep={null} onSelect={onSelect} />
      </LocaleProvider>,
    )
    const row = document.querySelector('.step-table tbody tr')!
    fireEvent.keyDown(row, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith(2)
  })
})

describe('StepDetailPanel', () => {
  it('ISTD項目をフォーマットして表示する', () => {
    render(
      <LocaleProvider>
        <StepDetailPanel step={step} />
      </LocaleProvider>,
    )
    expect(screen.getByText('中央斜めに背面して')).toBeInTheDocument()
    expect(screen.getByText('右へ1/4（1-2歩間）')).toBeInTheDocument()
    // 見出しは「歩 2 — 左足横へ」のように合成されるので部分一致で
    expect(screen.getByText(/左足横へ/)).toBeInTheDocument()
  })
})
