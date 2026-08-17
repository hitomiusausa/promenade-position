// docs/DATA_CHECK.md（教本照合シート）を public/data から機械生成する。手で編集しない（D-20）。
// 使い方: node scripts/gen-data-check.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { ja } from '../src/i18n/locales/ja.ts'

const dir = 'public/data/waltz'
const idx = JSON.parse(readFileSync(`${dir}/figures.json`, 'utf8'))
const d = ja
const lines = [
  '# ワルツ10フィガー データ照合シート（現在値）', '',
  `生成: ${new Date().toISOString().slice(0, 10)}、\`node scripts/gen-data-check.mjs\` で \`public/data/waltz/*.json\` から機械生成。教本と見比べて違う箇所を「フィガー／歩番号／列／教本の値」で教えてください。`,
  'ROADMAP の「自信が低い箇所」には ⚠ を付ける。回転量の「(1-2)」は歩間。スウェイ「ｰ」=ストレート。', '',
]
const warn = JSON.parse(readFileSync('scripts/data-check-warnings.json', 'utf8'))
const fmtStep = (s) => {
  const base = d.move[s.stepDescription.move].replace('{foot}', '').replace(/^を/, '')
  const mods = s.stepDescription.modifiers ?? []
  return mods.length ? `${base}（${mods.map((m) => d.modifier[m]).join('・')}）` : base
}
const fmtTurn = (t) => {
  if (t.direction === 'none' || t.amount === '0') return 'なし'
  return `${d.turnDirection[t.direction]}${t.amount}${t.between ? `(${t.between[0]}-${t.between[1]})` : ''}`
}
for (const e of idx) {
  const f = JSON.parse(readFileSync(`${dir}/${e.id}.json`, 'utf8'))
  lines.push(`## ${f.name.ja} / ${f.name.en}  (\`${e.id}\`)`)
  if (warn[e.id]) lines.push('', warn[e.id])
  for (const [role, label] of [['man', '男性'], ['lady', '女性']]) {
    lines.push('', `### ${label}`, '')
    lines.push('| 歩 | 足 | ステップ | ｶｳﾝﾄ | FW | アライメント | 回転量 | ライズ＆フォール | ｽｳｪｲ | CBM | メモ |')
    lines.push('|---|---|---|---|---|---|---|---|---|---|---|')
    for (const s of f.parts[role].steps) {
      const al = d.relation[s.alignment.relation].replace('{dir}', d.direction[s.alignment.direction])
      lines.push(`| ${s.stepNo} | ${s.foot} | ${fmtStep(s)} | ${s.count} | ${/^[HT]+$/.test(s.footwork) ? s.footwork : d.footwork[s.footwork]} | ${al} | ${fmtTurn(s.amountOfTurn)} | ${d.riseFall[s.riseAndFall]} | ${s.sway === 'straight' ? 'ｰ' : d.sway[s.sway]} | ${s.cbm ? '○' : ''} | ${s.note?.ja ?? ''} |`)
    }
  }
  lines.push('')
}
writeFileSync('docs/DATA_CHECK.md', lines.join('\n'))
console.log('docs/DATA_CHECK.md を更新')
