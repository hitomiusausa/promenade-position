import { describe, it, expect } from 'vitest'
import { footworkColors, WEIGHT_COLORS, WEIGHT_COLORS_LIGHT } from './footworkColors'

describe('footworkColors', () => {
  it('T → トーのみ着色', () => {
    const c = footworkColors('T')
    expect(c.toe).toBe(WEIGHT_COLORS.toe)
    expect(c.heel).toBe(WEIGHT_COLORS.neutral)
    expect(c.dashed).toBe(false)
  })
  it('HT → 両方着色', () => {
    const c = footworkColors('HT')
    expect(c.toe).toBe(WEIGHT_COLORS.toe)
    expect(c.heel).toBe(WEIGHT_COLORS.heel)
  })
  it('flat → 両方フラット色', () => {
    const c = footworkColors('flat')
    expect(c.toe).toBe(WEIGHT_COLORS.flat)
    expect(c.heel).toBe(WEIGHT_COLORS.flat)
  })
  it('none → 点線・無色', () => {
    const c = footworkColors('none')
    expect(c.dashed).toBe(true)
    expect(c.toe).toBe('transparent')
  })
  it('未知の値 → グレー表示（落とさない）', () => {
    const c = footworkColors('XYZ' as never)
    expect(c.toe).toBe(WEIGHT_COLORS.neutral)
    expect(c.heel).toBe(WEIGHT_COLORS.neutral)
  })
  it('light バリアント → 同系統の淡色（女性パート用）', () => {
    const c = footworkColors('HT', 'light')
    expect(c.toe).toBe(WEIGHT_COLORS_LIGHT.toe)
    expect(c.heel).toBe(WEIGHT_COLORS_LIGHT.heel)
    expect(footworkColors('flat', 'light').toe).toBe(WEIGHT_COLORS_LIGHT.flat)
    // 体重なしはバリアントによらず点線・無色
    expect(footworkColors('none', 'light').dashed).toBe(true)
  })
})
