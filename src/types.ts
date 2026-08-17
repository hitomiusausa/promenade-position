export const LOCALES = ['ja', 'en', 'ko', 'tl', 'zh-CN', 'zh-TW', 'pt', 'es', 'it', 'fr'] as const
export type LocaleId = (typeof LOCALES)[number]
export type LocalizedText = Partial<Record<LocaleId, string>>

export const DANCES = ['waltz', 'tango', 'slow_foxtrot', 'quickstep', 'viennese_waltz', 'cha_cha_cha', 'rumba', 'samba', 'paso_doble', 'jive'] as const
export type DanceId = (typeof DANCES)[number]

export const DANCE_BPM: Record<DanceId, number> = {
  waltz: 90, tango: 66, slow_foxtrot: 120, quickstep: 200, viennese_waltz: 180,
  cha_cha_cha: 120, rumba: 104, samba: 100, paso_doble: 124, jive: 176,
}

export type Role = 'man' | 'lady'
export type ViewRole = Role | 'both'
export type FootSide = 'L' | 'R'

export const FOOTWORKS = ['H', 'T', 'TH', 'HT', 'THT', 'flat', 'none', 'H_IE_WF', 'T_IE', 'H_then_both_T', 'both_T', 'T_other_TH', 'both_T_then_other_TH', 'ball_flat'] as const
export type Footwork = (typeof FOOTWORKS)[number]

export const ALIGNMENT_RELATIONS = ['facing', 'backing', 'pointing'] as const
export type AlignmentRelation = (typeof ALIGNMENT_RELATIONS)[number]

export const DIRECTIONS = ['LOD', 'DW', 'DC', 'wall', 'centre', 'against_LOD', 'DW_against_LOD', 'DC_against_LOD'] as const
export type Direction = (typeof DIRECTIONS)[number]

export const MOVES = ['forward', 'back', 'side', 'close', 'diag_forward', 'diag_back', 'cross_behind', 'cross_front', 'forward_PP', 'side_in_PP', 'replace_weight', 'brush', 'close_no_weight', 'hold_position', 'begin_close'] as const
export type Move = (typeof MOVES)[number]

export const MODIFIERS = ['slightly_back', 'slightly_forward', 'small_step', 'outside_partner', 'in_PP', 'rightward', 'leftward', 'slightly_side', 'in_CBMP', 'heel_turn', 'shoulder_lead', 'left_outside_partner', 'preparing_left_OP', 'preparing_OP', 'very_small', 'loosely', 'in_fallaway', 'between_partners_feet', 'strong_step', 'across'] as const
export type Modifier = (typeof MODIFIERS)[number]

export const RISE_FALLS = ['commence_rise_eo_1', 'commence_rise_eo_2', 'continue_rise', 'up', 'up_lower_eo_3', 'no_rise_fall', 'rise_slightly', 'lower_eo_3', 'commence_rise_eo_1_nfr', 'commence_rise_eo_2_nfr', 'continue_rise_lower_eo_3', 'down', 'rise', 'down_commence_rise_eo_1', 'down_commence_rise_eo_1_nfr', 'down_commence_rise_eo_2', 'commence_rise_slightly_eo_1_nfr', 'rise_slightly_2_3_nfr', 'lower_3', 'down_relax_knees'] as const
export type RiseFall = (typeof RISE_FALLS)[number]

export const SWAYS = ['straight', 'L', 'R'] as const
export type Sway = (typeof SWAYS)[number]

export const TURN_DIRECTIONS = ['right', 'left', 'none'] as const
export type TurnDirection = (typeof TURN_DIRECTIONS)[number]
export const TURN_AMOUNTS = ['0', '1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8', '1', '1/4+', '3/8-', '3/8+', '5/8-'] as const
export type TurnAmount = (typeof TURN_AMOUNTS)[number]

export interface StepPosition { x: number; y: number; angle: number }

export interface FigureStep {
  stepNo: number
  foot: FootSide
  stepDescription: { move: Move; modifiers?: Modifier[] }
  count: string
  beats: number
  footwork: Footwork
  alignment: { relation: AlignmentRelation; direction: Direction; almost?: boolean }
  amountOfTurn: { direction: TurnDirection; amount: TurnAmount; between?: [number, number] }
  riseAndFall: RiseFall
  sway: Sway
  cbm: boolean
  position: StepPosition
  note?: LocalizedText
}

export interface FigurePart {
  startPositions: Record<FootSide, StepPosition>
  steps: FigureStep[]
}

export interface Figure {
  id: string
  name: LocalizedText & { en: string }
  dance: DanceId
  timeSignature: string
  parts: Record<Role, FigurePart>
  /** 「両方」表示用: 男性の足を基準に鏡映配置した女性パート（重なりを避ける。D-28）。歩データは parts.lady と同一 */
  ladyInCouple?: FigurePart
}

export type Level = 'beginner' | 'intermediate' | 'advanced'

export interface FigureIndexEntry {
  id: string
  name: LocalizedText & { en: string }
  level: Level
  stepCount: number
}

export interface DanceInfo {
  id: DanceId
  name: LocalizedText & { en: string }
  category: 'standard' | 'latin'
  available: boolean
}

/** アマルガメーション（フィガーの連結）。教本の推奨アマルガメーション等 */
export interface AmalgamationItem {
  figure: string
  /** 男性の歩番号範囲（省略=全歩）。女性も同じ範囲 */
  steps?: [number, number]
  note?: LocalizedText
}
export interface Amalgamation {
  id: string
  name: LocalizedText & { en: string }
  source?: string
  figures: AmalgamationItem[]
  note?: LocalizedText
}

/** 合成結果: Figure と同じ形で描画・再生でき、フィガー境界を segments に持つ */
export interface AmalgamationSegment {
  figureId: string
  name: LocalizedText & { en: string }
  /** 通し番号（1始まり）での範囲 */
  from: number
  to: number
  /** 元フィガーでの歩番号範囲 */
  sourceSteps: [number, number]
  note?: LocalizedText
}
export interface CompositeFigure extends Figure {
  segments: AmalgamationSegment[]
}
