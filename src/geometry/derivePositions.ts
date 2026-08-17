import type {
  AlignmentRelation, Direction, FigurePart, FigureStep, FootSide, Role, StepPosition,
} from '../types'
import { feetAt, type FeetState } from '../animation/interpolate'

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

export function alignmentAngle(a: { relation: AlignmentRelation; direction: Direction; almost?: boolean }): number {
  const base = DIRECTION_ANGLE[a.direction]
  return a.relation === 'backing' ? (base + 180) % 360 : base
}

// 描画パラメータ（単位: フロア座標。足の描画長は約25）
const HALF_TRACK = 7   // 両足の間隔の半分（閉じた状態で足の中心が14離れる。足幅≒13なので重ならない）
const STEP = 30        // 前進・後退の歩幅
const SIDE = 28        // 横への歩幅
const DIAG = 22        // 斜め歩の各成分
const SLIGHT = 8       // 「少し前に／少し後ろに」の前後成分
const CROSS_BACK = 22  // クロスの前後成分（足の描画長≒25。小さいと交差する足が重なって見える）
const CROSS_LAT = 10   // クロスの左右成分（反対側へ）

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
  const { move, modifiers = [] } = step.stepDescription
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
    case 'close_no_weight': lateral = s * 2 * HALF_TRACK; ahead = 0; break
    case 'hold_position': lateral = 0; ahead = 0; break
    case 'begin_close': lateral = s * 2 * HALF_TRACK + s * 6; ahead = 0; break
  }
  for (const modifier of modifiers) {
    switch (modifier) {
      case 'slightly_forward': ahead += SLIGHT; break
      case 'slightly_back': ahead -= SLIGHT; break
      case 'slightly_side': lateral += s * SLIGHT; break
      case 'leftward': lateral -= SLIGHT; break
      case 'rightward': lateral += SLIGHT; break
      case 'small_step': lateral *= 0.6; ahead *= 0.5; break
      case 'very_small': lateral *= 0.5; ahead *= 0.3; break
      default: break
    }
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
    if (step.stepDescription.move === 'replace_weight' || step.stepDescription.move === 'hold_position') {
      // 体重を戻す／ポジションを保つ: 足はその場（向きだけ更新）
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

// ---- 「両方」表示用: 女性を男性の足に対して鏡映配置する（D-28）
const PARTNER_AHEAD = 32   // 向かい合う足のつま先同士が触れない距離（足の描画長≒24＋つま先側オフセット＋余白）
const PARTNER_RIGHT = 0    // クローズド: 男性の左足の線上に女性の右足（同じトラック）。横にずらすと隣の足と重なる
const PP_SIDE = 20         // PP/フォーラウェイ: 横並び（男性の右足と女性の左足が隣り合う）
const OP_SHIFT = 12        // アウトサイド・パートナー: 外側に出る足の分だけ横にずれる

type PartnerHold = 'closed' | 'pp' | 'man_op' | 'lady_op' | 'lady_left_op'

function holdOf(ladyStep: Pick<FigureStep, 'stepDescription'> | undefined, manStep: Pick<FigureStep, 'stepDescription'> | undefined): PartnerHold {
  const lm = ladyStep?.stepDescription.modifiers ?? []
  const mm = manStep?.stepDescription.modifiers ?? []
  const lmove = ladyStep?.stepDescription.move
  const mmove = manStep?.stepDescription.move
  if (lm.includes('left_outside_partner')) return 'lady_left_op'
  if (lm.includes('outside_partner')) return 'lady_op'
  if (mm.includes('outside_partner')) return 'man_op'
  const ppLike = (mods: string[], move?: string) =>
    mods.includes('in_PP') || mods.includes('in_fallaway') || move === 'forward_PP' || move === 'side_in_PP'
  if (ppLike(lm, lmove) || ppLike(mm, mmove)) return 'pp'
  return 'closed'
}

function mirrorFoot(his: StepPosition, hold: PartnerHold, angle: number): StepPosition {
  // 女性の足は「自分の向きの真後ろ」方向に、男性の足から PARTNER_AHEAD 離れる（＝男性から見て前方、向かい合う）。
  // 男性の足の向きではなく女性の足の向きを基準にするのは、男性の足が回転しながら動く途中で
  // 鏡映方向が遅れて男性のもう一方の足に重なるのを防ぐため。
  const f = forwardOf(angle)      // 女性の前方
  const r = rightOf(angle)        // 女性の右手
  let back = PARTNER_AHEAD        // 女性の後方＝男性から見て前方
  let right = -PARTNER_RIGHT      // 男性の右＝女性の左
  switch (hold) {
    case 'pp': back = 4; right = -PP_SIDE; break                       // 女性は男性の右側＝女性から見て左に男性
    case 'man_op': right = -(PARTNER_RIGHT - OP_SHIFT); break
    case 'lady_op': right = -(PARTNER_RIGHT + OP_SHIFT); break
    case 'lady_left_op': right = PARTNER_RIGHT + OP_SHIFT; break
    default: break
  }
  return { x: r1(his.x - f.x * back + r.x * right), y: r1(his.y - f.y * back + r.y * right), angle }
}

/**
 * 女性の座標を「男性の反対の足の、その時点の位置」から鏡映で決める（両方表示用）。
 * - 女性の右足は男性の左足、左足は右足に対応し、つま先同士が触れる距離で向かい合う
 * - PP/フォーラウェイは横並び、OP は外側の足の分だけずらす
 * - 向き（angle）は女性自身のアライメント
 * 独立に導出した男女を重ねると足が重なるため（実測: 全39フィガーで重なりが発生）、両方表示ではこちらを使う。
 * 女性単独表示は自分の歩の形（クローズ等）を正確に見せるため独立導出のまま。
 */
export function deriveLadyInCouple(man: FigurePart, ladySteps: Array<Omit<FigureStep, 'position'>>): FigurePart {
  // まず鏡映で仮の着地点を作り（向き・移動足の情報源）、次に各着地時刻の実配置（押し出し込み）で置き換える
  const startHold = holdOf(ladySteps[0], man.steps[0])
  const a0 = ladySteps[0] ? alignmentAngle(ladySteps[0].alignment) : (man.startPositions.R.angle + 180) % 360
  const provisional: FigurePart = {
    startPositions: {
      L: mirrorFoot(man.startPositions.R, startHold, a0),
      R: mirrorFoot(man.startPositions.L, startHold, a0),
    },
    steps: [],
  }
  let t = 0
  const manEnds: number[] = []
  let acc = 0
  for (const s of man.steps) { acc += s.beats; manEnds.push(acc) }
  provisional.steps = ladySteps.map((s) => {
    t += s.beats
    const his = feetAt(man, t)
    const opposite: FootSide = s.foot === 'L' ? 'R' : 'L'
    const manIdx = manEnds.findIndex((e) => Math.abs(e - t) < 1e-6)
    const hold = holdOf(s, manIdx >= 0 ? man.steps[manIdx] : undefined)
    return { ...s, position: mirrorFoot(his[opposite], hold, alignmentAngle(s.alignment)) }
  })
  // 押し出し込みの実配置
  const start = coupleLadyFeetAt(man, provisional, ladySteps, 0)
  const startPositions = { L: start.L, R: start.R }
  let tt = 0
  const steps = provisional.steps.map((s) => {
    tt += s.beats
    const feet = coupleLadyFeetAt(man, provisional, ladySteps, tt)
    return { ...s, position: feet[s.foot] }
  })
  return { startPositions, steps }
}

// ---- 足同士の当たり判定（13×24 の回転矩形、つま先側に3ずれた中心）と押し出し
export const FOOT_W = 13
export const FOOT_H = 24
function footCorners(p: StepPosition): Array<[number, number]> {
  const a = rad(p.angle), c = Math.cos(a), sn = Math.sin(a)
  const pts: Array<[number, number]> = []
  for (const [dx, dy] of [[-FOOT_W / 2, -FOOT_H / 2 - 3], [FOOT_W / 2, -FOOT_H / 2 - 3], [FOOT_W / 2, FOOT_H / 2 - 3], [-FOOT_W / 2, FOOT_H / 2 - 3]] as Array<[number, number]>) {
    pts.push([p.x + dx * c - dy * sn, p.y + dx * sn + dy * c])
  }
  return pts
}
/** 2つの足の食い込み量と、b を a から離す最小移動方向。離れていれば pen <= 0 */
export function footPenetration(a: StepPosition, b: StepPosition): { pen: number; nx: number; ny: number } {
  const A = footCorners(a), B = footCorners(b)
  let best = { pen: Infinity, nx: 0, ny: 0 }
  for (const P of [A, B]) for (let i = 0; i < 2; i++) {
    const [x1, y1] = P[i], [x2, y2] = P[i + 1]
    const len = Math.hypot(x2 - x1, y2 - y1)
    let nx = -(y2 - y1) / len, ny = (x2 - x1) / len
    const pa = A.map(([x, y]) => x * nx + y * ny), pb = B.map(([x, y]) => x * nx + y * ny)
    const o1 = Math.max(...pa) - Math.min(...pb) // b を +n 方向へ o1 動かせば離れる
    const o2 = Math.max(...pb) - Math.min(...pa) // b を -n 方向へ o2 動かせば離れる
    let o = o1
    if (o2 < o1) { o = o2; nx = -nx; ny = -ny }
    if (o < best.pen) best = { pen: o, nx, ny }
  }
  return best
}
const CLEARANCE = 1.5
/** 女性の足を男性の両足から押し出して重なりを解消する（最大数回の反復） */
function resolveAgainst(foot: StepPosition, obstacles: StepPosition[]): StepPosition {
  let p = { ...foot }
  for (let iter = 0; iter < 20; iter++) {
    let moved = false
    for (const o of obstacles) {
      const { pen, nx, ny } = footPenetration(o, p)
      if (pen > -CLEARANCE) {
        const d = pen + CLEARANCE
        p = { ...p, x: r1(p.x + nx * d), y: r1(p.y + ny * d) }
        moved = true
      }
    }
    if (!moved) break
  }
  // 男性の両足に挟まれて押し出しきれない場合は、女性の後方（相手から離れる向き）へ逃がす
  const back = forwardOf(p.angle)
  for (let k = 0; k < 12 && obstacles.some((o) => footPenetration(o, p).pen > -CLEARANCE); k++) {
    p = { ...p, x: r1(p.x - back.x * 4), y: r1(p.y - back.y * 4) }
  }
  return p
}

export function coupleLadyFeetAt(man: FigurePart, lady: FigurePart, ladySteps: Array<Pick<FigureStep, 'stepDescription' | 'beats'>>, t: number): FeetState {
  const his = feetAt(man, t)
  const hers = feetAt(lady, t)
  // 現在（または直近）の女性の歩と、同時刻の男性の歩からホールドを決める
  let acc = 0, idx = -1
  for (let i = 0; i < ladySteps.length; i++) { acc += ladySteps[i].beats; if (t <= acc + 1e-9) { idx = i; break } }
  if (idx < 0) idx = ladySteps.length - 1
  let macc = 0, midx = -1
  for (let i = 0; i < man.steps.length; i++) { macc += man.steps[i].beats; if (t <= macc + 1e-9) { midx = i; break } }
  if (midx < 0) midx = man.steps.length - 1
  const hold = holdOf(ladySteps[idx], man.steps[midx])
  const obstacles = [his.L, his.R]
  const L = resolveAgainst(mirrorFoot(his.R, hold, hers.L.angle), obstacles)
  const R = resolveAgainst(mirrorFoot(his.L, hold, hers.R.angle), [...obstacles, L])
  return { ...hers, L, R }
}
