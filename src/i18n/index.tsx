import { createContext, useContext, useState, type ReactNode } from 'react'
import type {
  AlignmentRelation, DanceId, Direction, FigureStep, FootSide, Footwork,
  Level, LocaleId, LocalizedText, Modifier, Move, RiseFall, Sway,
} from '../types'
import { ja } from './locales/ja'
import { en } from './locales/en'

export type UiKey =
  | 'appName' | 'selectDance' | 'figureList' | 'play' | 'pause' | 'speed'
  | 'man' | 'lady' | 'both' | 'step' | 'footColumn' | 'count' | 'footwork'
  | 'alignment' | 'amountOfTurn' | 'riseAndFall' | 'sway' | 'cbm' | 'yes' | 'no'
  | 'note' | 'back' | 'loading' | 'loadError' | 'retry' | 'comingSoon' | 'steps'
  | 'language' | 'startPosition'

export interface Dictionary {
  ui: Record<UiKey, string>
  dance: Record<DanceId, string>
  level: Record<Level, string>
  foot: Record<FootSide, string>
  footwork: Record<Footwork, string>
  footworkPart: Record<'H' | 'T', string>
  relation: Record<AlignmentRelation, string>
  direction: Record<Direction, string>
  move: Record<Move, string>
  modifier: Record<Modifier, string>
  riseFall: Record<RiseFall, string>
  sway: Record<Sway, string>
  turn: { none: string; withBetween: string; noBetween: string }
  turnDirection: { right: string; left: string }
}

export const DICTIONARIES: Partial<Record<LocaleId, Dictionary>> = { ja, en }

export const LOCALE_NAMES: Record<LocaleId, string> = {
  ja: '日本語', en: 'English', ko: '한국어', tl: 'Tagalog', 'zh-CN': '简体中文',
  'zh-TW': '繁體中文', pt: 'Português', es: 'Español', it: 'Italiano', fr: 'Français',
}

export function localized(text: LocalizedText, locale: LocaleId): string {
  return text[locale] ?? text.en ?? Object.values(text)[0] ?? ''
}

export function formatAlignment(a: FigureStep['alignment'], d: Dictionary): string {
  return d.relation[a.relation].replace('{dir}', d.direction[a.direction])
}

export function formatStepDescription(foot: FootSide, sd: FigureStep['stepDescription'], d: Dictionary): string {
  const base = d.move[sd.move].replace('{foot}', d.foot[foot])
  return sd.modifier ? `${base}（${d.modifier[sd.modifier]}）` : base
}

export function formatTurn(t: FigureStep['amountOfTurn'], d: Dictionary): string {
  if (t.direction === 'none' || t.amount === '0') return d.turn.none
  const dir = d.turnDirection[t.direction as 'right' | 'left']
  if (t.between) {
    return d.turn.withBetween
      .replace('{dir}', dir).replace('{amount}', t.amount)
      .replace('{from}', String(t.between[0])).replace('{to}', String(t.between[1]))
  }
  return d.turn.noBetween.replace('{dir}', dir).replace('{amount}', t.amount)
}

export function formatFootwork(fw: Footwork, d: Dictionary): string {
  if (fw === 'flat' || fw === 'none') return d.footwork[fw]
  return fw.split('').map((c) => d.footworkPart[c as 'H' | 'T']).join('→')
}

const LocaleContext = createContext<{
  locale: LocaleId
  setLocale: (l: LocaleId) => void
  dict: Dictionary
} | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleId>(() => {
    const saved = localStorage.getItem('pp-locale')
    return saved && saved in LOCALE_NAMES ? (saved as LocaleId) : 'ja'
  })
  const setLocale = (l: LocaleId) => {
    localStorage.setItem('pp-locale', l)
    setLocaleState(l)
  }
  const dict = DICTIONARIES[locale] ?? en
  return <LocaleContext.Provider value={{ locale, setLocale, dict }}>{children}</LocaleContext.Provider>
}

export function useI18n() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useI18n は LocaleProvider の内側で使うこと')
  return ctx
}
