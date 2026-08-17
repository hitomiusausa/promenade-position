import type {
  AlignmentRelation, Direction, FigureStep, FootSide, Role, StepPosition,
} from '../types'

/**
 * フロア座標の規約（D-21, 2026-08-17）
 * - SVG座標: x右・y下。angle は度数、0=つま先が画面上、時計回りが正（SVG rotate() にそのまま渡す）
 * - LOD（進行方向）= 画面右(+x)。教本どおり「LODに面して右手側が壁」なので 壁 = 画面下(+y)、中央 = 画面上(-y)
 * - したがって: 中央 0° / 中央斜め(DC) 45° / LOD 90° / 壁斜め(DW) 135° / 壁 180° / 逆壁斜め 225° / 逆LOD 270° / 逆中央斜め 315°
 * - 「面して(facing)」= 足の向き=その方向、「背面して(backing)」= +180°、「向けて(pointing)」= 足はその方向
 *
 * 座標は保存せず、ISTDデータ（足・足の位置・アライメント）からここで導出する。
 * 手で座標を調整したくなったら、このモジュールのパラメータ（歩幅・足幅）を直す。
 */

export const DIRECTION_ANGLE: Record<Direction, number> = {
  centre: 0, DC: 45, LOD: 90, DW: 135, wall: 180, DW_against_LOD: 225, against_LOD: 270, DC_against_LOD: 315,
}

export function alignmentAngle(a: { relation: AlignmentRelation; direction: Direction }): number {
  const base = DIRECTION_ANGLE[a.direction]
  return a.relation === 'backing' ? (base + 180) % 360 : base
}

// 描画パラメータ（単位: フロア座標。足の描画長は約25）
const HALF_TRACK = 6   // 両足の間隔の半分（閉じた状態で足の中心が12離れる）
const STEP = 30        // 前進・後退の歩幅
const SIDE = 28        // 横への歩幅
const DIAG = 22        // 斜め歩の各成分
const SLIGHT = 8       // 「少し前に／少し後ろに」の前後成分
const CROSS_BACK = 12  // クロスの前後成分
const CROSS_LAT = 8    // クロスの左右成分（反対側へ）

type Vec = { x: number; y: number }
const rad = (deg: number) => (deg * Math.PI) / 180
/** 向き angle のときの前方単位ベクトル（angle 0 = 画面上） */
export const forwardOf = (angle: number): Vec => ({ x: Math.sin(rad(angle)), y: -Math.cos(rad(angle)) })
/** 向き angle のときの右手方向の単位ベクトル */
export const rightOf = (angle: number): Vec => ({ x: Math.cos(rad(angle)), y: Math.sin(rad(angle)) })

const r1 = (n: number) => Math.round(n * 10) / 10

/**
 * 体の向き frame の中で「立っている足」を原点に、動く足の着地位置を (lateral=右+, ahead=前+) で返す。
 * side = 動く足の側（R=+1, L=-1）。
 */
function bodyOffset(step: Pick<FigureStep, 'foot' | 'stepDescription'>, role: Role): { lateral: number; ahead: number; travelAngleOffset: number } {
  const s = step.foot === 'R' ? 1 : -1
  const { move, modifier } = step.stepDescription
  let lateral = 0
  let ahead = 0
  let travelAngleOffset = 0 // PPでの前進は体の向きと進行方向が45°ずれる（男性は左手側、女性は右手側がLOD）
  switch (move) {
    case 'forward': lateral = s * 2 * HALF_TRACK; ahead = STEP; break
    case 'back': lateral = s * 2 * HALF_TRACK; ahead = -STEP; break
    case 'side': lateral = s * SIDE; ahead = 0; break
    case 'close': lateral = s * 2 * HALF_TRACK; ahead = 0; break
    case 'diag_forward': lateral = s * DIAG; ahead = DIAG; break
    case 'diag_back': lateral = s * DIAG; ahead = -DIAG; break
    case 'cross_behind': lateral = -s * CROSS_LAT; ahead = -CROSS_BACK; break
    case 'cross_front': lateral = -s * CROSS_LAT; ahead = CROSS_BACK; break
    case 'forward_PP': lateral = s * 2 * HALF_TRACK; ahead = STEP; travelAngleOffset = role === 'man' ? -45 : 45; break
    case 'side_in_PP': lateral = s * SIDE; ahead = 0; travelAngleOffset = role === 'man' ? -45 : 45; break
    case 'brush': lateral = s * 2 * HALF_TRACK; ahead = 0; break
    case 'replace_weight': lateral = 0; ahead = 0; break
  }
  switch (modifier) {
    case 'slightly_forward': ahead += SLIGHT; break
    case 'slightly_back': ahead -= SLIGHT; break
    case 'small_step': lateral *= 0.6; ahead *= 0.5; break
    default: break
  }
  return { lateral, ahead, travelAngleOffset }
}

export interface DerivedPart {
  startPositions: Record<FootSide, StepPosition>
  positions: StepPosition[]
}

/**
 * 1パート分の座標を導出する。origin = 開始時の体の中心、startAngle = 開始時の向き。
 */
export function derivePartPositions(
  steps: Array<Pick<FigureStep, 'foot' | 'stepDescription' | 'alignment'>>,
  role: Role,
  origin: Vec = { x: 0, y: 0 },
  startAngle?: number,
): DerivedPart {
  const a0 = startAngle ?? (steps.length > 0 ? alignmentAngle(steps[0].alignment) : 90)
  const r0 = rightOf(a0)
  const feet: Record<FootSide, StepPosition> = {
    L: { x: r1(origin.x - r0.x * HALF_TRACK), y: r1(origin.y - r0.y * HALF_TRACK), angle: a0 },
    R: { x: r1(origin.x + r0.x * HALF_TRACK), y: r1(origin.y + r0.y * HALF_TRACK), angle: a0 },
  }
  const startPositions = { L: { ...feet.L }, R: { ...feet.R } }
  const positions: StepPosition[] = []
  for (const step of steps) {
    const angle = alignmentAngle(step.alignment)
    const standing: FootSide = step.foot === 'L' ? 'R' : 'L'
    const { lateral, ahead, travelAngleOffset } = bodyOffset(step, role)
    let pos: StepPosition
    if (step.stepDescription.move === 'replace_weight') {
      // 体重を戻すだけ。足はその場（向きだけ更新）
      pos = { ...feet[step.foot], angle }
    } else {
      const f = forwardOf(angle + travelAngleOffset)
      const r = rightOf(angle)
      const base = feet[standing]
      pos = {
        x: r1(base.x + r.x * lateral + f.x * ahead),
        y: r1(base.y + r.y * lateral + f.y * ahead),
        angle,
      }
    }
    feet[step.foot] = pos
    positions.push(pos)
  }
  return { startPositions, positions }
}

/** 男性の開始向き a0 に対して、女性の開始中心の位置（男性中心からの相対）と向きを返す */
export function ladyStart(manAngle: number, ladyAngle: number): { offset: Vec; angle: number } {
  const f = forwardOf(manAngle)
  const r = rightOf(manAngle)
  const diff = ((ladyAngle - manAngle) % 360 + 360) % 360
  // 180°差 = クローズドポジション: 女性は男性の正面やや右（男性の右足が女性の両足の間）
  // それ以外（PPなど）: 女性は男性の右側やや後方
  const closed = Math.abs(diff - 180) < 1
  const ahead = closed ? 12 : 8
  const right = closed ? HALF_TRACK : 12
  return { offset: { x: f.x * ahead + r.x * right, y: f.y * ahead + r.y * right }, angle: ladyAngle }
}
