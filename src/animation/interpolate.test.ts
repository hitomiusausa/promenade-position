import { describe, it, expect } from 'vitest'
import { feetAt, totalBeats, lerpAngle } from './interpolate'
import type { FigurePart, FigureStep } from '../types'

function makeStep(stepNo: number, foot: 'L' | 'R', x: number, y: number, angle: number, beats = 1): FigureStep {
  return {
    stepNo, foot, stepDescription: { move: 'forward' }, count: String(stepNo), beats,
    footwork: 'HT', alignment: { relation: 'facing', direction: 'LOD' },
    amountOfTurn: { direction: 'none', amount: '0' }, riseAndFall: 'no_rise_fall',
    sway: 'straight', cbm: false, position: { x, y, angle },
  }
}

const part: FigurePart = {
  startPositions: { L: { x: 0, y: 0, angle: 90 }, R: { x: 10, y: 0, angle: 90 } },
  steps: [makeStep(1, 'R', 30, 0, 90), makeStep(2, 'L', 50, 0, 90)],
}

describe('totalBeats', () => {
  it('beatsの合計を返す', () => {
    expect(totalBeats(part.steps)).toBe(2)
  })
})

describe('feetAt', () => {
  it('t=0 で開始位置', () => {
    const f = feetAt(part, 0)
    expect(f.R.x).toBe(10)
    expect(f.L.x).toBe(0)
  })
  it('第1歩の途中で右足が移動中', () => {
    const f = feetAt(part, 0.5)
    expect(f.R.x).toBeGreaterThan(10)
    expect(f.R.x).toBeLessThan(30)
    expect(f.L.x).toBe(0) // 左足は動かない
    expect(f.movingFoot).toBe('R')
  })
  it('t=総拍数 で最終位置', () => {
    const f = feetAt(part, 2)
    expect(f.R.x).toBe(30)
    expect(f.L.x).toBe(50)
    expect(f.movingFoot).toBeNull()
  })
})

describe('lerpAngle', () => {
  it('最短経路で補間する（350°→10°は0°経由）', () => {
    expect(lerpAngle(350, 10, 0.5)).toBeCloseTo(0)
  })
})
