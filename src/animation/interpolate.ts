import type { FigurePart, FigureStep, FootSide, Footwork, StepPosition } from '../types'

export function totalBeats(steps: FigureStep[]): number {
  return steps.reduce((sum, s) => sum + s.beats, 0)
}

export function lerpAngle(a: number, b: number, t: number): number {
  const diff = ((b - a + 540) % 360) - 180
  return (a + diff * t + 360) % 360
}

function ease(t: number): number {
  return t * t * (3 - 2 * t) // smoothstep
}

function lerpPos(a: StepPosition, b: StepPosition, t: number): StepPosition {
  const e = ease(t)
  return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, angle: lerpAngle(a.angle, b.angle, e) }
}

export interface FeetState {
  L: StepPosition
  R: StepPosition
  movingFoot: FootSide | null
  /** いま再生中の歩（1始まり）。開始前・終了後は null */
  currentStepNo: number | null
  /** 各足が直近に完了した歩のフットワーク。まだ踏んでいない足は null */
  landedFootwork: Record<FootSide, Footwork | null>
}

export function feetAt(part: FigurePart, tBeats: number): FeetState {
  const pos: Record<FootSide, StepPosition> = { L: part.startPositions.L, R: part.startPositions.R }
  const landed: Record<FootSide, Footwork | null> = { L: null, R: null }
  let cursor = 0
  for (const step of part.steps) {
    const end = cursor + step.beats
    if (tBeats >= end) {
      pos[step.foot] = step.position
      landed[step.foot] = step.footwork
      cursor = end
      continue
    }
    if (tBeats > cursor) {
      const progress = (tBeats - cursor) / step.beats
      return {
        ...pos,
        [step.foot]: lerpPos(pos[step.foot], step.position, progress),
        movingFoot: step.foot,
        currentStepNo: step.stepNo,
        landedFootwork: landed,
      } as FeetState
    }
    break
  }
  return { ...pos, movingFoot: null, currentStepNo: null, landedFootwork: landed }
}
