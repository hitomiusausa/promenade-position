import { describe, it, expect } from 'vitest'
import { ja } from './locales/ja'
import { en } from './locales/en'
import { formatAlignment, formatStepDescription, formatTurn, formatFootwork, localized } from './index'

describe('i18n formatters', () => {
  it('アライメント: ja', () => {
    expect(formatAlignment({ relation: 'backing', direction: 'DC' }, ja)).toBe('中央斜めに背面して')
  })
  it('アライメント: en', () => {
    expect(formatAlignment({ relation: 'facing', direction: 'DW' }, en)).toBe('Facing DW')
  })
  it('足の位置: ja（修飾語つき）', () => {
    expect(formatStepDescription('L', { move: 'side', modifier: 'slightly_back' }, ja)).toBe('左足横へ（少し後ろに）')
  })
  it('足の位置: en', () => {
    expect(formatStepDescription('R', { move: 'forward' }, en)).toBe('RF forward')
  })
  it('回転量: 区間つき', () => {
    expect(formatTurn({ direction: 'right', amount: '1/4', between: [1, 2] }, ja)).toBe('右へ1/4（1-2歩間）')
  })
  it('回転量: なし', () => {
    expect(formatTurn({ direction: 'none', amount: '0' }, ja)).toBe('回転なし')
  })
  it('フットワーク: HT → 語の連結', () => {
    expect(formatFootwork('HT', ja)).toBe('ヒール→トー')
    expect(formatFootwork('flat', en)).toBe('Flat')
  })
  it('localized: 指定言語→en→任意 の順でフォールバック', () => {
    expect(localized({ ja: 'ワルツ', en: 'Waltz' }, 'ja')).toBe('ワルツ')
    expect(localized({ en: 'Waltz' }, 'ko')).toBe('Waltz')
  })
  it('足の位置: en（修飾語つき・ASCII括弧）', () => {
    expect(formatStepDescription('R', { move: 'side', modifier: 'small_step' }, en)).toBe('RF to side (small step)')
  })
  it('回転量: 区間なし', () => {
    expect(formatTurn({ direction: 'left', amount: '1/8' }, ja)).toBe('左へ1/8')
  })
})
