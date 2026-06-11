import { describe, it, expect } from 'vitest'
import { parseHash } from './router'

describe('parseHash', () => {
  it('空・#/ は種目選択', () => {
    expect(parseHash('')).toEqual({ page: 'dances' })
    expect(parseHash('#/')).toEqual({ page: 'dances' })
  })
  it('#/figures/waltz はフィガー一覧', () => {
    expect(parseHash('#/figures/waltz')).toEqual({ page: 'figures', dance: 'waltz' })
  })
  it('#/figure/waltz/natural-turn はフィガー詳細', () => {
    expect(parseHash('#/figure/waltz/natural-turn')).toEqual({ page: 'figure', dance: 'waltz', figureId: 'natural-turn' })
  })
  it('不明なパスは種目選択にフォールバック', () => {
    expect(parseHash('#/unknown/x/y/z')).toEqual({ page: 'dances' })
  })
})
