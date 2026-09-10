/**
 * SetupFlow (첫 실행 셋업) — UX 리디자인 §06-A (3스텝 · 칩 탭, 원칙 8).
 * S1 아이 정보 · S2 다니는 학원(과목 칩) · S3 집에서 하는 것(활동 칩).
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
  const result = () => onComplete.mock.calls[0]![0]
  const next = () => userEvent.click(screen.getByRole('button', { name: '다음' }))
  return { onComplete, result, next }
}

describe('S1 아이 정보', () => {
  it('이름·생년월·나이 리워드가 보인다', () => {
    setup()
    expect(screen.getByText(/누구의 나이테를/)).toBeInTheDocument()
    expect(screen.getByDisplayValue('첫째')).toBeInTheDocument()
    expect(screen.getByText(/만 5세 8개월 좌표를 준비했어요/)).toBeInTheDocument()
  })
})

describe('S2·S3 칩 탭', () => {
  it('⭐ 과목 칩을 누르면 "다니는 학원" 목록에 쌓이고 영역 챙김을 예고한다', async () => {
    const { next } = setup()
    await next() // S1 → S2
    await userEvent.click(screen.getByRole('button', { name: '한글·독서' }))
    expect(screen.getByText(/다니는 학원 1개/)).toBeInTheDocument()
    expect(screen.getByText(/국어 챙김/)).toBeInTheDocument()
  })

  it('⭐ 3스텝을 지나며 고른 학원·활동이 onComplete 로 온다', async () => {
    const { result, next } = setup()
    await next() // → S2
    await userEvent.click(screen.getByRole('button', { name: '한글·독서' })) // 국어 학원
    await userEvent.click(screen.getByRole('button', { name: '태권도' }))   // 예체능 학원(프리셋 기준)
    await next() // → S3
    await userEvent.click(screen.getByRole('button', { name: '엄마표 영어' })) // 영어 집활동
    await userEvent.click(screen.getByRole('button', { name: /나이테 시작하기/ }))

    const r = result()
    // 칩은 활동유형 프리셋 type 을 함께 넘긴다(App 이 이걸로 겨냥 목표를 확정). 태권도 영역=예체능(프리셋 원천).
    expect(r.academies).toEqual([
      { name: '한글·독서', domain: '국어', presetType: '한글' },
      { name: '태권도', domain: '예체능', presetType: '태권도' },
    ])
    expect(r.homeActivities).toEqual([{ name: '엄마표 영어', domain: '영어', presetType: '영어' }])
  })

  it('칩을 안 고르면 빈 배열로 완료된다', async () => {
    const { result, next } = setup()
    await next(); await next() // S2, S3 그냥 통과
    await userEvent.click(screen.getByRole('button', { name: /나이테 시작하기/ }))
    expect(result().academies).toEqual([])
    expect(result().homeActivities).toEqual([])
  })

  it('"나중에"로 즉시 건너뛰면 빈 배열', async () => {
    const { result } = setup()
    await userEvent.click(screen.getByRole('button', { name: '나중에' }))
    expect(result().academies).toEqual([])
    expect(result().homeActivities).toEqual([])
  })

  it('⭐ 우선 분야를 최대 2개 고르면 결과에 담긴다 (부모가 정하는 중요도)', async () => {
    const { result, next } = setup()
    await userEvent.click(screen.getByRole('button', { name: '국어' }))
    await userEvent.click(screen.getByRole('button', { name: '수학' }))
    expect(screen.getByRole('button', { name: '과학·탐구' })).toBeDisabled() // 최대 2개
    await next(); await next()
    await userEvent.click(screen.getByRole('button', { name: /나이테 시작하기/ }))
    expect(result().priorityDomains).toEqual(['국어', '수학'])
  })

  it('학원/활동 선택은 칩 탭만 — 자유 입력 칸이 없다 (원칙 8)', async () => {
    const { next } = setup()
    await next() // S2 (현재 활성 스텝)
    const activeStep = document.querySelector('.setup-step.active')!
    expect(activeStep.querySelectorAll('input')).toHaveLength(0) // S2엔 입력칸 없음
    expect(screen.getByRole('button', { name: '한글·독서' })).toBeInTheDocument()
  })
})
