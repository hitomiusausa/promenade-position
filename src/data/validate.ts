import {
  ALIGNMENT_RELATIONS, DANCES, DIRECTIONS, FOOTWORKS, LOCALES, MODIFIERS, MOVES,
  RISE_FALLS, SWAYS, TURN_AMOUNTS, TURN_DIRECTIONS,
  type Amalgamation, type DanceInfo, type Figure, type FigureIndexEntry, type FigurePart, type FigureStep, type LocalizedText, type Role,
} from '../types'
import { alignmentAngle, deriveLadyInCouple, derivePartPositions, ladyStart } from '../geometry/derivePositions'

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

function step(v: unknown, index: number, path: string) {
  const o = obj(v, path)
  if (o.position !== undefined) fail(`${path}.position`, '座標はデータに持たない（アライメント等から導出する。D-21）')
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
      ...(sd.modifier !== undefined ? fail(`${path}.stepDescription.modifier`, '`modifiers`（配列）を使う') : {}),
      ...(sd.modifiers !== undefined
        ? { modifiers: (Array.isArray(sd.modifiers) ? sd.modifiers : fail(`${path}.stepDescription.modifiers`, '配列が必要'))
            .map((m, i) => oneOf(m, MODIFIERS, `${path}.stepDescription.modifiers[${i}]`)) }
        : {}),
    },
    count: str(o.count, `${path}.count`),
    beats,
    footwork: oneOf(o.footwork, FOOTWORKS, `${path}.footwork`),
    alignment: {
      relation: oneOf(align.relation, ALIGNMENT_RELATIONS, `${path}.alignment.relation`),
      direction: oneOf(align.direction, DIRECTIONS, `${path}.alignment.direction`),
      ...(align.almost !== undefined
        ? { almost: typeof align.almost === 'boolean' ? align.almost : fail(`${path}.alignment.almost`, 'booleanが必要') }
        : {}),
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
    ...(o.note !== undefined ? { note: localizedText(o.note, `${path}.note`) } : {}),
  }
}

type StepInput = Omit<FigureStep, 'position'>

function part(v: unknown, path: string): StepInput[] {
  const o = obj(v, path)
  if (o.startPositions !== undefined) fail(`${path}.startPositions`, '開始位置はデータに持たない（導出する。D-21）')
  if (!Array.isArray(o.steps) || o.steps.length === 0) fail(`${path}.steps`, '1歩以上が必要')
  return o.steps.map((s, i) => step(s, i, `${path}.steps[${i}]`))
}

/** 検証済みの歩データに座標を付与する（男性を原点、女性は男性との相対位置から） */
export function derivePositions(inputs: Record<Role, StepInput[]>): Record<Role, FigurePart> {
  const manAngle = alignmentAngle(inputs.man[0].alignment)
  const ladyAngle = alignmentAngle(inputs.lady[0].alignment)
  const man = derivePartPositions(inputs.man, 'man', { x: 0, y: 0 }, manAngle)
  const ls = ladyStart(manAngle, ladyAngle)
  const lady = derivePartPositions(inputs.lady, 'lady', ls.offset, ls.angle)
  const attach = (steps: StepInput[], d: typeof man): FigurePart => ({
    startPositions: d.startPositions,
    steps: steps.map((s, i) => ({ ...s, position: d.positions[i] })),
  })
  return { man: attach(inputs.man, man), lady: attach(inputs.lady, lady) }
}

/** 検証済み歩データから parts（独立導出）と ladyInCouple（両方表示用の鏡映配置）を作る */
export function deriveAll(inputs: Record<Role, StepInput[]>): { parts: Record<Role, FigurePart>; ladyInCouple: FigurePart } {
  const parts = derivePositions(inputs)
  return { parts, ladyInCouple: deriveLadyInCouple(parts.man, parts.lady) }
}

export function validateFigure(data: unknown): Figure {
  const o = obj(data, 'figure')
  const parts = obj(o.parts, 'parts')
  const inputs = { man: part(parts.man, 'parts.man'), lady: part(parts.lady, 'parts.lady') }
  return {
    id: str(o.id, 'id'),
    name: localizedName(o.name, 'name'),
    dance: oneOf(o.dance, DANCES, 'dance'),
    timeSignature: str(o.timeSignature, 'timeSignature'),
    ...deriveAll(inputs),
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

export function validateAmalgamations(data: unknown): Amalgamation[] {
  if (!Array.isArray(data)) fail('amalgamations', '配列が必要')
  return data.map((a, i) => {
    const o = obj(a, `amalgamations[${i}]`)
    if (!Array.isArray(o.figures) || o.figures.length === 0) fail(`amalgamations[${i}].figures`, '1つ以上のフィガーが必要')
    return {
      id: str(o.id, `amalgamations[${i}].id`),
      name: localizedName(o.name, `amalgamations[${i}].name`),
      ...(o.source !== undefined ? { source: str(o.source, `amalgamations[${i}].source`) } : {}),
      figures: o.figures.map((f, j) => {
        const p = `amalgamations[${i}].figures[${j}]`
        const fo = obj(f, p)
        let steps: [number, number] | undefined
        if (fo.steps !== undefined) {
          if (!Array.isArray(fo.steps) || fo.steps.length !== 2) fail(`${p}.steps`, '[from, to] が必要')
          const from = num(fo.steps[0], `${p}.steps[0]`)
          const to = num(fo.steps[1], `${p}.steps[1]`)
          if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) fail(`${p}.steps`, '1以上の整数で from <= to')
          steps = [from, to]
        }
        return {
          figure: str(fo.figure, `${p}.figure`),
          ...(steps ? { steps } : {}),
          ...(fo.note !== undefined ? { note: localizedText(fo.note, `${p}.note`) } : {}),
        }
      }),
      ...(o.note !== undefined ? { note: localizedText(o.note, `amalgamations[${i}].note`) } : {}),
    }
  })
}
