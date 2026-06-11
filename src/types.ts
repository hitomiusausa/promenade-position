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

export const FOOTWORKS = ['H', 'T', 'TH', 'HT', 'THT', 'flat', 'none'] as const
export type Footwork = (typeof FOOTWORKS)[number]

export const ALIGNMENT_RELATIONS = ['facing', 'backing', 'pointing'] as const
export type AlignmentRelation = (typeof ALIGNMENT_RELATIONS)[number]

export const DIRECTIONS = ['LOD', 'DW', 'DC', 'wall', 'centre', 'against_LOD', 'DW_against_LOD', 'DC_against_LOD'] as const
export type Direction = (typeof DIRECTIONS)[number]

export const MOVES = ['forward', 'back', 'side', 'close', 'diag_forward', 'diag_back', 'cross_behind', 'cross_front', 'forward_PP', 'side_in_PP', 'replace_weight', 'brush'] as const
export type Move = (typeof MOVES)[number]

export const MODIFIERS = ['slightly_back', 'slightly_forward', 'small_step', 'outside_partner', 'in_PP', 'rightward', 'leftward'] as const
export type Modifier = (typeof MODIFIERS)[number]

export const RISE_FALLS = ['commence_rise_eo_1', 'commence_rise_eo_2', 'continue_rise', 'up', 'up_lower_eo_3', 'no_rise_fall', 'rise_slightly', 'lower_eo_3'] as const
export type RiseFall = (typeof RISE_FALLS)[number]

export const SWAYS = ['straight', 'L', 'R'] as const
export type Sway = (typeof SWAYS)[number]

export const TURN_DIRECTIONS = ['right', 'left', 'none'] as const
export type TurnDirection = (typeof TURN_DIRECTIONS)[number]
export const TURN_AMOUNTS = ['0', '1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8', '1'] as const
export type TurnAmount = (typeof TURN_AMOUNTS)[number]

export interface StepPosition { x: number; y: number; angle: number }

export interface FigureStep {
  stepNo: number
  foot: FootSide
  stepDescription: { move: Move; modifier?: Modifier }
  count: string
  beats: number
  footwork: Footwork
  alignment: { relation: AlignmentRelation; direction: Direction }
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
