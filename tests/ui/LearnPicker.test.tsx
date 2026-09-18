/**
 * LearnPicker (§06-C 선택적 학습 정교화 · T11) — 통찰 화면에서 진입하는 과목별 학원/집공부 입력.
 * 온보딩에서 분리된 옛 §06-A S2. 학원 칩 + 학원별 숙제 토글 + 집활동 칩 → picks(academies·homeActivities).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LearnPicker } from '../../src/boundary/ui/LearnPicker'

const setup = (band: 'nuri' | 'elem' = 'nuri') => {
  const onComplete = vi.fn()
  const onClose = vi.fn()
  render(<LearnPicker band={band} onClose={onClose} onComplete={onComplete} />)
  const result = () => onComplete.mock.calls[0]![0]
  return { onComplete, onClose, result }
}

describe('§06-C 학습 정교화', () => {
  it('과목 카드가 뜬다 (국·영·수·과·예체능)', () => {
    setup()
    for (const d of ['국어', '영어', '수학', '과학·탐구', '예체능']) {
      expect(screen.getByTestId(`subj-${d}`)).toBeInTheDocument()
    }
  })

  it('⭐ 학원 칩을 누르면 그 학원에 "숙제 있어요?" 토글이 뜬다', async () => {
    setup()
    expect(screen.queryByText(/집에서 하는 숙제가 있어요/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '한글·독서' }))
    expect(screen.getByText(/집에서 하는 숙제가 있어요/)).toBeInTheDocument()
  })

  it('⭐ 고른 학원·집활동이 coverMode 와 함께 onComplete 로 온다', async () => {
    const { result } = setup()
    await userEvent.click(screen.getByRole('button', { name: '한글·독서' })) // 국어 학원(숙제형 기본)
    await userEvent.click(screen.getByRole('button', { name: '태권도' }))   // 예체능 학원(등원형 기본)
    await userEvent.click(screen.getByRole('button', { name: '엄마표 영어' })) // 영어 집활동
    await userEvent.click(screen.getByRole('button', { name: '추가 완료' }))
    const r = result()
    expect(r.academies).toEqual([
      { name: '한글·독서', domain: '국어', presetType: '한글', coverMode: '숙제형' },
      { name: '태권도', domain: '예체능', presetType: '태권도', coverMode: '등원형' },
    ])
    expect(r.homeActivities).toEqual([{ name: '엄마표 영어', domain: '영어', presetType: '영어' }])
  })

  it('아무 칩도 안 고르면 빈 배열로 완료된다', async () => {
    const { result } = setup()
    await userEvent.click(screen.getByRole('button', { name: '추가 완료' }))
    expect(result()).toEqual({ academies: [], homeActivities: [] })
  })

  it('"나중에"를 누르면 onClose', async () => {
    const { onClose } = setup()
    await userEvent.click(screen.getByRole('button', { name: '나중에' }))
    expect(onClose).toHaveBeenCalled()
  })
})
