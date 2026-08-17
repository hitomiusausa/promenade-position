import type { Amalgamation, AmalgamationSegment, CompositeFigure, Figure, FigureStep, Role } from '../types'
import { deriveAll } from './validate'

/**
 * アマルガメーション定義と参照先フィガーから、Figure と同じ形の合成フィガーを作る。
 * - 参照範囲の歩を男女別に連結し stepNo を 1..N に振り直す
 * - 座標は連結後の歩列から導出（各歩の向きは自分のアライメント、位置は直前の足から積み上がるので境界は自動で連続）
 * 参照先が見つからない／範囲外なら例外（データテストで検出）。
 */
export function buildAmalgamation(amal: Amalgamation, figures: Record<string, Figure>): CompositeFigure {
  const collected: Record<Role, Array<Omit<FigureStep, 'position'>>> = { man: [], lady: [] }
  const segments: AmalgamationSegment[] = []
  for (const item of amal.figures) {
    const fig = figures[item.figure]
    if (!fig) throw new Error(`${amal.id}: フィガー ${item.figure} が見つからない`)
    const manCount = fig.parts.man.steps.length
    const [from, to] = item.steps ?? [1, manCount]
    if (to > manCount) throw new Error(`${amal.id}: ${item.figure} の歩範囲 ${from}-${to} が歩数 ${manCount} を超える`)
    const start = collected.man.length + 1
    for (const role of ['man', 'lady'] as const) {
      const steps = fig.parts[role].steps
      const last = role === 'man' ? to : Math.min(to, steps.length)
      for (const s of steps.slice(from - 1, last)) {
        const { position: _p, ...rest } = s
        collected[role].push(rest)
      }
    }
    segments.push({
      figureId: fig.id, name: fig.name, from: start, to: collected.man.length, sourceSteps: [from, to],
      ...(item.note ? { note: item.note } : {}),
    })
  }
  const renumber = (steps: Array<Omit<FigureStep, 'position'>>) => steps.map((s, i) => ({ ...s, stepNo: i + 1 }))
  const inputs = { man: renumber(collected.man), lady: renumber(collected.lady) }
  const dance = Object.values(figures)[0]?.dance ?? 'waltz'
  return {
    id: amal.id,
    name: amal.name,
    dance,
    timeSignature: '3/4',
    ...deriveAll(inputs),
    segments,
  }
}

/** 通し番号の歩がどのセグメントに属するか */
export function segmentOf(segments: AmalgamationSegment[], stepNo: number): AmalgamationSegment | undefined {
  return segments.find((s) => stepNo >= s.from && stepNo <= s.to)
}
