import type { Dictionary } from '../index'

export const ja: Dictionary = {
  ui: {
    appName: 'PP', selectDance: '種目を選ぶ', figureList: 'フィガー一覧',
    play: '再生', pause: '一時停止', speed: '速度',
    man: '男性', lady: '女性', both: '両方',
    step: '歩', footColumn: '足', count: 'カウント', footwork: 'フットワーク',
    alignment: 'アライメント', amountOfTurn: '回転量', riseAndFall: 'ライズ＆フォール',
    sway: 'スウェイ', cbm: 'CBM', yes: 'あり', no: 'なし', note: 'メモ',
    back: '戻る', loading: '読み込み中…', loadError: 'データを読み込めませんでした',
    retry: '再試行', comingSoon: '準備中', steps: '歩', language: '言語',
    startPosition: '開始位置', viewRole: '表示パート', playbackPosition: '再生位置',
    modOpen: '（', modClose: '）',
  },
  dance: {
    waltz: 'ワルツ', tango: 'タンゴ', slow_foxtrot: 'スローフォックストロット',
    quickstep: 'クイックステップ', viennese_waltz: 'ヴェニーズワルツ',
    cha_cha_cha: 'チャチャチャ', rumba: 'ルンバ', samba: 'サンバ',
    paso_doble: 'パソドブレ', jive: 'ジャイブ',
  },
  level: { beginner: '初級', intermediate: '中級', advanced: '上級' },
  foot: { L: '左足', R: '右足' },
  footwork: { H: 'ヒール', T: 'トー', TH: 'トー→ヒール', HT: 'ヒール→トー', THT: 'トー→ヒール→トー', flat: 'フラット', none: '体重なし' },
  footworkPart: { H: 'ヒール', T: 'トー' },
  relation: { facing: '{dir}に面して', backing: '{dir}に背面して', pointing: '{dir}にポイントして' },
  direction: {
    LOD: 'LOD', DW: '壁斜め', DC: '中央斜め', wall: '壁', centre: '中央',
    against_LOD: '逆LOD', DW_against_LOD: '逆LODの壁斜め', DC_against_LOD: '逆LODの中央斜め',
  },
  move: {
    forward: '{foot}前進', back: '{foot}後退', side: '{foot}横へ', close: '{foot}を閉じる',
    diag_forward: '{foot}斜め前へ', diag_back: '{foot}斜め後ろへ',
    cross_behind: '{foot}後ろにクロス', cross_front: '{foot}前にクロス',
    forward_PP: '{foot}PPで前進', side_in_PP: '{foot}PPで横へ',
    replace_weight: '{foot}に体重を戻す', brush: '{foot}ブラシ',
  },
  modifier: {
    slightly_back: '少し後ろに', slightly_forward: '少し前に', small_step: '小さく',
    outside_partner: 'アウトサイドパートナー', in_PP: 'PPで', rightward: '右方向に', leftward: '左方向に',
  },
  riseFall: {
    commence_rise_eo_1: '1の終わりにライズ開始', commence_rise_eo_2: '2の終わりにライズ開始',
    continue_rise: 'ライズ継続', up: 'アップ', up_lower_eo_3: 'アップ、3の終わりにロア',
    no_rise_fall: 'ライズ＆フォールなし', rise_slightly: 'わずかにライズ', lower_eo_3: '3の終わりにロア',
  },
  sway: { straight: 'なし（ストレート）', L: '左', R: '右' },
  turn: { none: '回転なし', withBetween: '{dir}へ{amount}（{from}-{to}歩間）', noBetween: '{dir}へ{amount}' },
  turnDirection: { right: '右', left: '左' },
}
