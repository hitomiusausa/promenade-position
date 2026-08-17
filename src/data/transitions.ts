import type { FigureStub, Transition } from '../types'
import raw from './transitions.json'
import { checkTransitionsAgainstFigures, validateTransitionData, type TransitionData } from './validate'

const cache = new Map<string, TransitionData>()

/** 教本の先行・後続データ。src に同梱するのでフェッチ不要（歩データと違い量が小さい） */
export function getTransitionData(dance: string): TransitionData {
  const hit = cache.get(dance)
  if (hit) return hit
  const data = validateTransitionData(raw, dance)
  cache.set(dance, data)
  return data
}

export function hasTransitionData(dance: string): boolean {
  return Object.prototype.hasOwnProperty.call(raw as Record<string, unknown>, dance)
}

export { checkTransitionsAgainstFigures }

/**
 * このフィガーの後続として教本が挙げるもの（ビルダーが「次に来られるフィガー」に使う API）。
 * 群参照（to が null）は絞り込めないので含めるが、リンクにはしないこと。
 */
export function followingOf(dance: string, figureId: string): Transition[] {
  return getTransitionData(dance).transitions.filter((t) => t.from === figureId)
}

/** このフィガーの先行として教本が挙げるもの */
export function precedingOf(dance: string, figureId: string): Transition[] {
  return getTransitionData(dance).transitions.filter((t) => t.to === figureId)
}

/** 実体のあるフィガーだけを返す（ビルダー用。stub と群参照を落とす） */
export function followingFigureIds(dance: string, figureId: string, realIds: readonly string[]): string[] {
  const real = new Set(realIds)
  const ids = followingOf(dance, figureId).map((t) => t.to).filter((id): id is string => id !== null && real.has(id))
  return [...new Set(ids)]
}

export function stubsOf(dance: string): FigureStub[] {
  return getTransitionData(dance).stubs
}

/** id → 表示名。stub も引ける */
export function figureNameMap(dance: string, figures: readonly { id: string; name: { en: string } & Record<string, unknown> }[]) {
  const m = new Map<string, { name: { en: string } & Record<string, unknown>; stub: boolean }>()
  for (const f of figures) m.set(f.id, { name: f.name, stub: false })
  for (const s of stubsOf(dance)) if (!m.has(s.id)) m.set(s.id, { name: s.name, stub: true })
  return m
}
