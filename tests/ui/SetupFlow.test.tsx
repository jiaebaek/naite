/**
 * SetupFlow (첫 실행 셋업) — UX 리디자인 §06-A.
 * 2스텝: 아이 정보(이름·생년월) → 내 학원(선택). 완료 시 SetupResult.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SetupFlow } from '../../src/boundary/ui/SetupFlow'

const setup = () => {
  const onComplete = vi.fn()
  render(
    <SetupFlow
      initialName="첫째"
      initialBirthYm="2021-01"
      ageLabelOf={() => '만 5세 8개월'}
      onComplete={onComplete}
    />,
  )
  return { onComplete }
}

describe('S1 아이 정보', () => {
  it('이름·생년월·나이 리워드가 보인다', () => {
    setup()
    expect(screen.getByText(/누구의 나이테를/)).toBeInTheDocument()
    expect(screen.getByDisplayValue('첫째')).toBeInTheDocument()
    expect(screen.getByText(/만 5세 8개월 좌표를 준비했어요/)).toBeInTheDocument()
  })
})

describe('S2 내 학원 + 완료', () => {
  it('⭐ 학원을 입력하고 완료하면 onComplete(학원 포함)', async () => {
    const { onComplete } = setup()
    await userEvent.clear(screen.getByDisplayValue('첫째'))
    await userEvent.type(screen.getByPlaceholderText('예: 첫째'), '봄이')
    await userEvent.click(screen.getByRole('button', { name: '다음' }))
    // S2
    await userEvent.type(screen.getByPlaceholderText('예: 한글교실'), '한글교실')
    await userEvent.click(screen.getByRole('button', { name: '수' }))
    await userEvent.click(screen.getByRole('button', { name: /나이테 시작하기/ }))
    expect(onComplete).toHaveBeenCalledTimes(1)
    const r = onComplete.mock.calls[0]![0]
    expect(r.name).toBe('봄이')
    expect(r.birthYm).toBe('2021-01')
    expect(r.academy).toMatchObject({ name: '한글교실', weekdays: [3] })
  })

  it('"아직 없어요"로 스킵하면 학원 없이 완료', async () => {
    const { onComplete } = setup()
    await userEvent.click(screen.getByRole('button', { name: '다음' }))
    await userEvent.click(screen.getByRole('button', { name: /아직 없어요/ }))
    expect(onComplete.mock.calls[0]![0].academy).toBeNull()
  })

  it('"나중에"로 건너뛰면 학원 없이 완료', async () => {
    const { onComplete } = setup()
    await userEvent.click(screen.getByRole('button', { name: '나중에' }))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete.mock.calls[0]![0].academy).toBeNull()
  })
})
