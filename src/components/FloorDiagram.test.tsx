import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FloorDiagram } from './FloorDiagram'
import type { FigurePart, FigureStep } from '../types'

function makeStep(stepNo: number, foot: 'L' | 'R', x: number): FigureStep {
  return {
    stepNo, foot, stepDescription: { move: 'forward' }, count: String(stepNo), beats: 1,
    footwork: 'HT', alignment: { relation: 'facing', direction: 'LOD' },
    amountOfTurn: { direction: 'none', amount: '0' }, riseAndFall: 'no_rise_fall',
    sway: 'straight', cbm: false, position: { x, y: 0, angle: 90 },
  }
}

const part: FigurePart = {
  startPositions: { L: { x: 0, y: 0, angle: 90 }, R: { x: 10, y: 0, angle: 90 } },
  steps: [makeStep(1, 'R', 30), makeStep(2, 'L', 50), makeStep(3, 'R', 70)],
}

describe('FloorDiagram', () => {
  it('静止表示: 開始位置2足＋歩数ぶんの足を描画する', () => {
    render(<FloorDiagram parts={[{ role: 'man', part }]} selectedStep={null} onSelectStep={() => {}} animTime={null} />)
    // 開始位置 L/R (ghost) + steps 3 = 5
    expect(screen.getAllByTestId(/^foot-/)).toHaveLength(5)
  })
  it('歩をクリックすると onSelectStep が呼ばれる', () => {
    const onSelect = vi.fn()
    render(<FloorDiagram parts={[{ role: 'man', part }]} selectedStep={null} onSelectStep={onSelect} animTime={null} />)
    fireEvent.click(screen.getByText('2'))
    expect(onSelect).toHaveBeenCalledWith(2)
  })
  it('アニメ中は役割ごとに2足だけ描画する', () => {
    render(<FloorDiagram parts={[{ role: 'man', part }]} selectedStep={null} onSelectStep={() => {}} animTime={0.5} />)
    expect(screen.getAllByTestId(/^foot-/)).toHaveLength(2)
  })
  it('選択中の歩に体の向き矢印を表示する', () => {
    render(<FloorDiagram parts={[{ role: 'man', part }]} selectedStep={2} onSelectStep={() => {}} animTime={null} />)
    expect(screen.getByTestId('body-direction')).toBeInTheDocument()
  })
  it('both表示: 2役割で10足を描画し、女性側が淡色になる', () => {
    render(
      <FloorDiagram
        parts={[{ role: 'man', part }, { role: 'lady', part }]}
        selectedStep={null}
        onSelectStep={() => {}}
        animTime={null}
      />,
    )
    expect(screen.getAllByTestId(/^foot-/)).toHaveLength(10)
    const groups = document.querySelectorAll('svg > g[opacity]')
    const opacities = Array.from(groups).map((g) => g.getAttribute('opacity'))
    expect(opacities).toContain('0.55')
  })
  it('総拍数を超えたanimTimeでも落ちない（全足フラット）', () => {
    render(<FloorDiagram parts={[{ role: 'man', part }]} selectedStep={null} onSelectStep={() => {}} animTime={999} />)
    expect(screen.getAllByTestId(/^foot-/)).toHaveLength(2)
  })
  it('partsが空でも不正なviewBoxにならない', () => {
    render(<FloorDiagram parts={[]} selectedStep={null} onSelectStep={() => {}} animTime={null} />)
    const svg = document.querySelector('svg.floor-diagram')!
    expect(svg.getAttribute('viewBox')).toBe('-45 -45 90 90')
  })
})
