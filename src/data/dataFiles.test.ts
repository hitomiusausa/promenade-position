import { describe, it, expect } from 'vitest'
import { validateAmalgamations, validateDanceList, validateFigure, validateFigureIndex } from './validate'
import { buildAmalgamation } from './amalgamation'

const dancesJson = import.meta.glob('../../public/data/dances.json', { eager: true, import: 'default' })
const indexJsons = import.meta.glob('../../public/data/*/figures.json', { eager: true, import: 'default' })
const figureJsons = import.meta.glob('../../public/data/*/*.json', { eager: true, import: 'default' })
const amalJsons = import.meta.glob('../../public/data/*/amalgamations.json', { eager: true, import: 'default' })

describe('public/data の全ファイル検証', () => {
  it('dances.json が正しい', () => {
    const data = Object.values(dancesJson)[0]
    expect(validateDanceList(data).length).toBeGreaterThan(0)
  })

  it('全フィガーJSONがスキーマを通る', () => {
    const entries = Object.entries(figureJsons).filter(([path]) => !path.endsWith('figures.json') && !path.endsWith('amalgamations.json'))
    expect(entries.length).toBeGreaterThan(0)
    for (const [path, data] of entries) {
      try {
        validateFigure(data)
      } catch (e) {
        throw new Error(`${path} → ${(e as Error).message}`)
      }
    }
  })

  it('figures.json の各エントリに対応するファイルがあり、歩数が一致する', () => {
    expect(Object.keys(indexJsons).length).toBeGreaterThan(0)
    const beats = (steps: { beats: number }[]) => steps.reduce((sum, s) => sum + s.beats, 0)
    for (const [indexPath, indexData] of Object.entries(indexJsons)) {
      const dir = indexPath.replace(/figures\.json$/, '')
      for (const entry of validateFigureIndex(indexData)) {
        const figPath = `${dir}${entry.id}.json`
        const fig = figureJsons[figPath]
        if (!fig) throw new Error(`${figPath} が存在しない（${indexPath} に記載あり）`)
        const validated = validateFigure(fig)
        // stepCount は男性の歩数（女性が異なるフィガーあり: ダブル・リバース・スピン等）
        expect(validated.parts.man.steps.length).toBe(entry.stepCount)
        expect(beats(validated.parts.man.steps)).toBe(beats(validated.parts.lady.steps))
      }
    }
  })

  it('amalgamations.json の参照先フィガーと歩範囲がすべて解決し、合成できる', () => {
    for (const [amalPath, amalData] of Object.entries(amalJsons)) {
      const dir = amalPath.replace(/amalgamations\.json$/, '')
      const amals = validateAmalgamations(amalData)
      expect(amals.length).toBeGreaterThan(0)
      const byId: Record<string, ReturnType<typeof validateFigure>> = {}
      for (const [path, data] of Object.entries(figureJsons)) {
        if (!path.startsWith(dir) || path.endsWith('figures.json') || path.endsWith('amalgamations.json')) continue
        const f = validateFigure(data)
        byId[f.id] = f
      }
      for (const a of amals) {
        const c = buildAmalgamation(a, byId)
        expect(c.segments.length).toBe(a.figures.length)
        expect(c.parts.man.steps.map((s) => s.stepNo)).toEqual(c.parts.man.steps.map((_, i) => i + 1))
        const beats = (steps: { beats: number }[]) => steps.reduce((sum, s) => sum + s.beats, 0)
        expect(beats(c.parts.man.steps)).toBe(beats(c.parts.lady.steps))
        expect(c.segments[c.segments.length - 1].to).toBe(c.parts.man.steps.length)
      }
    }
  })
})
