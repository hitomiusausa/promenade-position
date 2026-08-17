# PP — Promenade Position

社交ダンスの足型・フィガー学習アプリ。ISTD教本ベースのワルツ基本フィガーを、
重心色分け付きの足型図・アニメーション・男性/女性/両方表示で学べます。

## 開発

```bash
npm install
npm run dev        # 開発サーバー
npm test           # テスト＋全フィガーデータの検証
npm run build      # dist/ に静的ファイルを出力
```

## 公開

`npm run build` の `dist/` の中身を任意のWebサーバーの任意のディレクトリに
コピーするだけで動きます（相対パス＋ハッシュルーティングのため設定不要）。

## データについて

`public/data/` のフィガーデータはISTD教本を参考にした生成データです。
教本との照合・修正は会話ベースで行います。足型図の座標はデータに持たず、
アライメント等から `src/geometry/derivePositions.ts` が導出します（LOD=画面右・壁=画面下）。

## 設計資料

- 設計書: `docs/superpowers/specs/2026-06-11-pp-dance-figures-design.md`
- 実装計画: `docs/superpowers/plans/2026-06-11-pp-v1.md`
- 作業指針: `CLAUDE.md` ／ 判断記録: `docs/DECISIONS.md` ／ 引き継ぎ: `docs/HANDOVER.md`
