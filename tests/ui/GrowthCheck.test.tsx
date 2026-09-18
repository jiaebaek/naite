/**
 * GrowthCheck (§10 성장 좌표 관찰 체크 · 영역별) — 관찰행동을 예/아직/모름으로, "예"→좌표 반영.
 * 평가·"테스트" 아님(OOS-6). 결과는 안도 톤.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GrowthCheck } from '../../src/boundary/ui/GrowthCheck'
import { GROWTH_POINTS, growthPointById } from '../../src/domain/standards/growthPoints'
import { behaviorKey } from '../../src/domain/growth'

const POINTS = GROWTH_POINTS.filter((g) => g.domain === '과학·탐구')

const setup = () => {
  const onComplete = vi.fn()
  const onClose = vi.fn()
  render(<GrowthCheck domain="과학·탐구" points={POINTS} initial={{}} onComplete={onComplete} onClose={onClose} />)
  return { onComplete, onClose }
}

describe('§10 관찰 체크 (영역별)', () => {
  it('영역 GrowthPoint 의 관찰행동이 질문으로 뜨고, "테스트" 표현이 없다', () => {
    setup()
    expect(screen.getByText('탐구하는 태도')).toBeInTheDocument()
    const gp = growthPointById('sci-inquiry')!
    expect(screen.getByText(gp.behaviors[0]!.parentText)).toBeInTheDocument()
    expect(document.body.textContent ?? '').not.toContain('테스트')
  })

  it('예/아직/모름 3택이 각 문항에 있다', () => {
    setup()
    const gp = growthPointById('sci-inquiry')!
    const group = screen.getByRole('group', { name: gp.behaviors[0]!.parentText })
    for (const l of ['예', '아직', '모름']) expect(within(group).getByRole('button', { name: l })).toBeInTheDocument()
  })

  it('⭐ "예"로 답하고 완료하면 그 order 가 답변에 담겨 온다(좌표 반영)', async () => {
    const { onComplete } = setup()
    const gp = growthPointById('sci-inquiry')!
    const group = screen.getByRole('group', { name: gp.behaviors[1]!.parentText }) // order 2
    await userEvent.click(within(group).getByRole('button', { name: '예' }))
    await userEvent.click(screen.getByRole('button', { name: '다 봤어요' }))
    const answers = onComplete.mock.calls[0]![0]
    expect(answers[behaviorKey('sci-inquiry', 2)]).toBe('yes')
  })

  it('완료 후 안도 톤 결과', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: '다 봤어요' }))
    expect(screen.getByTestId('gc-result')).toBeInTheDocument()
    expect(screen.getByText(/보이고 있어요/)).toBeInTheDocument()
  })
})
