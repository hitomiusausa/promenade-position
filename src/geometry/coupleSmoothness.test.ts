import { describe, it, expect } from 'vitest'
import { validateFigure } from '../data/validate'
import { totalBeats } from '../animation/interpolate'
import { coupleLadyFeetAt } from './derivePositions'
const figureJsons = import.meta.glob('../../public/data/waltz/*.json', { eager: true, import: 'default' })

// 両方表示の女性の足が、60fps相当の1フレームで飛ばないこと（D-28 改）。
// 男性の足の1フレーム移動は最大 ≈3.3（ピボットの & カウント）。女性は枠の追従が乗るので閾値は 15。
// 以前の鏡映＋押し出し方式は 30〜88 跳んでいた（利用者が「激しく細かくブレる」と指摘）。
describe('両方表示（couple）の女性の足はフレーム間で飛ばない', () => {
  it('全フィガーで1フレームの移動量 < 15', () => {
    const bad: string[] = []
    for (const [path, data] of Object.entries(figureJsons)) {
      if (path.endsWith('figures.json') || path.endsWith('amalgamations.json')) continue
      const f = validateFigure(data)
      const T = totalBeats(f.parts.man.steps)
      const dt = 1 / 60
      let maxJump = 0, at = 0
      let prev = coupleLadyFeetAt(f.parts.man, f.parts.lady, f.parts.lady.steps, 0)
      for (let t = dt; t <= T; t += dt) {
        const cur = coupleLadyFeetAt(f.parts.man, f.parts.lady, f.parts.lady.steps, t)
        for (const s of ['L', 'R'] as const) {
          const d = Math.hypot(cur[s].x - prev[s].x, cur[s].y - prev[s].y)
          if (d > maxJump) { maxJump = d; at = t }
        }
        prev = cur
      }
      if (maxJump >= 15) bad.push(`${f.id} jump=${maxJump.toFixed(1)} t=${at.toFixed(2)}`)
    }
    expect(bad, bad.join('\n')).toEqual([])
  })
})
