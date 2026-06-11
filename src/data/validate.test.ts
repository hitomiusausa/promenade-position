import { describe, it, expect } from 'vitest'
import { validateFigure, validateDanceList, validateFigureIndex } from './validate'

function validStep(stepNo: number) {
  return {
    stepNo, foot: 'R', stepDescription: { move: 'forward' }, count: '1', beats: 1,
    footwork: 'HT', alignment: { relation: 'facing', direction: 'DW' },
    amountOfTurn: { direction: 'none', amount: '0' }, riseAndFall: 'commence_rise_eo_1',
    sway: 'straight', cbm: true, position: { x: 0, y: 0, angle: 45 },
  }
}

function validFigure() {
  const part = {
    startPositions: { L: { x: 0, y: 10, angle: 45 }, R: { x: 10, y: 10, angle: 45 } },
    steps: [validStep(1)],
  }
  return {
    id: 'natural-turn', name: { ja: 'ナチュラルターン', en: 'Natural Turn' },
    dance: 'waltz', timeSignature: '3/4', parts: { man: part, lady: part },
  }
}

describe('validateFigure', () => {
  it('正しいデータを通す', () => {
    expect(validateFigure(validFigure()).id).toBe('natural-turn')
  })

  it('未知のフットワーク記号を弾く', () => {
    const f = validFigure() as any
    f.parts.man.steps[0].footwork = 'X'
    expect(() => validateFigure(f)).toThrow(/parts\.man\.steps\[0\]\.footwork/)
  })

  it('stepNoの欠番を弾く', () => {
    const f = validFigure() as any
    f.parts.man.steps[0].stepNo = 2
    expect(() => validateFigure(f)).toThrow(/stepNo/)
  })

  it('英語名がないフィガーを弾く', () => {
    const f = validFigure() as any
    f.name = { ja: 'ナチュラルターン' }
    expect(() => validateFigure(f)).toThrow(/name\.en/)
  })

  it('betweenに数値以外が入っていたらパス付きで弾く', () => {
    const f = validFigure() as any
    f.parts.man.steps[0].amountOfTurn = { direction: 'right', amount: '1/4', between: ['a', 2] }
    expect(() => validateFigure(f)).toThrow(/amountOfTurn\.between\[0\]/)
  })

  it('noteの不明な言語コードを弾く', () => {
    const f = validFigure() as any
    f.parts.man.steps[0].note = { xx: 'hello' }
    expect(() => validateFigure(f)).toThrow(/note\.xx/)
  })

  it('空文字のidを弾く', () => {
    const f = validFigure() as any
    f.id = ''
    expect(() => validateFigure(f)).toThrow(/^id:/)
  })
})

describe('validateDanceList', () => {
  it('正しいリストを通す', () => {
    expect(validateDanceList([{ id: 'waltz', name: { en: 'Waltz' }, category: 'standard', available: true }])).toHaveLength(1)
  })
  it('不明な種目IDを弾く', () => {
    expect(() => validateDanceList([{ id: 'polka', name: { en: 'Polka' }, category: 'standard', available: true }])).toThrow(/dances\[0\]\.id/)
  })
})

describe('validateFigureIndex', () => {
  it('正しい目次を通す', () => {
    expect(validateFigureIndex([{ id: 'natural-turn', name: { en: 'Natural Turn' }, level: 'beginner', stepCount: 6 }])).toHaveLength(1)
  })
  it('stepCountが0以下なら弾く', () => {
    expect(() => validateFigureIndex([{ id: 'x', name: { en: 'X' }, level: 'beginner', stepCount: 0 }])).toThrow(/stepCount/)
  })
})
