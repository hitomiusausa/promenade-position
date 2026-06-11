import type { DanceInfo, Figure, FigureIndexEntry } from '../types'
import { validateDanceList, validateFigure, validateFigureIndex } from './validate'

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
