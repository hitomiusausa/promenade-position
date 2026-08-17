# CLAUDE.md — PP（Promenade Position）作業指針

社交ダンスの足型・フィガー学習アプリ。ISTD教本ベースのワルツ基本フィガー10個を、重心色分け付きSVG足型図・アニメ再生・男性/女性/両方表示で学べる静的SPA。

- 公開先: https://hitomiusausa.github.io/promenade-position/ （main へのプッシュで自動デプロイ）
- リポジトリ: https://github.com/hitomiusausa/promenade-position
- 読み順: 本書 → `docs/HANDOVER.md`（現在地・次のキュー） → `docs/DECISIONS.md`（判断の理由） → `docs/ROADMAP.md`（候補一覧） → 設計書 `docs/superpowers/specs/2026-06-11-pp-dance-figures-design.md`

## 技術スタック

Vite 6 / React 18 / TypeScript 5.7 / Vitest 3 + Testing Library。依存は最小（ルーティング・i18n は自前実装、外部ライブラリ追加は判断を DECISIONS.md に残すこと）。

## コマンド

```bash
npm install
npm run dev            # 開発サーバー
npm test               # 全テスト（全フィガーデータのスキーマ・値チェック込み）
npm run validate-data  # データ検証だけ
npm run data-check     # docs/DATA_CHECK.md と .html（教本照合シート）を再生成（Node 22+）
npm run build          # vitest → tsc → vite build（テストが赤ならビルドしない）
```

## ディレクトリ

```
public/data/dances.json           種目一覧（available: true の種目だけ入れる）
public/data/waltz/figures.json    ワルツのフィガー目次
public/data/waltz/<id>.json       フィガー1個=1ファイル（男女両パート）
public/data/waltz/amalgamations.json  推奨アマルガメーション（フィガーの連結。D-27）
src/types.ts                      型・ISTDコード値の列挙・DANCE_BPM
src/data/validate.ts / loader.ts  データ検証・読込
src/data/amalgamation.ts          フィガー連結（アマルガメーション合成）
src/i18n/                         辞書（locales/ja.ts, en.ts）とフォーマッタ
src/animation/interpolate.ts      足位置の補間（純粋関数）
src/hooks/useAnimation.ts         再生・一時停止・速度（rAF）
src/components/                   Foot / FloorDiagram / StepTable / PlaybackBar など
src/pages/                        DanceList / FigureList / FigureDetail / AmalgamationDetail
.github/workflows/deploy.yml      GitHub Pages 自動デプロイ
docs/                             ROADMAP / DECISIONS / HANDOVER / 設計書・計画書
```

## 守るルール（機械可読部・正本・事実の境界）

1. **ISTD項目はすべてコード値。** `src/types.ts` の列挙にない値はデータに書かない。足の位置の修飾は `modifiers`（配列、例 `["outside_partner", "in_CBMP"]`）。新しい値が必要なら列挙に追加し、`ja` / `en` 両辞書に対訳を足す（型が漏れを検出する）。
2. **フィガーデータは Claude 生成の参考値。教本が正。** 「教本ではこう」という利用者の指摘だけを根拠に直す。推測でアライメント・スウェイ・座標を「もっともらしく」書き換えない。修正したら該当箇所を `docs/ROADMAP.md` の照合リストから消し、`docs/DECISIONS.md` に「何を・何を根拠に」を1行残す。
3. **座標は保存せず導出する（D-21）**: フィガーJSONに `position` / `startPositions` を書かない（検証で弾かれる）。座標は `src/geometry/derivePositions.ts` がアライメント・足の位置・足から計算する。規約: LOD=+x（画面右）、**壁=画面下(+y)**（教本どおり「LODに面して右手が壁」）、`angle` 0=つま先が画面上・時計回り正。中央0°/DC45°/LOD90°/DW135°/壁180°/逆壁斜め225°/逆LOD270°/逆中央斜め315°。見た目を直したいときは JSON でなく derivePositions.ts のパラメータ（歩幅・足幅）を直す。**両方表示**の女性は「女性単独の導出結果を、男性の体の枠（連続な体の向き＋ホールド別オフセット）へ平行移動し、当たる分だけ後方へ退避（退避量は時間平均）」で配置する（D-28→D-29 で鏡映方式から訂正）。男女の足が重ならないこと（`coupleOverlap.test.ts`）と1フレームで跳ばないこと（`coupleSmoothness.test.ts`）をテストで保証している——足の描画サイズを変えたら `FOOT_W/FOOT_H` も更新。
4. **正本は1箇所**: 種目一覧は `dances.json`、フィガー目次は `figures.json`、UI文言と用語訳は辞書ファイル。README・ROADMAP に同じ数値を書くときは出典を併記する。
5. **ハッシュルーティング＋ `base: './'`** は変えない（任意サイトのサブディレクトリに `dist/` を置くだけで動く、という設計の要）。
6. **フィガー追加手順**: ① `public/data/waltz/<id>.json` を `natural-turn.json` を雛形に作成 ② `figures.json` に追加（`stepCount` は男性の歩数） ③ `npm test` ④ `npm run data-check` ⑤ コミット。他種目は `dances.json` の `available` を true にしてから同様。
7. **コミット前**: `npm test` 緑を確認してからコミット（`npm test && git commit …` の形にする。`npm test | tail && git commit` はパイプの終了コードで赤を通すので禁止）。`git add -A` は使わず、対象ファイルを名指しで add。
8. **`dist/` はコミットしない**（.gitignore 済み）。デプロイは GitHub Actions が build する。ローカルの `dist/` は古くてもよい。

## 作業の型（fable5-agent-playbook 準拠）

- 表層（ラベル・✅・テスト緑・報告文）と実体（ディスク・実行値・描画）の距離を自分の目で測る。UI 変更は `npm run dev` で実描画を見る。
- 矛盾を見つけたら書き換えは最後の手段。「両方正しく前提が違うだけ」を先に試す。片方が事実（教本・利用者の証言）なら触らず報告。
- 触らなかった箇所も「なぜ触らなかったか」を報告に書く。
- 判断は「判断内容 / なぜ / 弱いモデルが間違えそうな点」の3点セットで `docs/DECISIONS.md` に追記。誤診は消さず訂正込みで残す。
- スコープ外の発見は直さず HANDOVER の「気づき」に書く。
- セッション末に `docs/HANDOVER.md` を更新する（現在地・やったこと・次のキュー・注意点）。作業ログでなく再開手順書として書く。
