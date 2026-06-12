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
  it('landedFootwork が各足の直近に踏んだ歩のフットワークを返す', () => {
    // t=0.5: 第1歩(R)が移動中 → どちらもまだ着地なし
    expect(feetAt(part, 0.5).landedFootwork).toEqual({ L: null, R: null })
    // t=1.5: 第1歩(R, HT)完了・第2歩(L)移動中 → RはHT
    expect(feetAt(part, 1.5).landedFootwork).toEqual({ L: null, R: 'HT' })
    // t=2: 両歩完了
    expect(feetAt(part, 2).landedFootwork).toEqual({ L: 'HT', R: 'HT' })
  })
  it('currentStepNo が再生中の歩番号を返す', () => {
    expect(feetAt(part, 0.5).currentStepNo).toBe(1)
    expect(feetAt(part, 1.5).currentStepNo).toBe(2)
    expect(feetAt(part, 2).currentStepNo).toBeNull()
  })
  it('beats=0.5 の歩（シャッセ系）でも正しく補間する', () => {
    const halfPart: FigurePart = {
      startPositions: { L: { x: 0, y: 0, angle: 90 }, R: { x: 10, y: 0, angle: 90 } },
      steps: [makeStep(1, 'R', 30, 0, 90, 0.5), makeStep(2, 'L', 50, 0, 90, 0.5)],
    }
    const f = feetAt(halfPart, 0.25)
    expect(f.movingFoot).toBe('R')
    expect(f.R.x).toBeGreaterThan(10)
    expect(f.R.x).toBeLessThan(30)
    expect(feetAt(halfPart, 1).movingFoot).toBeNull()
  })
})

describe('lerpAngle', () => {
  it('最短経路で補間する（350°→10°は0°経由）', () => {
    expect(lerpAngle(350, 10, 0.5)).toBeCloseTo(0)
  })
  it('逆方向（10°→350°）も最短経路', () => {
    expect(lerpAngle(10, 350, 0.5)).toBeCloseTo(0)
  })
})
