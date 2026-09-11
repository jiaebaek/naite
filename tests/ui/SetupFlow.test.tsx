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
    <SetupFlow initialName="첫째" initialBirthYm="2021-01" ageLabelOf={() => '만 5세 8개월'} bandOf={() => 'nuri'} onComplete={onComplete} />,
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

describe('S2 과목별 학습 칩 탭 (§06-A)', () => {
  it('⭐ 과목 카드의 학원 칩을 누르면 선택된다', async () => {
    const { next } = setup()
    await next() // S1 → S2
    const chip = screen.getByRole('button', { name: '한글·독서' })
    await userEvent.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
  })

  it('⭐ 학원 칩을 누르면 그 과목에 "숙제 있어요?" 토글이 뜬다', async () => {
    const { next } = setup()
    await next()
    expect(screen.queryByText(/집에서 하는 숙제가 있어요/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '한글·독서' }))
    expect(screen.getByText(/집에서 하는 숙제가 있어요/)).toBeInTheDocument()
  })

  it('⭐ 고른 학원·집활동이 coverMode 와 함께 onComplete 로 온다', async () => {
    const { result, next } = setup()
    await next() // → S2 (과목 카드, 한 화면)
    await userEvent.click(screen.getByRole('button', { name: '한글·독서' })) // 국어 학원(숙제형 기본)
    await userEvent.click(screen.getByRole('button', { name: '태권도' }))   // 예체능 학원(등원형 기본)
    await userEvent.click(screen.getByRole('button', { name: '엄마표 영어' })) // 영어 집활동
    await userEvent.click(screen.getByRole('button', { name: /나이테 시작하기/ }))

    const r = result()
    expect(r.academies).toEqual([
      { name: '한글·독서', domain: '국어', presetType: '한글', coverMode: '숙제형' },
      { name: '태권도', domain: '예체능', presetType: '태권도', coverMode: '등원형' },
    ])
    expect(r.homeActivities).toEqual([{ name: '엄마표 영어', domain: '영어', presetType: '영어' }])
  })

  it('아무 칩도 안 고르면 빈 배열로 완료된다', async () => {
    const { result, next } = setup()
    await next()
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
    await next()
    await userEvent.click(screen.getByRole('button', { name: /나이테 시작하기/ }))
    expect(result().priorityDomains).toEqual(['국어', '수학'])
  })

  it('학원/활동 선택은 칩 탭만 — 아무것도 안 골랐을 땐 자유 입력 칸이 없다 (원칙 8)', async () => {
    const { next } = setup()
    await next() // S2 (현재 활성 스텝)
    const activeStep = document.querySelector('.setup-step.active')!
    expect(activeStep.querySelectorAll('input[type="text"]')).toHaveLength(0)
    expect(screen.getByRole('button', { name: '한글·독서' })).toBeInTheDocument()
  })
})
