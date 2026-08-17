// docs/DATA_CHECK.md と docs/DATA_CHECK.html（教本照合シート）を public/data から機械生成する。手で編集しない（D-20）。
// 使い方: npm run data-check
import { readFileSync, writeFileSync } from 'node:fs'
import { ja } from '../src/i18n/locales/ja.ts'

const dir = 'public/data/waltz'
const idx = JSON.parse(readFileSync(`${dir}/figures.json`, 'utf8'))
const status = JSON.parse(readFileSync('scripts/data-check-warnings.json', 'utf8'))
const d = ja
const today = process.env.DATA_CHECK_DATE ?? new Date().toISOString().slice(0, 10)

const fmtStep = (s) => {
  const base = d.move[s.stepDescription.move].replace('{foot}', '').replace(/^を/, '').replace('（）', '')
  const mods = s.stepDescription.modifiers ?? []
  return mods.length ? `${base}（${mods.map((m) => d.modifier[m]).join('・')}）` : base
}
const fmtFw = (s) => (/^[HT]+$/.test(s.footwork) ? s.footwork : d.footwork[s.footwork])
const fmtAlign = (a) => d.relation[a.relation].replace('{dir}', (a.almost ? 'ほぼ' : '') + d.direction[a.direction])
const fmtTurn = (t) => {
  if (t.direction === 'none' || t.amount === '0') return 'なし'
  return `${d.turnDirection[t.direction]}${d.turnAmount[t.amount]}${t.between ? `(${t.between[0]}-${t.between[1]})` : ''}`
}
const row = (s) => [s.stepNo, s.foot, fmtStep(s), s.count, fmtFw(s), fmtAlign(s.alignment), fmtTurn(s.amountOfTurn), d.riseFall[s.riseAndFall], s.sway === 'straight' ? 'ｰ' : d.sway[s.sway], s.cbm ? '○' : '', s.note?.ja ?? '']
const HEAD = ['歩', '足', '足の位置', 'ｶｳﾝﾄ', 'FW', 'アライメント', '回転量', 'ライズ＆フォール', 'ｽｳｪｲ', 'CBM', 'メモ']

const figures = idx.map((e) => ({ entry: e, fig: JSON.parse(readFileSync(`${dir}/${e.id}.json`, 'utf8')) }))

// ---------- Markdown
const md = ['# ワルツ フィガー データ照合シート（現在値）', '',
  `生成: ${today}、\`npm run data-check\` で \`public/data/waltz/*.json\` から機械生成。教本と見比べて違う箇所を「フィガー／歩番号／列／教本の値」で教えてください。`,
  '回転量の「(1-2)」は歩間。スウェイ「ｰ」=ストレート。人間向けには同内容の `docs/DATA_CHECK.html` がある。', '']
for (const { entry, fig } of figures) {
  md.push(`## ${fig.name.ja} / ${fig.name.en}  (\`${entry.id}\`)`)
  if (status[entry.id]) md.push('', status[entry.id])
  for (const [role, label] of [['man', '男性'], ['lady', '女性']]) {
    md.push('', `### ${label}`, '', `| ${HEAD.join(' | ')} |`, `|${HEAD.map(() => '---').join('|')}|`)
    for (const s of fig.parts[role].steps) md.push(`| ${row(s).join(' | ')} |`)
  }
  md.push('')
}
writeFileSync('docs/DATA_CHECK.md', md.join('\n'))

// ---------- HTML（人間向け）
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const table = (steps) => `<table><thead><tr>${HEAD.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${steps.map((s) => `<tr>${row(s).map((c, i) => `<td class="c${i}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
const toc = figures.map(({ entry, fig }, i) => `<li><a href="#${entry.id}">${i + 1}. ${esc(fig.name.ja)}</a> <small>${esc(d.level[entry.level])}・${entry.stepCount}歩</small></li>`).join('')
const sections = figures.map(({ entry, fig }, i) => `
<section id="${entry.id}">
  <h2>${i + 1}. ${esc(fig.name.ja)} <small>${esc(fig.name.en)} / ${esc(d.level[entry.level])} / <code>${entry.id}</code></small></h2>
  ${status[entry.id] ? `<p class="status">${esc(status[entry.id])}</p>` : ''}
  <h3>男性</h3>${table(fig.parts.man.steps)}
  <h3 class="lady">女性</h3>${table(fig.parts.lady.steps)}
</section>`).join('')
const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PP ワルツ データ照合シート</title>
<style>
  :root{--ink:#222;--muted:#666;--line:#e3e6ea;--head:#f3f5f7;--man:#2b6f9e;--lady:#b0306a}
  body{font-family:-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif;color:var(--ink);margin:0;background:#fafbfc}
  header{position:sticky;top:0;background:#fff;border-bottom:1px solid var(--line);padding:10px 20px;z-index:2}
  header h1{font-size:18px;margin:0}
  header p{margin:4px 0 0;color:var(--muted);font-size:12px}
  main{max-width:1200px;margin:0 auto;padding:16px 20px 60px}
  nav ol{columns:2;font-size:14px;padding-left:20px}
  nav li{margin:2px 0}
  nav small{color:var(--muted)}
  section{background:#fff;border:1px solid var(--line);border-radius:8px;padding:12px 16px;margin:18px 0}
  h2{font-size:18px;margin:4px 0 8px}
  h2 small{font-weight:normal;color:var(--muted);font-size:12px}
  h3{font-size:14px;margin:12px 0 4px;color:var(--man)}
  h3.lady{color:var(--lady)}
  .status{font-size:13px;color:#2a7f4f;background:#eef8f1;border-radius:6px;padding:6px 10px;margin:6px 0}
  table{border-collapse:collapse;width:100%;font-size:13px}
  th,td{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
  th{background:var(--head);font-weight:600;white-space:nowrap;position:sticky;top:52px}
  td.c0,td.c1,td.c3{white-space:nowrap;text-align:center}
  td.c4{font-weight:700;white-space:nowrap}
  td.c10{color:var(--muted)}
  tr:hover td{background:#f7f9fb}
  @media print{header{position:static}section{break-inside:avoid;border:none}}
</style></head><body>
<header><h1>PP ワルツ データ照合シート（現在値）</h1><p>生成 ${today} — <code>npm run data-check</code> で public/data/waltz/*.json から機械生成。手で編集しない。違う箇所は「フィガー／歩番号／列／教本の値」で。回転量の (1-2) は歩間、スウェイ「ｰ」=ストレート。</p></header>
<main><nav><ol>${toc}</ol></nav>${sections}</main></body></html>`
writeFileSync('docs/DATA_CHECK.html', html)
console.log(`docs/DATA_CHECK.md / .html を更新（${figures.length}フィガー）`)
