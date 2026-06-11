import type { Footwork, FootSide, StepPosition } from '../types'
import { footworkColors } from './footworkColors'

// 左足を上向きに描いたパス。前部（ボール＋トー、親指側=右がふくらむ）と
// 後部（土踏まず=右がくびれる＋ヒール）に分割し、重心色を別々に塗る。
const FRONT_PATH = 'M -10,-3 C -12,-13 -9,-22 -3,-25 C 4,-27 10,-21 9,-11 C 8.7,-8 8,-5 7,-3 Z'
const BACK_PATH = 'M -10,-3 C -10,5 -9,11 -4,15 C 1,18 6,13 6,7 C 6,3 6.5,0 7,-3 Z'

const OUTLINE: Record<FootSide, string> = { L: '#5b8aa6', R: '#a6685b' }

export interface FootProps {
  side: FootSide
  position: StepPosition
  footwork: Footwork
  label?: string
  ghost?: boolean
  selected?: boolean
  onClick?: () => void
}

export function Foot({ side, position, footwork, label, ghost = false, selected = false, onClick }: FootProps) {
  const colors = footworkColors(footwork)
  const dash = colors.dashed ? '4 3' : undefined
  return (
    <g
      transform={`translate(${position.x},${position.y}) rotate(${position.angle})`}
      opacity={ghost ? 0.3 : 1}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
      data-testid={`foot-${side}`}
    >
      <g transform={side === 'R' ? 'scale(-1,1)' : undefined}>
        <path d={FRONT_PATH} fill={colors.toe} stroke={OUTLINE[side]} strokeWidth={1.5} strokeDasharray={dash} />
        <path d={BACK_PATH} fill={colors.heel} stroke={OUTLINE[side]} strokeWidth={1.5} strokeDasharray={dash} />
        <text
          y={10}
          textAnchor="middle"
          fontSize={8}
          fontWeight="bold"
          fill={colors.dashed ? '#888' : '#fff'}
          transform={side === 'R' ? 'scale(-1,1)' : undefined}
          style={{ userSelect: 'none' }}
        >
          {side}
        </text>
      </g>
      {label && (
        <g transform={`rotate(${-position.angle})`}>
          <circle cy={-32} r={8} fill="#fff" stroke="#adb5bd" strokeWidth={1} />
          <text y={-29} textAnchor="middle" fontSize={9} fontWeight="bold" fill="#333" style={{ userSelect: 'none' }}>
            {label}
          </text>
        </g>
      )}
      {selected && <circle r={22} fill="none" stroke="#e76f51" strokeWidth={2} strokeDasharray="5 3" />}
    </g>
  )
}
