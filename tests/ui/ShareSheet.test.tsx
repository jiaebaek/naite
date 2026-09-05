/**
 * ShareSheet + NaiteCoordArt — UX 리디자인 §07-A 안도 공유 카드.
 * 좌표 데이터-아트 + 안도 카피. 톤은 자랑이 아니라 안도.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShareSheet } from '../../src/boundary/ui/ShareSheet'
import type { CoordArea } from '../../src/boundary/ui/NaiteCoordArt'

const AREAS: readonly CoordArea[] = [
  { name: '국어', v: 0.4, s: 'prog' },
  { name: '수학', v: 0.5, s: 'prog' },
  { name: '과학·탐구', v: 0.15, s: 'gap' },
  { name: '영어', v: 0.8, s: 'prog' },
  { name: '사회·인성', v: 0.15, s: 'gap' },
  { name: '예체능', v: 0.8, s: 'prog' },
  { name: '건강·안전', v: 1, s: 'done' },
]

const setup = () => {
  const onClose = vi.fn()
  render(
    <ShareSheet
      childLabel="봄이 · 만 5세 8개월"
      ageLabel="5세"
      onCount={5}
      doneCount={1}
      totalDomains={7}
      code="N5·2C5"
      areas={AREAS}
      onClose={onClose}
    />,
  )
  return { onClose }
}

describe('공유 카드', () => {
  it('좌표 아트 + 아이 라벨 + 안도 요약 + 코드가 보인다', () => {
    setup()
    expect(screen.getByTestId('coord-art')).toBeInTheDocument()
    expect(screen.getByText('봄이 · 만 5세 8개월')).toBeInTheDocument()
    expect(screen.getByText(/7곳 중/)).toBeInTheDocument()
    expect(screen.getByText(/좌표 N5·2C5/)).toBeInTheDocument()
  })

  it('⭐ 톤은 안도 — "앞서요/상위" 같은 비교 문구가 없다', () => {
    setup()
    const text = document.body.textContent ?? ''
    for (const bad of ['앞서', '상위', '등수', '순위']) {
      expect(text).not.toContain(bad)
    }
  })

  it('좌표 아트는 영역 수만큼 팁 라벨을 그린다', () => {
    setup()
    const art = screen.getByTestId('coord-art')
    for (const a of AREAS) {
      expect(art.textContent).toContain(a.name)
    }
  })

  it('닫기 → onClose', async () => {
    const { onClose } = setup()
    await userEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(onClose).toHaveBeenCalled()
  })
})
