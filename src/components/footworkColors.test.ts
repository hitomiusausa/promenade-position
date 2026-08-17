import { describe, it, expect } from 'vitest'
import { footworkColors, WEIGHT_COLORS, WEIGHT_COLORS_LADY } from './footworkColors'

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
  it('lady バリアント → 同じ濃さの対比色パレット（女性パート用）', () => {
    const c = footworkColors('HT', 'lady')
    expect(c.toe).toBe(WEIGHT_COLORS_LADY.toe)
    expect(c.heel).toBe(WEIGHT_COLORS_LADY.heel)
    expect(footworkColors('flat', 'lady').toe).toBe(WEIGHT_COLORS_LADY.flat)
    // 体重なしはバリアントによらず点線・無色
    expect(footworkColors('none', 'lady').dashed).toBe(true)
  })
  it('教本の複合表記: H_IE_WF はヒール→全体、T_IE はトー、H_then_both_T はヒール＋トー', () => {
    expect(footworkColors('H_IE_WF').heel).toBe(WEIGHT_COLORS.heel)
    expect(footworkColors('H_IE_WF').toe).toBe(WEIGHT_COLORS.flat)
    expect(footworkColors('T_IE').toe).toBe(WEIGHT_COLORS.toe)
    expect(footworkColors('T_IE').heel).toBe(WEIGHT_COLORS.neutral)
    expect(footworkColors('H_then_both_T').heel).toBe(WEIGHT_COLORS.heel)
    expect(footworkColors('H_then_both_T').toe).toBe(WEIGHT_COLORS.toe)
  })
})
