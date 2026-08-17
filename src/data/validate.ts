import {
  ALIGNMENT_RELATIONS, DANCES, DIRECTIONS, FOOTWORKS, LOCALES, MODIFIERS, MOVES,
  RISE_FALLS, SWAYS, TRANSITION_CONDITIONS, TURN_AMOUNTS, TURN_DIRECTIONS,
  type Amalgamation, type DanceInfo, type Figure, type FigureIndexEntry, type FigurePart, type FigureStep,
  type FigureStub, type LocalizedText, type Role, type Transition,
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

function stepRange(v: unknown, path: string): [number, number] {
  if (!Array.isArray(v) || v.length !== 2) fail(path, '[from, to] が必要')
  const from = num(v[0], `${path}[0]`)
  const to = num(v[1], `${path}[1]`)
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) fail(path, '1以上の整数で from <= to')
  return [from, to]
}

/** 教本の先行・後続データ（stub＋transitions）。dance ごとに1エントリ */
export interface TransitionData {
  stubs: FigureStub[]
  transitions: Transition[]
}

export function validateTransitionData(data: unknown, dance: string): TransitionData {
  const root = obj(data, 'transitions.json')
  const o = obj(root[dance], `transitions.json.${dance}`)
  if (!Array.isArray(o.stubs)) fail(`${dance}.stubs`, '配列が必要')
  if (!Array.isArray(o.transitions)) fail(`${dance}.transitions`, '配列が必要')

  const stubs: FigureStub[] = o.stubs.map((v, i) => {
    const p = `${dance}.stubs[${i}]`
    const so = obj(v, p)
    // 規則5: stub は骨だけ。歩データを持たない
    for (const k of ['parts', 'steps', 'timeSignature', 'stepCount']) {
      if (so[k] !== undefined) fail(`${p}.${k}`, 'stub は歩データを持たない（id・名前・出典のみ）')
    }
    if (so.stub !== true) fail(`${p}.stub`, 'true が必要')
    return { id: str(so.id, `${p}.id`), name: localizedName(so.name, `${p}.name`), stub: true, source: str(so.source, `${p}.source`) }
  })

  const transitions: Transition[] = o.transitions.map((v, i) => {
    const p = `${dance}.transitions[${i}]`
    const t = obj(v, p)
    const to = t.to === null ? null : str(t.to, `${p}.to`)
    // 規則: 群参照など to を特定できない場合だけ null。そのときは原文の転記が要る
    if (to === null && typeof t.note_ja !== 'string') fail(`${p}.note_ja`, 'to が null のときは教本の原文を note_ja に転記する')
    return {
      from: str(t.from, `${p}.from`),
      ...(t.fromSteps !== undefined ? { fromSteps: stepRange(t.fromSteps, `${p}.fromSteps`) } : {}),
      ...(t.viaFigure !== undefined ? { viaFigure: str(t.viaFigure, `${p}.viaFigure`) } : {}),
      to,
      ...(t.toSteps !== undefined ? { toSteps: stepRange(t.toSteps, `${p}.toSteps`) } : {}),
      ...(t.conditions !== undefined
        ? { conditions: (Array.isArray(t.conditions) ? t.conditions : fail(`${p}.conditions`, '配列が必要'))
            .map((c, j) => oneOf(c, TRANSITION_CONDITIONS, `${p}.conditions[${j}]`)) }
        : {}),
      ...(t.note_ja !== undefined ? { note_ja: str(t.note_ja, `${p}.note_ja`) } : {}),
      ...(t.note_en !== undefined ? { note_en: str(t.note_en, `${p}.note_en`) } : {}),
      source: str(t.source, `${p}.source`),  // 規則4: 検収可能性の担保
    }
  })

  return { stubs, transitions }
}

/** transitions と figures.json の突き合わせ（規則1・2・5） */
export function checkTransitionsAgainstFigures(data: TransitionData, figureIds: readonly string[]): void {
  const stubIds = new Set(data.stubs.map((s) => s.id))
  const known = new Set([...figureIds, ...stubIds])
  for (const id of stubIds) {
    if (figureIds.includes(id)) fail(`stubs.${id}`, 'figures.json に実体があるので stub にしない')
  }
  const usedStub = new Set<string>()
  const seen = new Map<string, number>()
  data.transitions.forEach((t, i) => {
    const p = `transitions[${i}]`
    for (const [field, id] of [['from', t.from], ['to', t.to], ['viaFigure', t.viaFigure]] as const) {
      if (id == null) continue
      if (!known.has(id)) fail(`${p}.${field}`, `figures.json にも stub にも無い id: ${id}`)
      if (stubIds.has(id)) usedStub.add(id)
    }
    // 規則2: (from, fromSteps, viaFigure, to, toSteps, conditions) が同一の重複を禁止
    const key = JSON.stringify([t.from, t.fromSteps ?? null, t.viaFigure ?? null, t.to, t.toSteps ?? null, [...(t.conditions ?? [])].sort(), t.note_ja ?? null])
    const prev = seen.get(key)
    if (prev !== undefined) fail(p, `transitions[${prev}] と重複（source をまとめること）`)
    seen.set(key, i)
  })
  // 規則5: どこからも参照されない stub を禁止（不要な骨の混入防止）
  for (const id of stubIds) {
    if (!usedStub.has(id)) fail(`stubs.${id}`, 'transitions のどこからも参照されていない stub')
  }
}
