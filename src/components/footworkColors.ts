import type { Footwork } from '../types'

export const WEIGHT_COLORS = {
  toe: '#e76f51',
  heel: '#457b9d',
  flat: '#2a9d8f',
  neutral: '#e9ecef',
} as const

// 女性パート用パレット（両方表示で男性と区別）。男性と同じ濃さのまま色相を
// 大きくずらした対比色。トー=暖色・ヒール=寒色の関係は男女で共通に保つ
// （厳密な補色だと女性ヒールが橙系になり男性トーと混同するため）。
export const WEIGHT_COLORS_LADY = {
  toe: '#d6336c',
  heel: '#7048a8',
  flat: '#8f9d2a',
  neutral: '#e9ecef',
} as const

export type FootVariant = 'man' | 'lady'

export interface FootColors { toe: string; heel: string; dashed: boolean }

// 検証を通らない値が万一来ても描画は継続する（未知値=グレー）
export function footworkColors(fw: Footwork, variant: FootVariant = 'man'): FootColors {
  const palette = variant === 'lady' ? WEIGHT_COLORS_LADY : WEIGHT_COLORS
  if (fw === 'none') return { toe: 'transparent', heel: 'transparent', dashed: true }
  if (fw === 'flat') return { toe: palette.flat, heel: palette.flat, dashed: false }
  if (!/^[HT]+$/.test(fw)) return { toe: palette.neutral, heel: palette.neutral, dashed: false }
  return {
    toe: fw.includes('T') ? palette.toe : palette.neutral,
    heel: fw.includes('H') ? palette.heel : palette.neutral,
    dashed: false,
  }
}
