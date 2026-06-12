import type { ReactElement } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LocaleProvider } from '../i18n'
import { RoleToggle } from './RoleToggle'
import { LanguageSwitcher } from './LanguageSwitcher'
import { PlaybackBar } from './PlaybackBar'

beforeEach(() => {
  localStorage.clear()
})

function withLocale(ui: ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>)
}

describe('RoleToggle', () => {
  it('3択を表示し、クリックで onChange', () => {
    const onChange = vi.fn()
    withLocale(<RoleToggle value="man" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: '女性' }))
    expect(onChange).toHaveBeenCalledWith('lady')
    expect(screen.getByRole('button', { name: '男性' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('LanguageSwitcher', () => {
  it('言語を切り替えるとlocalStorageに保存される', () => {
    withLocale(<LanguageSwitcher />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'en' } })
    expect(localStorage.getItem('pp-locale')).toBe('en')
  })
})

describe('PlaybackBar', () => {
  it('再生ボタンで play が呼ばれる', () => {
    const anim = { t: 0, playing: false, speed: 1, play: vi.fn(), pause: vi.fn(), seek: vi.fn(), setSpeed: vi.fn() }
    withLocale(<PlaybackBar anim={anim} total={6} />)
    fireEvent.click(screen.getByRole('button', { name: '再生' }))
    expect(anim.play).toHaveBeenCalled()
  })
  it('スライダーで seek が呼ばれる', () => {
    const anim = { t: 0, playing: false, speed: 1, play: vi.fn(), pause: vi.fn(), seek: vi.fn(), setSpeed: vi.fn() }
    withLocale(<PlaybackBar anim={anim} total={6} />)
    fireEvent.change(screen.getByRole('slider'), { target: { value: '3' } })
    expect(anim.seek).toHaveBeenCalledWith(3)
  })
  it('リセットボタンで先頭に戻って停止する', () => {
    const anim = { t: 6, playing: false, speed: 1, play: vi.fn(), pause: vi.fn(), seek: vi.fn(), setSpeed: vi.fn() }
    withLocale(<PlaybackBar anim={anim} total={6} />)
    fireEvent.click(screen.getByRole('button', { name: 'はじめに戻る' }))
    expect(anim.pause).toHaveBeenCalled()
    expect(anim.seek).toHaveBeenCalledWith(0)
  })
  it('速度ボタンで setSpeed が呼ばれ、再生中は一時停止ラベルになる', () => {
    const anim = { t: 1, playing: true, speed: 1, play: vi.fn(), pause: vi.fn(), seek: vi.fn(), setSpeed: vi.fn() }
    withLocale(<PlaybackBar anim={anim} total={6} />)
    fireEvent.click(screen.getByRole('button', { name: '0.5x' }))
    expect(anim.setSpeed).toHaveBeenCalledWith(0.5)
    fireEvent.click(screen.getByRole('button', { name: '一時停止' }))
    expect(anim.pause).toHaveBeenCalled()
  })
})
