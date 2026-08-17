import type { FigureIndexEntry, LocalizedText, Transition } from '../types'
import { localized, useI18n } from '../i18n'
import { figureNameMap, followingOf, precedingOf } from '../data/transitions'

/**
 * 教本が挙げる先行・後続の2リスト。
 * 収録済みフィガーはリンク、stub は「未収録」でグレー・リンクなし。
 * 教本が群で書いていて特定できないもの（to が null）は原文を註として出す（推測で展開しない。D-15）。
 */
export function TransitionLists({ dance, figureId, figures }: { dance: string; figureId: string; figures: FigureIndexEntry[] }) {
  const preceding = precedingOf(dance, figureId)
  const following = followingOf(dance, figureId)
  if (preceding.length === 0 && following.length === 0) return null
  return (
    <section className="transitions">
      <TransitionList dance={dance} figures={figures} items={preceding} side="from" titleKey="preceding" descKey="precedingDesc" />
      <TransitionList dance={dance} figures={figures} items={following} side="to" titleKey="following" descKey="followingDesc" />
    </section>
  )
}

function TransitionList({
  dance, figures, items, side, titleKey, descKey,
}: {
  dance: string
  figures: FigureIndexEntry[]
  items: Transition[]
  side: 'from' | 'to'
  titleKey: 'preceding' | 'following'
  descKey: 'precedingDesc' | 'followingDesc'
}) {
  const { dict, locale } = useI18n()
  const names = figureNameMap(dance, figures)

  return (
    <div className="transition-list">
      <h3>{dict.ui[titleKey]}</h3>
      <p className="transition-desc">{dict.ui[descKey]}</p>
      {items.length === 0 ? (
        <p className="status">{dict.ui.noTransitions}</p>
      ) : (
        <ul>
          {items.map((t, i) => {
            const id = side === 'from' ? t.from : t.to
            const steps = side === 'from' ? t.fromSteps : t.toSteps
            // 相手側の範囲＝このフィガー自身のどの歩に繋がるか
            const ownSteps = side === 'from' ? t.toSteps : t.fromSteps
            const entry = id === null ? undefined : names.get(id)
            const note = locale === 'ja' ? t.note_ja : (t.note_en ?? t.note_ja)
            return (
              <li key={i}>
                {id === null || entry === undefined ? (
                  <span className="transition-name is-stub">—</span>
                ) : entry.stub ? (
                  <span className="transition-name is-stub">
                    {localized(entry.name as LocalizedText & { en: string }, locale)}
                    <span className="transition-badge is-muted">{dict.ui.notIncluded}</span>
                  </span>
                ) : (
                  <a className="transition-name" href={`#/figure/${dance}/${id}`}>
                    {localized(entry.name as LocalizedText & { en: string }, locale)}
                  </a>
                )}
                {steps && (
                  <span className="transition-badge">
                    {dict.ui.stepRange.replace('{from}', String(steps[0])).replace('{to}', String(steps[1]))}
                  </span>
                )}
                {ownSteps && (
                  <span className="transition-badge is-muted">
                    {dict.ui.thisFigureSteps.replace('{from}', String(ownSteps[0])).replace('{to}', String(ownSteps[1]))}
                  </span>
                )}
                {t.viaFigure && names.get(t.viaFigure) && (
                  <span className="transition-badge">
                    {dict.ui.viaFigure.replace('{name}', localized(names.get(t.viaFigure)!.name as LocalizedText & { en: string }, locale))}
                  </span>
                )}
                {t.conditions?.map((c) => (
                  <span key={c} className="transition-badge">{dict.transitionCondition[c]}</span>
                ))}
                {note && <span className="transition-note">{note}</span>}
                <span className="transition-source">{t.source}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
