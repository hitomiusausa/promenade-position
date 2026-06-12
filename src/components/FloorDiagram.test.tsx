import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FloorDiagram } from './FloorDiagram'
import { WEIGHT_COLORS, WEIGHT_COLORS_LADY } from './footworkColors'
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
  it('歩を選択すると他の歩の足が薄くなる（選択歩はフル色）', () => {
    render(<FloorDiagram parts={[{ role: 'man', part }]} selectedStep={2} onSelectStep={() => {}} animTime={null} />)
    const feet = screen.getAllByTestId(/^foot-/)
    const opacities = feet.map((f) => f.getAttribute('opacity'))
    // 開始位置ゴースト2足(0.3) + 非選択歩2足(0.25) + 選択歩1足(1)
    expect(opacities.filter((o) => o === '0.25')).toHaveLength(2)
    expect(opacities.filter((o) => o === '1')).toHaveLength(1)
  })
  it('未選択時はすべての歩がフル色', () => {
    render(<FloorDiagram parts={[{ role: 'man', part }]} selectedStep={null} onSelectStep={() => {}} animTime={null} />)
    const opacities = screen.getAllByTestId(/^foot-/).map((f) => f.getAttribute('opacity'))
    expect(opacities.filter((o) => o === '1')).toHaveLength(3)
    expect(opacities.filter((o) => o === '0.25')).toHaveLength(0)
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
    // 女性側は対比色パレットの塗り、男性側は通常パレットの塗りで区別される
    const fills = Array.from(document.querySelectorAll('svg path')).map((p) => p.getAttribute('fill'))
    expect(fills).toContain(WEIGHT_COLORS.toe)
    expect(fills).toContain(WEIGHT_COLORS_LADY.toe)
  })
  it('女性ビュー単体でも女性パレットで描画する', () => {
    render(<FloorDiagram parts={[{ role: 'lady', part }]} selectedStep={null} onSelectStep={() => {}} animTime={null} />)
    const fills = Array.from(document.querySelectorAll('svg path')).map((p) => p.getAttribute('fill'))
    expect(fills).toContain(WEIGHT_COLORS_LADY.toe)
    expect(fills).not.toContain(WEIGHT_COLORS.toe)
  })
  it('アニメ開始直後の未着地の足は点線（フラット色は使わない）', () => {
    render(<FloorDiagram parts={[{ role: 'lady', part }]} selectedStep={null} onSelectStep={() => {}} animTime={0.5} />)
    const paths = Array.from(document.querySelectorAll('svg path'))
    expect(paths.map((p) => p.getAttribute('fill'))).not.toContain(WEIGHT_COLORS_LADY.flat)
    expect(paths.map((p) => p.getAttribute('stroke-dasharray'))).toContain('4 3')
  })
  it('アニメ中の着地済みの足は直近の歩のフットワーク色になる', () => {
    // t=1.5: 第1歩(R, HT)着地済み → 女性パレットのトー＋ヒール色が出る
    render(<FloorDiagram parts={[{ role: 'lady', part }]} selectedStep={null} onSelectStep={() => {}} animTime={1.5} />)
    const fills = Array.from(document.querySelectorAll('svg path')).map((p) => p.getAttribute('fill'))
    expect(fills).toContain(WEIGHT_COLORS_LADY.toe)
    expect(fills).toContain(WEIGHT_COLORS_LADY.heel)
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
