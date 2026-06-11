import { describe, it, expect } from 'vitest'
import { validateDanceList, validateFigure, validateFigureIndex } from './validate'

const dancesJson = import.meta.glob('../../public/data/dances.json', { eager: true, import: 'default' })
const indexJsons = import.meta.glob('../../public/data/*/figures.json', { eager: true, import: 'default' })
const figureJsons = import.meta.glob('../../public/data/*/*.json', { eager: true, import: 'default' })

describe('public/data の全ファイル検証', () => {
  it('dances.json が正しい', () => {
    const data = Object.values(dancesJson)[0]
    expect(validateDanceList(data).length).toBeGreaterThan(0)
  })

  it('全フィガーJSONがスキーマを通る', () => {
    const entries = Object.entries(figureJsons).filter(([path]) => !path.endsWith('figures.json'))
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
        expect(validated.parts.man.steps.length).toBe(entry.stepCount)
        expect(validated.parts.lady.steps.length).toBe(entry.stepCount)
        expect(beats(validated.parts.man.steps)).toBe(beats(validated.parts.lady.steps))
      }
    }
  })
})
