import type { Footwork, FootSide, StepPosition } from '../types'
import { footworkColors, type FootVariant } from './footworkColors'

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
  /** 他の歩が選択されているとき true。色を保ったまま薄く表示する */
  dimmed?: boolean
  /** 重心色のパレット。両方表示で女性パートは 'lady'（同じ濃さの対比色） */
  variant?: FootVariant
  /** 歩番号バッジ。両方表示で男性=ink（塗りつぶし）/女性=outline（白抜き） */
  badgeStyle?: 'ink' | 'outline'
  onClick?: () => void
}

export function Foot({ side, position, footwork, label, ghost = false, selected = false, dimmed = false, variant = 'man', badgeStyle = 'outline', onClick }: FootProps) {
  const colors = footworkColors(footwork, variant)
  const dash = colors.dashed ? '4 3' : undefined
  return (
    <g
      transform={`translate(${position.x},${position.y}) rotate(${position.angle})`}
      opacity={ghost ? 0.3 : dimmed ? 0.25 : 1}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
      data-testid={`foot-${side}`}
    >
      <g transform={side === 'R' ? 'scale(-0.6,0.6)' : 'scale(0.6,0.6)'}>
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
      {/* 歩番号は逆回転で常に画面上方に表示（つま先側に置くとLOD方向の歩で隣の歩番号と重なるため） */}
      {label && (
        <g transform={`rotate(${-position.angle})`}>
          <circle
            cy={-20}
            r={6.5}
            fill={badgeStyle === 'ink' ? '#343a40' : '#fff'}
            stroke={badgeStyle === 'ink' ? '#343a40' : '#adb5bd'}
            strokeWidth={1}
          />
          <text
            y={-17.4}
            textAnchor="middle"
            fontSize={7.5}
            fontWeight="bold"
            fill={badgeStyle === 'ink' ? '#fff' : '#333'}
            style={{ userSelect: 'none' }}
          >
            {label}
          </text>
        </g>
      )}
      {selected && (
        <circle
          data-testid="selected-ring"
          r={15}
          fill="none"
          stroke={variant === 'lady' ? '#d6336c' : '#e76f51'}
          strokeWidth={2}
          strokeDasharray="5 3"
        />
      )}
    </g>
  )
}
