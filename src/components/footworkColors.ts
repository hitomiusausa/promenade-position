import type { Footwork } from '../types'

export const WEIGHT_COLORS = {
  toe: '#e76f51',
  heel: '#457b9d',
  flat: '#2a9d8f',
  neutral: '#e9ecef',
} as const

export interface FootColors { toe: string; heel: string; dashed: boolean }

// 検証を通らない値が万一来ても描画は継続する（未知値=グレー）
export function footworkColors(fw: Footwork): FootColors {
  if (fw === 'none') return { toe: 'transparent', heel: 'transparent', dashed: true }
  if (fw === 'flat') return { toe: WEIGHT_COLORS.flat, heel: WEIGHT_COLORS.flat, dashed: false }
  if (!/^[HT]+$/.test(fw)) return { toe: WEIGHT_COLORS.neutral, heel: WEIGHT_COLORS.neutral, dashed: false }
  return {
    toe: fw.includes('T') ? WEIGHT_COLORS.toe : WEIGHT_COLORS.neutral,
    heel: fw.includes('H') ? WEIGHT_COLORS.heel : WEIGHT_COLORS.neutral,
    dashed: false,
  }
}
