import { describe, it, expect } from 'vitest'
import { alignmentAngle, derivePartPositions, DIRECTION_ANGLE, forwardOf, rightOf } from './derivePositions'

const step = (foot: 'L' | 'R', move: string, relation: string, direction: string, modifier?: string) => ({
  foot,
  stepDescription: { move, ...(modifier ? { modifiers: [modifier] } : {}) } as any,
  alignment: { relation, direction } as any,
})

describe('座標規約（D-21）: LOD=右、壁=画面下', () => {
  it('8方向の角度', () => {
    expect(DIRECTION_ANGLE.LOD).toBe(90)
    expect(DIRECTION_ANGLE.wall).toBe(180)
    expect(DIRECTION_ANGLE.centre).toBe(0)
    expect(DIRECTION_ANGLE.DW).toBe(135)
    expect(DIRECTION_ANGLE.DC).toBe(45)
  })
  it('LODに面した人の右手側が壁（画面下）', () => {
    const r = rightOf(alignmentAngle({ relation: 'facing', direction: 'LOD' }))
    expect(r.x).toBeCloseTo(0)
    expect(r.y).toBeCloseTo(1)
  })
  it('背面 = +180°、向けて = 面してと同じ', () => {
    expect(alignmentAngle({ relation: 'backing', direction: 'DC' })).toBe(225)
    expect(alignmentAngle({ relation: 'pointing', direction: 'DC' })).toBe(45)
  })
  it('前方ベクトル: 90° は +x', () => {
    expect(forwardOf(90).x).toBeCloseTo(1)
    expect(forwardOf(90).y).toBeCloseTo(0)
  })
})

describe('derivePartPositions', () => {
  it('開始位置は右足が右手側', () => {
    const d = derivePartPositions([step('R', 'forward', 'facing', 'LOD')], 'man')
    // LODに面して(90°)、右手側=画面下(+y)
    expect(d.startPositions.R.y).toBeGreaterThan(d.startPositions.L.y)
    expect(d.startPositions.R.x).toBeCloseTo(d.startPositions.L.x)
  })
  it('前進は体の向きへ進み、右足は左足の右手側に着く', () => {
    const d = derivePartPositions([step('R', 'forward', 'facing', 'LOD')], 'man')
    const p = d.positions[0]
    expect(p.x).toBeGreaterThan(d.startPositions.L.x + 20)
    expect(p.y).toBeGreaterThan(d.startPositions.L.y) // 右手側 = +y
  })
  it('ナチュラルターン男性1-3歩は画面上で時計回り（右回転）に見える', () => {
    const d = derivePartPositions([
      step('R', 'forward', 'facing', 'DW'),
      step('L', 'side', 'backing', 'DC'),
      step('R', 'close', 'backing', 'LOD'),
    ], 'man')
    const a = d.positions.map((p) => p.angle)
    expect(a).toEqual([135, 225, 270])
    // 角度が増える = SVGでは時計回り
    expect(a[1] - a[0]).toBe(90)
    expect(a[2] - a[1]).toBe(45)
  })
  it('クローズは立っている足の隣に着く', () => {
    const d = derivePartPositions([
      step('R', 'forward', 'facing', 'LOD'),
      step('L', 'close', 'facing', 'LOD'),
    ], 'man')
    const [r, l] = d.positions
    expect(Math.hypot(r.x - l.x, r.y - l.y)).toBeCloseTo(16)
    expect(l.y).toBeLessThan(r.y) // 左足は左手側（画面上）
  })
  it('体重を戻す歩は足の位置を変えない', () => {
    const d = derivePartPositions([
      step('R', 'back', 'backing', 'LOD'),
      step('L', 'close', 'backing', 'DC_against_LOD'),
      step('R', 'replace_weight', 'backing', 'DC_against_LOD'),
    ], 'man')
    expect(d.positions[2].x).toBe(d.positions[0].x)
    expect(d.positions[2].y).toBe(d.positions[0].y)
  })
})
