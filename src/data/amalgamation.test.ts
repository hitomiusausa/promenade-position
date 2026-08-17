import { describe, it, expect } from 'vitest'
import { validateFigure } from './validate'
import { buildAmalgamation, segmentOf } from './amalgamation'

const step = (n: number, foot: 'L' | 'R', dir: string) => ({
  stepNo: n, foot, stepDescription: { move: foot === 'R' ? 'forward' : 'close' }, count: String(n), beats: 1,
  footwork: 'HT', alignment: { relation: 'facing', direction: dir },
  amountOfTurn: { direction: 'none', amount: '0' }, riseAndFall: 'commence_rise_eo_1', sway: 'straight', cbm: false,
})
const fig = (id: string, dir: string, n = 3) => validateFigure({
  id, name: { en: id }, dance: 'waltz', timeSignature: '3/4',
  parts: {
    man: { steps: Array.from({ length: n }, (_, i) => step(i + 1, i % 2 === 0 ? 'R' : 'L', dir)) },
    lady: { steps: Array.from({ length: n }, (_, i) => step(i + 1, i % 2 === 0 ? 'L' : 'R', dir)) },
  },
})

describe('buildAmalgamation', () => {
  const figures = { a: fig('a', 'LOD'), b: fig('b', 'DW', 4) }
  it('歩を連結して通し番号にし、境界を segments に持つ', () => {
    const c = buildAmalgamation({ id: 'x', name: { en: 'x' }, figures: [{ figure: 'a' }, { figure: 'b' }] }, figures)
    expect(c.parts.man.steps.length).toBe(7)
    expect(c.parts.man.steps.map((s) => s.stepNo)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(c.segments).toHaveLength(2)
    expect(c.segments[1]).toMatchObject({ figureId: 'b', from: 4, to: 7, sourceSteps: [1, 4] })
    expect(segmentOf(c.segments, 5)?.figureId).toBe('b')
  })
  it('歩範囲の部分参照ができ、座標は前のフィガーから連続する', () => {
    const c = buildAmalgamation({ id: 'x', name: { en: 'x' }, figures: [{ figure: 'a' }, { figure: 'b', steps: [2, 3] }] }, figures)
    expect(c.parts.man.steps.length).toBe(5)
    expect(c.segments[1].sourceSteps).toEqual([2, 3])
    // 2つ目のフィガーの最初の歩は、1つ目の最後の足の近くに置かれる（座標が飛ばない）
    const last = c.parts.man.steps[2].position
    const next = c.parts.man.steps[3].position
    expect(Math.hypot(next.x - last.x, next.y - last.y)).toBeLessThan(60)
  })
  it('存在しないフィガーや範囲外は例外', () => {
    expect(() => buildAmalgamation({ id: 'x', name: { en: 'x' }, figures: [{ figure: 'zzz' }] }, figures)).toThrow(/zzz/)
    expect(() => buildAmalgamation({ id: 'x', name: { en: 'x' }, figures: [{ figure: 'a', steps: [2, 9] }] }, figures)).toThrow(/歩数/)
  })
})
