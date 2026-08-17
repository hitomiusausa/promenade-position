import { describe, it, expect } from 'vitest'
import { TRANSITION_CONDITIONS } from '../types'
import { validateAmalgamations, validateFigureIndex, validateTransitionData, checkTransitionsAgainstFigures } from './validate'
import { followingOf, precedingOf, followingFigureIds, getTransitionData, stubsOf } from './transitions'
import { ja } from '../i18n/locales/ja'
import { en } from '../i18n/locales/en'
import raw from './transitions.json'

const waltzIndex = validateFigureIndex(
  (await import('../../public/data/waltz/figures.json')).default,
)
const figureIds = waltzIndex.map((f) => f.id)

describe('transitions.json の検証', () => {
  it('スキーマを通る', () => {
    const data = validateTransitionData(raw, 'waltz')
    expect(data.transitions.length).toBeGreaterThan(0)
    expect(data.stubs.length).toBeGreaterThan(0)
  })

  it('from/to/viaFigure が figures.json か stub に存在し、重複が無く、未使用 stub が無い', () => {
    checkTransitionsAgainstFigures(validateTransitionData(raw, 'waltz'), figureIds)
  })

  it('全エントリに source がある（独立検収の担保）', () => {
    for (const t of getTransitionData('waltz').transitions) expect(t.source).not.toBe('')
  })

  it('to が null のエントリは教本の原文を note_ja に持つ', () => {
    for (const t of getTransitionData('waltz').transitions) {
      if (t.to === null) expect(typeof t.note_ja).toBe('string')
    }
  })

  it('条件コードは ja/en 両辞書に対訳がある（D-04）', () => {
    for (const c of TRANSITION_CONDITIONS) {
      expect(ja.transitionCondition[c], `ja.${c}`).toBeTruthy()
      expect(en.transitionCondition[c], `en.${c}`).toBeTruthy()
    }
  })

  it('同じ繋がりが2エントリに分かれていない（後続欄と先行欄の記述は1本にまとめ source を併記する）', () => {
    const seen = new Map<string, number>()
    getTransitionData('waltz').transitions.forEach((t, i) => {
      const link = JSON.stringify([t.from, t.fromSteps ?? null, t.viaFigure ?? null, t.to, t.toSteps ?? null, [...(t.conditions ?? [])].sort()])
      const prev = seen.get(link)
      if (prev !== undefined) throw new Error(`transitions[${prev}] と transitions[${i}] が同じ繋がり: ${link}`)
      seen.set(link, i)
    })
  })

  it('教本内部の相互参照が併記されている（後続欄と先行欄の両方に載る繋がりが一定数ある）', () => {
    const both = getTransitionData('waltz').transitions.filter((t) => t.source.includes('; '))
    expect(both.length).toBeGreaterThan(20)
  })

  it('歩の範囲は元フィガーの歩数に収まる', () => {
    const stepCount = new Map(waltzIndex.map((f) => [f.id, f.stepCount]))
    for (const t of getTransitionData('waltz').transitions) {
      if (t.fromSteps && stepCount.has(t.from)) expect(t.fromSteps[1]).toBeLessThanOrEqual(stepCount.get(t.from)!)
      if (t.toSteps && t.to && stepCount.has(t.to)) expect(t.toSteps[1]).toBeLessThanOrEqual(stepCount.get(t.to)!)
    }
  })
})

describe('検証ルールが実際に弾く', () => {
  const base = { waltz: { stubs: [], transitions: [{ from: 'a', to: 'b', source: 'x' }] } }
  it('source が無いエントリを弾く', () => {
    expect(() => validateTransitionData({ waltz: { stubs: [], transitions: [{ from: 'a', to: 'b' }] } }, 'waltz')).toThrow(/source/)
  })
  it('列挙に無い条件コードを弾く', () => {
    expect(() => validateTransitionData({ waltz: { stubs: [], transitions: [{ from: 'a', to: 'b', conditions: ['nope'], source: 'x' }] } }, 'waltz')).toThrow(/conditions/)
  })
  it('to が null で原文が無いものを弾く', () => {
    expect(() => validateTransitionData({ waltz: { stubs: [], transitions: [{ from: 'a', to: null, source: 'x' }] } }, 'waltz')).toThrow(/note_ja/)
  })
  it('歩データを持つ stub を弾く', () => {
    const bad = { waltz: { stubs: [{ id: 's', name: { en: 'S' }, stub: true, source: 'p', stepCount: 3 }], transitions: [] } }
    expect(() => validateTransitionData(bad, 'waltz')).toThrow(/歩データを持たない/)
  })
  it('未使用 stub を弾く', () => {
    const data = validateTransitionData({ waltz: { stubs: [{ id: 's', name: { en: 'S' }, stub: true, source: 'p' }], transitions: [] } }, 'waltz')
    expect(() => checkTransitionsAgainstFigures(data, ['a'])).toThrow(/参照されていない/)
  })
  it('figures.json にも stub にも無い id を弾く', () => {
    expect(() => checkTransitionsAgainstFigures(validateTransitionData(base, 'waltz'), ['a'])).toThrow(/無い id/)
  })
  it('重複エントリを弾く', () => {
    const dup = { waltz: { stubs: [], transitions: [{ from: 'a', to: 'b', source: 'x' }, { from: 'a', to: 'b', source: 'y' }] } }
    expect(() => checkTransitionsAgainstFigures(validateTransitionData(dup, 'waltz'), ['a', 'b'])).toThrow(/重複/)
  })
})

describe('推奨アマルガメーション（教本 p.51）との整合（教本内部の突き合わせ）', () => {
  it('隣接ペアのうち transitions に無いのは既知の2本だけ', async () => {
    const amalgamations = validateAmalgamations((await import('../../public/data/waltz/amalgamations.json')).default)
    const links = new Set(getTransitionData('waltz').transitions.map((t) => `${t.from}>${t.to}`))
    const missing: string[] = []
    for (const a of amalgamations) {
      for (let i = 0; i + 1 < a.figures.length; i++) {
        const pair = `${a.figures[i].figure}>${a.figures[i + 1].figure}`
        if (!links.has(pair)) missing.push(`${a.id}: ${pair}`)
      }
    }
    // 教本 #19/#20 には先行欄が無く、後続欄も複合フィガーでなく素のフィガー名を挙げるため生じる
    // 教本内部の隙間。推測で transitions を足して埋めない（D-15）。
    expect(missing).toEqual([
      'basic-4: reverse-turn>whisk-weave',
      'basic-6: backward-lock-step>open-impetus-weave',
    ])
  })
})

describe('セレクタ', () => {
  it('後続一覧を返す（教本 p.17: LFクローズドチェンジ → ナチュラル・ターン）', () => {
    const ids = followingOf('waltz', 'closed-change-reverse').map((t) => t.to)
    expect(ids).toContain('natural-turn')
    expect(ids).toContain('running-spin-turn')
  })

  it('先行一覧を返す（教本 p.17: ナチュラル・ターン ← LFクローズドチェンジ）', () => {
    const ids = precedingOf('waltz', 'natural-turn').map((t) => t.from)
    expect(ids).toContain('closed-change-reverse')
    expect(ids).toContain('outside-spin')
  })

  it('先行欄の記述が from→to に正規化されている（p.17 の1本が両方から引ける）', () => {
    const fwd = followingOf('waltz', 'closed-change-reverse').filter((t) => t.to === 'natural-turn')
    const back = precedingOf('waltz', 'natural-turn').filter((t) => t.from === 'closed-change-reverse')
    expect(fwd).toHaveLength(1)
    expect(back).toEqual(fwd)
    // 後続欄(p.17)と先行欄(p.18)の両方に載るので source が併記される
    expect(fwd[0].source.split('; ').length).toBe(2)
  })

  it('歩の範囲を保持する（教本 p.22: ナチュラル・スピン・ターン → リバース・ターンの4〜6歩）', () => {
    const t = followingOf('waltz', 'natural-spin-turn').find((x) => x.to === 'reverse-turn')
    expect(t?.fromSteps).toBeUndefined()
    expect(t?.toSteps).toEqual([4, 6])
  })

  it('viaFigure を保持する（教本 p.29: アンダーターンド・ナチュラル・スピン・ターンの後のリバース・ターンの4〜6歩）', () => {
    const t = precedingOf('waltz', 'closed-telemark').find((x) => x.viaFigure === 'underturned-natural-spin-turn')
    expect(t?.from).toBe('reverse-turn')
    expect(t?.fromSteps).toEqual([4, 6])
  })

  it('followingFigureIds は stub と群参照を落とす', () => {
    const ids = followingFigureIds('waltz', 'natural-turn', figureIds)
    expect(ids).not.toContain(null)
    expect(ids.every((id) => figureIds.includes(id))).toBe(true)
    // 教本 p.32 の後続「ウイング」「ウイーブ」は stub なので落ちる
    const withStubs = followingOf('waltz', 'open-impetus-turn').map((t) => t.to)
    expect(withStubs).toContain('wing')
    expect(followingFigureIds('waltz', 'open-impetus-turn', figureIds)).not.toContain('wing')
  })

  it('stub は4件で、いずれも歩データを持たない', () => {
    const s = stubsOf('waltz')
    expect(s.map((x) => x.id).sort()).toEqual(['cross-hesitation', 'quick-natural-spin-turn', 'weave', 'wing'])
    for (const x of s) expect(x.stub).toBe(true)
  })
})
