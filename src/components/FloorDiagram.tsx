import type { FigurePart, Role, StepPosition } from '../types'
import { feetAt } from '../animation/interpolate'
import { Foot } from './Foot'

export interface FloorDiagramProps {
  parts: Array<{ role: Role; part: FigurePart }>
  selectedStep: number | null
  onSelectStep: (stepNo: number) => void
  /** null=静止表示、数値=その拍時点のアニメ表示 */
  animTime: number | null
}

const PAD = 45
const GRID = 25

function bounds(parts: FloorDiagramProps['parts']) {
  const ps: StepPosition[] = parts.flatMap(({ part }) => [
    part.startPositions.L, part.startPositions.R, ...part.steps.map((s) => s.position),
  ])
  const xs = ps.map((p) => p.x)
  const ys = ps.map((p) => p.y)
  return {
    minX: Math.min(...xs) - PAD, maxX: Math.max(...xs) + PAD,
    minY: Math.min(...ys) - PAD, maxY: Math.max(...ys) + PAD,
  }
}

export function FloorDiagram({ parts, selectedStep, onSelectStep, animTime }: FloorDiagramProps) {
  const b = bounds(parts)
  const w = b.maxX - b.minX
  const h = b.maxY - b.minY
  const gridX: number[] = []
  for (let x = Math.ceil(b.minX / GRID) * GRID; x < b.maxX; x += GRID) gridX.push(x)
  const gridY: number[] = []
  for (let y = Math.ceil(b.minY / GRID) * GRID; y < b.maxY; y += GRID) gridY.push(y)

  return (
    <svg viewBox={`${b.minX} ${b.minY} ${w} ${h}`} className="floor-diagram" role="img">
      <g stroke="#eef0f2" strokeWidth={1}>
        {gridX.map((x) => <line key={`x${x}`} x1={x} y1={b.minY} x2={x} y2={b.maxY} />)}
        {gridY.map((y) => <line key={`y${y}`} x1={b.minX} y1={y} x2={b.maxX} y2={y} />)}
      </g>
      {/* LOD矢印（画面右が進行方向） */}
      <g opacity={0.7}>
        <line x1={b.minX + 10} y1={b.maxY - 12} x2={b.maxX - 18} y2={b.maxY - 12} stroke="#adb5bd" strokeWidth={1.5} />
        <path d={`M ${b.maxX - 18},${b.maxY - 16} L ${b.maxX - 10},${b.maxY - 12} L ${b.maxX - 18},${b.maxY - 8} Z`} fill="#adb5bd" />
        <text x={b.minX + 10} y={b.maxY - 18} fontSize={9} fill="#adb5bd">LOD</text>
      </g>
      {parts.map(({ role, part }) => {
        const dim = parts.length > 1 && role === 'lady' ? 0.55 : 1
        if (animTime !== null) {
          const feet = feetAt(part, animTime)
          const fw = (side: 'L' | 'R') => (feet.movingFoot === side ? 'none' : 'flat')
          return (
            <g key={role} opacity={dim}>
              <Foot side="L" position={feet.L} footwork={fw('L')} />
              <Foot side="R" position={feet.R} footwork={fw('R')} />
            </g>
          )
        }
        return (
          <g key={role} opacity={dim}>
            <Foot side="L" position={part.startPositions.L} footwork="none" ghost />
            <Foot side="R" position={part.startPositions.R} footwork="none" ghost />
            {part.steps.map((s) => (
              <Foot
                key={s.stepNo}
                side={s.foot}
                position={s.position}
                footwork={s.footwork}
                label={String(s.stepNo)}
                selected={selectedStep === s.stepNo}
                onClick={() => onSelectStep(s.stepNo)}
              />
            ))}
            {/* 選択中の歩の「体の向き」矢印（つま先方向≒体の向きの近似。スペック§3） */}
            {part.steps
              .filter((s) => s.stepNo === selectedStep)
              .map((s) => (
                <g
                  key={`dir-${s.stepNo}`}
                  data-testid="body-direction"
                  transform={`translate(${s.position.x},${s.position.y}) rotate(${s.position.angle})`}
                  pointerEvents="none"
                >
                  <line x1={18} y1={-8} x2={18} y2={-30} stroke="#6c757d" strokeWidth={2} />
                  <path d="M 14,-28 L 18,-38 L 22,-28 Z" fill="#6c757d" />
                </g>
              ))}
          </g>
        )
      })}
    </svg>
  )
}
