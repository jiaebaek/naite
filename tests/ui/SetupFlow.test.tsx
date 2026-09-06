/**
 * SetupFlow (첫 실행 셋업) — UX 리디자인 §06-A.
 * S1 아이 정보. S2 "무엇으로 챙기나요?" — 학원·집 활동을 리스트로 더한다.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SetupFlow } from '../../src/boundary/ui/SetupFlow'

const setup = () => {
  const onComplete = vi.fn()
  render(
    <SetupFlow initialName="첫째" initialBirthYm="2021-01" ageLabelOf={() => '만 5세 8개월'} onComplete={onComplete} />,
  )
  const items = () => onComplete.mock.calls[0]![0].items
  const toS2 = () => userEvent.click(screen.getByRole('button', { name: '다음' }))
  return { onComplete, items, toS2 }
}

describe('S1 아이 정보', () => {
  it('이름·생년월·나이 리워드가 보인다', () => {
    setup()
    expect(screen.getByText(/누구의 나이테를/)).toBeInTheDocument()
    expect(screen.getByDisplayValue('첫째')).toBeInTheDocument()
    expect(screen.getByText(/만 5세 8개월 좌표를 준비했어요/)).toBeInTheDocument()
  })
})

describe('S2 무엇으로 챙기나요 — 학원·집 활동', () => {
  it('⭐ 학원과 집 활동을 둘 다 더하고 완료하면 onComplete(items 둘 다)', async () => {
    const { items, toS2 } = setup()
    await toS2()
    // 학원 하나 (더하기까지)
    await userEvent.type(screen.getByPlaceholderText('예: 한글교실 / 엄마표 영어'), '한글교실')
    await userEvent.click(screen.getByRole('button', { name: '학원 다녀요' }))
    await userEvent.click(screen.getByRole('button', { name: '수' }))
    await userEvent.click(screen.getByRole('button', { name: '국어' }))
    await userEvent.click(screen.getByRole('button', { name: /더하기/ }))
    expect(screen.getByTestId('setup-list').textContent).toContain('한글교실')
    // 집 활동 하나 (더하기 없이 시작 시 함께 반영)
    await userEvent.type(screen.getByPlaceholderText('예: 한글교실 / 엄마표 영어'), '엄마표 영어')
    await userEvent.click(screen.getByRole('button', { name: '집에서 해요' }))
    await userEvent.click(screen.getByRole('button', { name: '영어' }))
    await userEvent.click(screen.getByRole('button', { name: /나이테 시작하기/ }))

    expect(items()).toEqual([
      { kind: '학원', name: '한글교실', domains: ['국어'], weekdays: [3] },
      { kind: '집', name: '엄마표 영어', domains: ['영어'], weekdays: [] },
    ])
  })

  it('이름·영역 없으면 "더하기"가 비활성', async () => {
    const { toS2 } = setup()
    await toS2()
    expect(screen.getByRole('button', { name: /더하기/ })).toBeDisabled()
  })

  it('"아직 없어요"로 스킵하면 items 빈 배열', async () => {
    const { items, toS2 } = setup()
    await toS2()
    await userEvent.click(screen.getByRole('button', { name: /아직 없어요/ }))
    expect(items()).toEqual([])
  })

  it('"나중에"로 건너뛰면 items 빈 배열', async () => {
    const { items } = setup()
    await userEvent.click(screen.getByRole('button', { name: '나중에' }))
    expect(items()).toEqual([])
  })
})
