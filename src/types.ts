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

/**
 * 教本が先行・後続に挙げるが本アプリに歩データが無いフィガーの「骨」。
 * 名前は教本の目次／表題から転記する（推測しない。D-15）。
 * フィガー一覧からは除外し、先行・後続リストではグレー表示・リンクなしにする。
 */
export interface FigureStub {
  id: string
  name: LocalizedText & { en: string }
  stub: true
  /** 教本での出典（目次番号やページ） */
  source: string
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

/**
 * 教本が先行・後続に付ける条件。教本の表現に1対1で対応させる（D-04: 列挙＋ja/en辞書をセットで）。
 * 列挙で表せない自由記述だけ transitions の note_ja / note_en に原文を転記する。
 */
export const TRANSITION_CONDITIONS = [
  // 入り方（後続フィガーの第1歩をどうとるか）
  'start_RF_OP_CBMP_forward',        // 右足 OP で CBMP に前進する場合
  'start_LF_left_OP_CBMP_forward',   // 左足左 OP で CBMP に前進する場合
  'start_LF_CBMP_back',              // 左足 CBMP に後退して始める
  'start_RF_PP_CBMP_across',         // PP で男子右足 CBMP にアクロスして前進
  'start_RF_PP_CBMP_forward',        // PP で男子右足 CBMP に前進
  'start_backing_DW',                // 壁斜めに背面して始める場合
  'start_facing_DC',                 // 中央斜めに始める場合
  // 終わり方（先行フィガーがどう終わるか）
  'ending_in_PP',                    // PP で終わるとき
  'ending_in_close_hold',            // クローズ・ホールドで終わる
  'ending_facing_new_DW',            // 新壁斜めに面して終わる
  'ending_facing_DW',                // 壁斜めに面して終わる
  'ending_facing_DC',                // 中央斜めに面して終わる
  'ending_facing_LOD',               // LOD に面して終わる
  'ending_backing_DW',               // 壁斜めに背面して終わる
  'ending_backing_DC',               // 中央斜めに背面して終わる
  'ending_backing_LOD',              // LOD に背面して終わる
  'ending_backing_almost_LOD',       // 終わりはほぼ LOD に背面して
  'ending_pointing_DC',              // 中央斜めに向けて終わる
  // 位置
  'at_corner',                       // コーナーで／アット・ア・コーナー
  // 回転量
  'overturned',                      // オーバーターンして
  'underturned',                     // アンダーターンして
  'turned_half',                     // 1/2 回転して
  'turned_quarter_or_half_left',     // 左へ 1/4、または 1/2 回転する
  'with_or_without_turn',            // 回転の有無にかかわらず
  // タイミング
  'count_1',                         // カウント 1
] as const
export type TransitionCondition = (typeof TRANSITION_CONDITIONS)[number]

/**
 * 教本の「先行・後続」1本。保存は常に from→to の一方向（先行欄の記述は from→to に正規化する）。
 * 教本にない繋がりは書かない・推測で補完しない（D-15）。
 */
export interface Transition {
  /** 先行フィガーの id（figures.json か stub に存在すること） */
  from: string
  /** 先行フィガーのうち実際に使う歩の範囲（省略=全歩）。例「リバース・ターンの4〜6歩」 */
  fromSteps?: [number, number]
  /** from のさらに前に教本が指定するフィガー。例「アンダーターンド・ナチュラル・スピン・ターンの後のリバース・ターンの4〜6歩」 */
  viaFigure?: string
  /**
   * 後続フィガーの id。教本が「すべてのナチュラル系フィガー」のように群で書いていて
   * 個別のフィガーを特定できない場合だけ null にし、note に原文を転記する（推測で展開しない）。
   */
  to: string | null
  /** 後続フィガーのうち実際に使う歩の範囲（省略=全歩） */
  toSteps?: [number, number]
  /** 教本の条件。無条件なら省略 */
  conditions?: TransitionCondition[]
  /** 列挙で表せない註の転記（原文まま。en は訳） */
  note_ja?: string
  note_en?: string
  /** 記載元フィガー＋ページ。複数の欄に同じ繋がりが載る場合は ';' 区切りで併記 */
  source: string
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
