/**
 * ObservationCheck (생활·마음 관찰 체크 모듈) — §06-B.
 * 예/아직/모름 3택 · "예"=이룸(묶음) · 평가 아님(OOS-6) · 안도 결과.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ObservationCheck } from '../../src/boundary/ui/ObservationCheck'
import type { ObsCheck } from '../../src/domain/standards/observationChecks'

const CHECKS: readonly ObsCheck[] = [
  { clusterId: 'cl-nuri-soc-self', questions: [{ id: 'q1', text: '말로 표현하나요?' }, { id: 'q2', text: '스스로 하려 하나요?' }] },
  { clusterId: 'cl-nuri-hs-health', questions: [{ id: 'h1', text: '손 씻나요?' }] },
]

const setup = () => {
  const onClose = vi.fn(); const onComplete = vi.fn()
  const utils = render(<ObservationCheck checks={CHECKS} onClose={onClose} onComplete={onComplete} />)
  return { onClose, onComplete, ...utils }
}

describe('관찰 체크 모듈', () => {
  it('질문과 예/아직/모름 3택이 보인다', () => {
    setup()
    expect(screen.getByText('말로 표현하나요?')).toBeInTheDocument()
    const group = screen.getByRole('group', { name: '말로 표현하나요?' })
    expect(within(group).getByRole('button', { name: '예' })).toBeInTheDocument()
    expect(within(group).getByRole('button', { name: '아직' })).toBeInTheDocument()
    expect(within(group).getByRole('button', { name: '모름' })).toBeInTheDocument()
  })

  it('⭐ 평가·점수·"테스트" 표현이 없다 (OOS-6)', () => {
    const { container } = setup()
    const text = container.textContent ?? ''
    expect(text).not.toContain('테스트')
    expect(text).not.toContain('점수')
    expect(text).not.toContain('평가')
  })

  it('⭐ 한 묶음의 모든 질문에 "예" → 저장 시 그 묶음이 이룸으로 온다', async () => {
    const { onComplete } = setup()
    await userEvent.click(within(screen.getByRole('group', { name: '말로 표현하나요?' })).getByRole('button', { name: '예' }))
    await userEvent.click(within(screen.getByRole('group', { name: '스스로 하려 하나요?' })).getByRole('button', { name: '예' }))
    // 건강 묶음은 답 안 함 → 이룸 아님
    await userEvent.click(screen.getByRole('button', { name: '다 봤어요' }))
    expect(onComplete).toHaveBeenCalledWith(['cl-nuri-soc-self'])
  })

  it('⭐ 일부만 "예"면 그 묶음은 이룸이 아니다 (아직은 넛지 없이)', async () => {
    const { onComplete } = setup()
    await userEvent.click(within(screen.getByRole('group', { name: '말로 표현하나요?' })).getByRole('button', { name: '예' }))
    await userEvent.click(within(screen.getByRole('group', { name: '스스로 하려 하나요?' })).getByRole('button', { name: '아직' }))
    await userEvent.click(screen.getByRole('button', { name: '다 봤어요' }))
    expect(onComplete).toHaveBeenCalledWith([])
  })

  it('저장 후 안도 결과 화면이 뜬다', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: '다 봤어요' }))
    expect(screen.getByTestId('obs-result')).toBeInTheDocument()
    expect(screen.getByText(/챙겨지고 있어요/)).toBeInTheDocument()
  })
})
