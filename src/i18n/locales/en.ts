import type { Dictionary } from '../index'

export const en: Dictionary = {
  ui: {
    appName: 'PP', selectDance: 'Choose a dance', figureList: 'Figures',
    play: 'Play', pause: 'Pause', speed: 'Speed',
    man: 'Man', lady: 'Lady', both: 'Both',
    step: 'Step', footColumn: 'Foot', count: 'Count', footwork: 'Footwork',
    alignment: 'Alignment', amountOfTurn: 'Amount of Turn', riseAndFall: 'Rise & Fall',
    sway: 'Sway', cbm: 'CBM', yes: 'Yes', no: 'No', note: 'Note',
    back: 'Back', loading: 'Loading…', loadError: 'Failed to load data',
    retry: 'Retry', comingSoon: 'Coming soon', steps: 'steps', language: 'Language',
    startPosition: 'Start position', viewRole: 'Role view', playbackPosition: 'Playback position',
    modOpen: ' (', modClose: ')',
  },
  dance: {
    waltz: 'Waltz', tango: 'Tango', slow_foxtrot: 'Slow Foxtrot',
    quickstep: 'Quickstep', viennese_waltz: 'Viennese Waltz',
    cha_cha_cha: 'Cha Cha Cha', rumba: 'Rumba', samba: 'Samba',
    paso_doble: 'Paso Doble', jive: 'Jive',
  },
  level: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
  foot: { L: 'LF', R: 'RF' },
  footwork: { H: 'Heel', T: 'Toe', TH: 'Toe→Heel', HT: 'Heel→Toe', THT: 'Toe→Heel→Toe', flat: 'Flat', none: 'No weight' },
  footworkPart: { H: 'Heel', T: 'Toe' },
  relation: { facing: 'Facing {dir}', backing: 'Backing {dir}', pointing: 'Pointing {dir}' },
  direction: {
    LOD: 'LOD', DW: 'DW', DC: 'DC', wall: 'Wall', centre: 'Centre',
    against_LOD: 'Against LOD', DW_against_LOD: 'DW against LOD', DC_against_LOD: 'DC against LOD',
  },
  move: {
    forward: '{foot} forward', back: '{foot} back', side: '{foot} to side', close: '{foot} closes',
    diag_forward: '{foot} diagonally forward', diag_back: '{foot} diagonally back',
    cross_behind: '{foot} crosses behind', cross_front: '{foot} crosses in front',
    forward_PP: '{foot} forward in PP', side_in_PP: '{foot} to side in PP',
    replace_weight: 'Replace weight to {foot}', brush: '{foot} brushes',
  },
  modifier: {
    slightly_back: 'slightly back', slightly_forward: 'slightly forward', small_step: 'small step',
    outside_partner: 'outside partner', in_PP: 'in PP', rightward: 'rightward', leftward: 'leftward',
  },
  riseFall: {
    commence_rise_eo_1: 'Commence to rise e/o 1', commence_rise_eo_2: 'Commence to rise e/o 2',
    continue_rise: 'Continue to rise', up: 'Up', up_lower_eo_3: 'Up. Lower e/o 3',
    no_rise_fall: 'No rise and fall', rise_slightly: 'Rise slightly', lower_eo_3: 'Lower e/o 3',
  },
  sway: { straight: 'Straight', L: 'Left', R: 'Right' },
  turn: { none: 'No turn', withBetween: '{amount} to {dir} (between {from}-{to})', noBetween: '{amount} to {dir}' },
  turnDirection: { right: 'right', left: 'left' },
}
