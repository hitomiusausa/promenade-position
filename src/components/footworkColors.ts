import type { Footwork } from '../types'

export const WEIGHT_COLORS = {
  toe: '#e76f51',
  heel: '#457b9d',
  flat: '#2a9d8f',
  neutral: '#e9ecef',
} as const

// 女性パート用の淡色パレット（両方表示で男性と区別。色相は重心色と同系統を保つ）
export const WEIGHT_COLORS_LIGHT = {
  toe: '#f4b8a8',
  heel: '#a9c6da',
  flat: '#a5d8d0',
  neutral: '#f1f3f5',
} as const

export type FootVariant = 'strong' | 'light'

export interface FootColors { toe: string; heel: string; dashed: boolean }

// 検証を通らない値が万一来ても描画は継続する（未知値=グレー）
export function footworkColors(fw: Footwork, variant: FootVariant = 'strong'): FootColors {
  const palette = variant === 'light' ? WEIGHT_COLORS_LIGHT : WEIGHT_COLORS
  if (fw === 'none') return { toe: 'transparent', heel: 'transparent', dashed: true }
  if (fw === 'flat') return { toe: palette.flat, heel: palette.flat, dashed: false }
  if (!/^[HT]+$/.test(fw)) return { toe: palette.neutral, heel: palette.neutral, dashed: false }
  return {
    toe: fw.includes('T') ? palette.toe : palette.neutral,
    heel: fw.includes('H') ? palette.heel : palette.neutral,
    dashed: false,
  }
}
