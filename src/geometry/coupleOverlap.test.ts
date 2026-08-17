import { describe, it, expect } from 'vitest'
import { validateFigure } from '../data/validate'
import { feetAt, totalBeats } from '../animation/interpolate'
import { coupleLadyFeetAt } from './derivePositions'
import { validateAmalgamations } from '../data/validate'
import { buildAmalgamation } from '../data/amalgamation'
import type { StepPosition } from '../types'

const figureJsons = import.meta.glob('../../public/data/waltz/*.json', { eager: true, import: 'default' })

// 足を 13×24 の回転矩形とみなし、分離軸定理で重なりを判定する（描画は scale 0.6 の足パス ≒ 幅13・長さ24）
const W = 13, H = 24
function corners(p: StepPosition) {
  const a = (p.angle * Math.PI) / 180
  const c = Math.cos(a), s = Math.sin(a)
  const pts: Array<[number, number]> = []
  for (const [dx, dy] of [[-W / 2, -H / 2 - 3], [W / 2, -H / 2 - 3], [W / 2, H / 2 - 3], [-W / 2, H / 2 - 3]]) {
    pts.push([p.x + dx * c - dy * s, p.y + dx * s + dy * c])
  }
  return pts
}
/** 2つの足の食い込み量（分離軸での最小の重なり幅）。0以下なら離れている */
function penetration(a: StepPosition, b: StepPosition): number {
  const A = corners(a), B = corners(b)
  const axes: Array<[number, number]> = []
  for (const P of [A, B]) for (let i = 0; i < 2; i++) {
    const [x1, y1] = P[i], [x2, y2] = P[i + 1]
    const len = Math.hypot(x2 - x1, y2 - y1)
    axes.push([-(y2 - y1) / len, (x2 - x1) / len])
  }
  let minOverlap = Infinity
  for (const [nx, ny] of axes) {
    const pa = A.map(([x, y]) => x * nx + y * ny), pb = B.map(([x, y]) => x * nx + y * ny)
    const o = Math.min(Math.max(...pa) - Math.min(...pb), Math.max(...pb) - Math.min(...pa))
    minOverlap = Math.min(minOverlap, o)
  }
  return minOverlap
}

describe('両方表示（ladyInCouple）で男女の足が重ならない（D-28）', () => {
  const entries = Object.entries(figureJsons).filter(([p]) => !p.endsWith('figures.json') && !p.endsWith('amalgamations.json'))
  const figures = entries.map(([, data]) => validateFigure(data))
  const byId = Object.fromEntries(figures.map((f) => [f.id, f]))
  const amalPath = Object.keys(figureJsons).find((p) => p.endsWith('amalgamations.json'))
  const composites = amalPath ? validateAmalgamations(figureJsons[amalPath]).map((a) => buildAmalgamation(a, byId)) : []
  it('全フィガー＋全アマルガメーション・全時刻で男女の足が重ならない', () => {
    const bad: string[] = []
    for (const f of [...figures, ...composites]) {
      const lady = f.ladyInCouple!
      const T = totalBeats(f.parts.man.steps)
      let worst = -Infinity, worstT = 0
      for (let t = 0; t <= T + 1e-6; t += 0.05) {
        const m = feetAt(f.parts.man, t), l = coupleLadyFeetAt(f.parts.man, lady, lady.steps, t)
        for (const a of [m.L, m.R]) for (const b of [l.L, l.R]) {
          const pen = penetration(a, b)
          if (pen > worst) { worst = pen; worstT = t }
        }
      }
      // 許容: 食い込み 3 未満（回転中の角のかすり。目視で「重なっている」と分からない範囲）
      if (worst >= 3) bad.push(`${f.id} t=${worstT.toFixed(2)} pen=${worst.toFixed(1)}`)
    }
    expect(bad, bad.join('\n')).toEqual([])
  })
})
