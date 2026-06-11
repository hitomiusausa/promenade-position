import {
  ALIGNMENT_RELATIONS, DANCES, DIRECTIONS, FOOTWORKS, LOCALES, MODIFIERS, MOVES,
  RISE_FALLS, SWAYS, TURN_AMOUNTS, TURN_DIRECTIONS,
  type DanceInfo, type Figure, type FigureIndexEntry, type LocalizedText,
} from '../types'

function fail(path: string, msg: string): never {
  throw new Error(`${path}: ${msg}`)
}

function obj(v: unknown, path: string): Record<string, unknown> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) fail(path, 'オブジェクトが必要')
  return v as Record<string, unknown>
}

function str(v: unknown, path: string): string {
  if (typeof v !== 'string' || v === '') fail(path, '空でない文字列が必要')
  return v
}

function num(v: unknown, path: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) fail(path, '数値が必要')
  return v
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], path: string): T {
  if (typeof v !== 'string' || !(allowed as readonly string[]).includes(v))
    fail(path, `次のいずれかが必要: ${allowed.join(', ')}（実際: ${JSON.stringify(v)}）`)
  return v as T
}

function localizedText(v: unknown, path: string): LocalizedText {
  const o = obj(v, path)
  for (const key of Object.keys(o)) {
    if (!(LOCALES as readonly string[]).includes(key)) fail(`${path}.${key}`, `不明な言語コード`)
    str(o[key], `${path}.${key}`)
  }
  return o as LocalizedText
}

function localizedName(v: unknown, path: string) {
  const o = obj(v, path)
  if (typeof o.en !== 'string' || o.en === '') fail(`${path}.en`, '英語名は必須')
  return o as Figure['name']
}

function position(v: unknown, path: string) {
  const o = obj(v, path)
  return { x: num(o.x, `${path}.x`), y: num(o.y, `${path}.y`), angle: num(o.angle, `${path}.angle`) }
}

function step(v: unknown, index: number, path: string) {
  const o = obj(v, path)
  const stepNo = num(o.stepNo, `${path}.stepNo`)
  if (stepNo !== index + 1) fail(`${path}.stepNo`, `${index + 1} のはずが ${stepNo}`)
  const sd = obj(o.stepDescription, `${path}.stepDescription`)
  const turn = obj(o.amountOfTurn, `${path}.amountOfTurn`)
  const align = obj(o.alignment, `${path}.alignment`)
  const beats = num(o.beats, `${path}.beats`)
  if (beats <= 0) fail(`${path}.beats`, '正の数が必要')
  if (turn.between !== undefined) {
    if (!Array.isArray(turn.between) || turn.between.length !== 2) fail(`${path}.amountOfTurn.between`, '[from, to] が必要')
    num(turn.between[0], `${path}.amountOfTurn.between[0]`)
    num(turn.between[1], `${path}.amountOfTurn.between[1]`)
  }
  return {
    stepNo,
    foot: oneOf(o.foot, ['L', 'R'] as const, `${path}.foot`),
    stepDescription: {
      move: oneOf(sd.move, MOVES, `${path}.stepDescription.move`),
      ...(sd.modifier !== undefined ? { modifier: oneOf(sd.modifier, MODIFIERS, `${path}.stepDescription.modifier`) } : {}),
    },
    count: str(o.count, `${path}.count`),
    beats,
    footwork: oneOf(o.footwork, FOOTWORKS, `${path}.footwork`),
    alignment: {
      relation: oneOf(align.relation, ALIGNMENT_RELATIONS, `${path}.alignment.relation`),
      direction: oneOf(align.direction, DIRECTIONS, `${path}.alignment.direction`),
    },
    amountOfTurn: {
      direction: oneOf(turn.direction, TURN_DIRECTIONS, `${path}.amountOfTurn.direction`),
      amount: oneOf(turn.amount, TURN_AMOUNTS, `${path}.amountOfTurn.amount`),
      ...(turn.between !== undefined
        ? { between: [
            num(turn.between[0], `${path}.amountOfTurn.between[0]`),
            num(turn.between[1], `${path}.amountOfTurn.between[1]`),
          ] as [number, number] }
        : {}),
    },
    riseAndFall: oneOf(o.riseAndFall, RISE_FALLS, `${path}.riseAndFall`),
    sway: oneOf(o.sway, SWAYS, `${path}.sway`),
    cbm: typeof o.cbm === 'boolean' ? o.cbm : fail(`${path}.cbm`, 'booleanが必要'),
    position: position(o.position, `${path}.position`),
    ...(o.note !== undefined ? { note: localizedText(o.note, `${path}.note`) } : {}),
  }
}

function part(v: unknown, path: string) {
  const o = obj(v, path)
  const sp = obj(o.startPositions, `${path}.startPositions`)
  if (!Array.isArray(o.steps) || o.steps.length === 0) fail(`${path}.steps`, '1歩以上が必要')
  return {
    startPositions: { L: position(sp.L, `${path}.startPositions.L`), R: position(sp.R, `${path}.startPositions.R`) },
    steps: o.steps.map((s, i) => step(s, i, `${path}.steps[${i}]`)),
  }
}

export function validateFigure(data: unknown): Figure {
  const o = obj(data, 'figure')
  const parts = obj(o.parts, 'parts')
  return {
    id: str(o.id, 'id'),
    name: localizedName(o.name, 'name'),
    dance: oneOf(o.dance, DANCES, 'dance'),
    timeSignature: str(o.timeSignature, 'timeSignature'),
    parts: { man: part(parts.man, 'parts.man'), lady: part(parts.lady, 'parts.lady') },
  }
}

export function validateDanceList(data: unknown): DanceInfo[] {
  if (!Array.isArray(data)) fail('dances', '配列が必要')
  return data.map((d, i) => {
    const o = obj(d, `dances[${i}]`)
    return {
      id: oneOf(o.id, DANCES, `dances[${i}].id`),
      name: localizedName(o.name, `dances[${i}].name`),
      category: oneOf(o.category, ['standard', 'latin'] as const, `dances[${i}].category`),
      available: typeof o.available === 'boolean' ? o.available : fail(`dances[${i}].available`, 'booleanが必要'),
    }
  })
}

export function validateFigureIndex(data: unknown): FigureIndexEntry[] {
  if (!Array.isArray(data)) fail('figures', '配列が必要')
  return data.map((d, i) => {
    const o = obj(d, `figures[${i}]`)
    return {
      id: str(o.id, `figures[${i}].id`),
      name: localizedName(o.name, `figures[${i}].name`),
      level: oneOf(o.level, ['beginner', 'intermediate', 'advanced'] as const, `figures[${i}].level`),
      stepCount: (() => {
        const stepCount = num(o.stepCount, `figures[${i}].stepCount`)
        if (!Number.isInteger(stepCount) || stepCount < 1) fail(`figures[${i}].stepCount`, '1以上の整数が必要')
        return stepCount
      })(),
    }
  })
}
