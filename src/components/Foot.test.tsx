import type { ReactElement } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Foot } from './Foot'

function renderFoot(ui: ReactElement) {
  return render(<svg>{ui}</svg>)
}

describe('Foot', () => {
  it('L/Rラベルと歩番号を表示する', () => {
    renderFoot(<Foot side="L" position={{ x: 10, y: 20, angle: 45 }} footwork="HT" label="2" />)
    expect(screen.getByText('L')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })
  it('位置と角度がtransformに反映される', () => {
    renderFoot(<Foot side="R" position={{ x: 10, y: 20, angle: 45 }} footwork="T" />)
    const g = screen.getByTestId('foot-R')
    expect(g.getAttribute('transform')).toBe('translate(10,20) rotate(45)')
  })
  it('クリックで onClick が呼ばれる', () => {
    const onClick = vi.fn()
    renderFoot(<Foot side="L" position={{ x: 0, y: 0, angle: 0 }} footwork="T" onClick={onClick} />)
    fireEvent.click(screen.getByTestId('foot-L'))
    expect(onClick).toHaveBeenCalled()
  })
  it('ghost で半透明になる', () => {
    renderFoot(<Foot side="L" position={{ x: 0, y: 0, angle: 0 }} footwork="none" ghost />)
    expect(screen.getByTestId('foot-L').getAttribute('opacity')).toBe('0.3')
  })
  it('selected でリングを表示する', () => {
    renderFoot(<Foot side="L" position={{ x: 0, y: 0, angle: 0 }} footwork="T" selected />)
    expect(screen.getByTestId('selected-ring')).toBeInTheDocument()
  })
  it('footwork=none で点線になる', () => {
    renderFoot(<Foot side="L" position={{ x: 0, y: 0, angle: 0 }} footwork="none" />)
    const paths = screen.getByTestId('foot-L').querySelectorAll('path')
    expect(paths[0].getAttribute('stroke-dasharray')).toBe('4 3')
  })
})
