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
const HALF_TRACK = 8   // 両足の間隔の半分（閉じた状態で足の中心が16離れる。足幅≒13。両方表示で相手の足が隣のトラックに来ても余白3が残る）
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

type PartnerHold = 'closed' | 'pp' | 'fallaway' | 'man_op' | 'lady_op' | 'lady_left_op'

function holdOf(ladyStep: Pick<FigureStep, 'stepDescription'> | undefined, manStep: Pick<FigureStep, 'stepDescription'> | undefined): PartnerHold {
  const lm = ladyStep?.stepDescription.modifiers ?? []
  const mm = manStep?.stepDescription.modifiers ?? []
  const lmove = ladyStep?.stepDescription.move
  const mmove = manStep?.stepDescription.move
  if (lm.includes('left_outside_partner')) return 'lady_left_op'
  if (lm.includes('outside_partner')) return 'lady_op'
  if (mm.includes('outside_partner')) return 'man_op'
  if (lm.includes('in_fallaway') || mm.includes('in_fallaway')) return 'fallaway'
  const ppLike = (mods: string[], move?: string) =>
    mods.includes('in_PP') || move === 'forward_PP' || move === 'side_in_PP'
  if (ppLike(lm, lmove) || ppLike(mm, mmove)) return 'pp'
  return 'closed'
}

export function _mirrorFoot(his: StepPosition, hold: PartnerHold, angle: number): StepPosition {
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
export function deriveLadyInCouple(man: FigurePart, lady: FigurePart): FigurePart {
  // 女性自身の導出（lady）を各着地時刻に男性の枠へ取り付けた位置を、静止図用の着地点として保存する
  const start = coupleLadyFeetAt(man, lady, lady.steps, 0)
  let t = 0
  const steps = lady.steps.map((s) => {
    t += s.beats
    const feet = coupleLadyFeetAt(man, lady, lady.steps, t)
    return { ...s, position: feet[s.foot] }
  })
  return { startPositions: { L: start.L, R: start.R }, steps }
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
const CLEARANCE = 1.0
const MAX_BACKOFF = 30
/**
 * 女性の足を「自分の後方（相手から離れる向き）」へだけ動かして重なりを解消する。
 * 自由度を1つ（後退量 d）に絞り、d を最小から探すので、入力が連続なら結果も連続（フレーム間で飛ばない）。
 * ※以前の「最小移動方向へ反復押し出し＋4単位ずつ逃がす」方式は方向が切り替わるたびに数十単位ジャンプし、
 *   アニメが激しくブレた（実測: 全フィガーで1フレーム最大30〜56単位の跳び）。
 */
export const RESOLVE_FLAG = { enabled: true }
/**
 * 女性の足を「自分の後方（相手から離れる向き）」へ動かして重なりを解消するのに必要な最小距離 d を返す。
 * 自由度を1つに絞り最小の d を取るので、入力が連続ならほぼ連続。障害物が退路に入った瞬間だけ段差が出るため、
 * 呼び出し側で時間方向に平均して使う（backoffSmoothed）。
 * ※以前の「最小移動方向へ反復押し出し＋4単位ずつ逃がす」方式は方向が切り替わるたびに数十単位ジャンプし、
 *   アニメが激しくブレた（実測: 全フィガーで1フレーム最大30〜56単位の跳び）。
 */
function backoffDistance(foot: StepPosition, obstacles: StepPosition[]): number {
  if (!RESOLVE_FLAG.enabled) return 0
  const back = forwardOf(foot.angle)
  const clear = (d: number) => {
    const p = { ...foot, x: foot.x - back.x * d, y: foot.y - back.y * d }
    return obstacles.every((o) => footPenetration(o, p).pen <= -CLEARANCE)
  }
  if (clear(0)) return 0
  let lo = 0, hi = -1
  for (let d = 1; d <= MAX_BACKOFF; d += 1) { if (clear(d)) { hi = d; lo = d - 1; break } }
  if (hi < 0) return MAX_BACKOFF
  for (let i = 0; i < 12; i++) { const mid = (lo + hi) / 2; if (clear(mid)) hi = mid; else lo = mid }
  return hi
}
function applyBackoff(foot: StepPosition, d: number): StepPosition {
  if (d <= 0) return foot
  const back = forwardOf(foot.angle)
  return { ...foot, x: r1(foot.x - back.x * d), y: r1(foot.y - back.y * d) }
}

/** 歩列から「体の向き」を時刻 t で求める（各歩のアライメント角を、歩の進行に合わせて最短経路で補間。連続） */
export function bodyAngleAt(part: FigurePart, t: number): number {
  let prev = part.startPositions.L.angle
  let cursor = 0
  for (const s of part.steps) {
    const end = cursor + s.beats
    if (t >= end) { prev = s.position.angle; cursor = end; continue }
    if (t > cursor) {
      const p = (t - cursor) / s.beats
      const e = p * p * (3 - 2 * p)
      return lerpAngle(prev, s.position.angle, e)
    }
    return prev
  }
  return prev
}
function lerpAngle(a: number, b: number, t: number): number {
  const diff = ((b - a + 540) % 360) - 180
  return (a + diff * t + 360) % 360
}

const COUPLE_DIST = 60    // 男女の体の中心の距離（各自の足は中心から前後±15程度に出るので、余白が残る）
const COUPLE_PP_SIDE = 46 // PP/フォーラウェイ: 女性は男性の右横
const COUPLE_OP_SHIFT = 12

/** ホールドごとの女性中心のオフセット（男性の体の枠: ahead=前, right=右） */
function holdOffset(hold: PartnerHold): { ahead: number; right: number } {
  switch (hold) {
    case 'pp': return { ahead: 8, right: COUPLE_PP_SIDE }
    case 'fallaway': return { ahead: -8, right: COUPLE_PP_SIDE + 12 }
    case 'man_op': return { ahead: COUPLE_DIST, right: -COUPLE_OP_SHIFT }
    case 'lady_op': return { ahead: COUPLE_DIST, right: COUPLE_OP_SHIFT }
    case 'lady_left_op': return { ahead: COUPLE_DIST, right: -COUPLE_OP_SHIFT * 1.5 }
    default: return { ahead: COUPLE_DIST, right: 0 }
  }
}

/** 時刻 t のホールドオフセット。歩の切り替わりで前の歩のホールドから今の歩のホールドへ滑らかに移る（連続） */
function holdOffsetAt(man: FigurePart, ladySteps: Array<Pick<FigureStep, 'stepDescription' | 'beats'>>, t: number): { ahead: number; right: number } {
  const manStepAt = (tt: number) => {
    let acc = 0
    for (const s of man.steps) { acc += s.beats; if (tt <= acc + 1e-9) return s }
    return man.steps[man.steps.length - 1]
  }
  let acc = 0
  for (let i = 0; i < ladySteps.length; i++) {
    const end = acc + ladySteps[i].beats
    if (t <= end + 1e-9) {
      const cur = holdOffset(holdOf(ladySteps[i], manStepAt(end)))
      const prevStep = i > 0 ? ladySteps[i - 1] : ladySteps[0]
      const prev = holdOffset(holdOf(prevStep, manStepAt(Math.max(acc, 1e-6))))
      const p = ladySteps[i].beats > 0 ? Math.min(1, Math.max(0, (t - acc) / ladySteps[i].beats)) : 1
      const e = p * p * (3 - 2 * p)
      return { ahead: prev.ahead + (cur.ahead - prev.ahead) * e, right: prev.right + (cur.right - prev.right) * e }
    }
    acc = end
  }
  const last = ladySteps[ladySteps.length - 1]
  return holdOffset(holdOf(last, man.steps[man.steps.length - 1]))
}

/**
 * 両方表示のアニメ用（D-28 改）: 女性自身の導出（歩の形＝クローズ・横・クロスが正しい）を、
 * 男性の体の枠に毎フレーム「平行移動」して取り付ける。
 *   女性の体の中心 := 男性の体の中心 + ホールドのオフセット（男性の体の向き基準。歩の切り替わりで滑らかに補間）
 *   女性の足 := 女性自身の足 + （新しい中心 − 女性自身の中心）
 * すべての項が時間に連続なので、フレーム間で飛ばない。
 * ※初版の「男性の反対の足からの鏡映＋押し出し」は、押し出しが断続的に効いて1フレームで数十単位跳び、
 *   体の向きに足角度の円平均を使うと足が正反対を向く歩（ピボット等）で180°反転して跳んだ（実測 30〜88）ため置き換えた。
 */
export function coupleLadyFeetAt(man: FigurePart, lady: FigurePart, ladySteps: Array<Pick<FigureStep, 'stepDescription' | 'beats'>>, t: number, smooth = true): FeetState {
  const his = feetAt(man, t)
  const hers = feetAt(lady, t)
  const hisC = { x: (his.L.x + his.R.x) / 2, y: (his.L.y + his.R.y) / 2 }
  const hisA = bodyAngleAt(man, t)
  const f = forwardOf(hisA), r = rightOf(hisA)
  const { ahead, right } = holdOffsetAt(man, ladySteps, t)
  const target = { x: hisC.x + f.x * ahead + r.x * right, y: hisC.y + f.y * ahead + r.y * right }
  const herC = { x: (hers.L.x + hers.R.x) / 2, y: (hers.L.y + hers.R.y) / 2 }
  const dx = target.x - herC.x, dy = target.y - herC.y
  const shift = (p: StepPosition): StepPosition => ({ x: r1(p.x + dx), y: r1(p.y + dy), angle: p.angle })
  const rawL = shift(hers.L), rawR = shift(hers.R)
  const obstacles = [his.L, his.R]
  // 退避量は前後 ±0.12 拍の5点で平均し、段差をなだらかにする（決定的なので未来も参照できる）
  // 平均で滑らかにしつつ、今この瞬間に必要な量は必ず満たす（重なりゼロが優先。跳びは希にしか起きない）
  const nowL = backoffDistance(rawL, obstacles), nowR = backoffDistance(rawR, obstacles)
  const dL = smooth ? Math.max(nowL, backoffSmoothed(man, lady, ladySteps, t, 'L')) : nowL
  const dR = smooth ? Math.max(nowR, backoffSmoothed(man, lady, ladySteps, t, 'R')) : nowR
  return { ...hers, L: applyBackoff(rawL, dL), R: applyBackoff(rawR, dR) }
}

const SMOOTH_DT = 0.06
function backoffSmoothed(man: FigurePart, lady: FigurePart, ladySteps: Array<Pick<FigureStep, 'stepDescription' | 'beats'>>, t: number, side: FootSide): number {
  let sum = 0, n = 0
  for (let k = -2; k <= 2; k++) {
    const tt = t + k * SMOOTH_DT
    if (tt < 0) continue
    const feet = coupleLadyFeetAt(man, lady, ladySteps, tt, false)
    const his = feetAt(man, tt)
    sum += backoffDistance(feet[side], [his.L, his.R]); n++
  }
  return n ? sum / n : 0
}
