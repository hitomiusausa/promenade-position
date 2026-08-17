import type { Amalgamation, CompositeFigure, DanceInfo, Figure, FigureIndexEntry } from '../types'
import { validateAmalgamations, validateDanceList, validateFigure, validateFigureIndex } from './validate'
import { buildAmalgamation } from './amalgamation'

const base = import.meta.env.BASE_URL

async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(`${base}${path}`)
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  return res.json()
}

export async function loadDances(): Promise<DanceInfo[]> {
  return validateDanceList(await fetchJson('data/dances.json'))
}

export async function loadFigureIndex(dance: string): Promise<FigureIndexEntry[]> {
  return validateFigureIndex(await fetchJson(`data/${dance}/figures.json`))
}

export async function loadFigure(dance: string, figureId: string): Promise<Figure> {
  return validateFigure(await fetchJson(`data/${dance}/${figureId}.json`))
}

export async function loadAmalgamations(dance: string): Promise<Amalgamation[]> {
  return validateAmalgamations(await fetchJson(`data/${dance}/amalgamations.json`))
}

export async function loadAmalgamation(dance: string, id: string): Promise<CompositeFigure> {
  const list = await loadAmalgamations(dance)
  const amal = list.find((a) => a.id === id)
  if (!amal) throw new Error(`amalgamation ${id} が見つからない`)
  const ids = [...new Set(amal.figures.map((f) => f.figure))]
  const figs = await Promise.all(ids.map((fid) => loadFigure(dance, fid)))
  const byId = Object.fromEntries(figs.map((f) => [f.id, f]))
  return buildAmalgamation(amal, byId)
}
