/**
 * SetupFlow (첫 실행 셋업) — UX 리디자인 §06-A 통찰-먼저(T11).
 * S1 아이 정보 · S2 "유치원/학교 다녀요?" 1탭. 과목별 학습 입력은 §06-C(LearnPicker)로 분리.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SetupFlow } from '../../src/boundary/ui/SetupFlow'

const setup = (band: 'nuri' | 'elem' | null = 'nuri') => {
  const onComplete = vi.fn()
  render(
    <SetupFlow initialName="첫째" initialBirthYm="2021-01" ageLabelOf={() => '만 5세 8개월'} bandOf={() => band} onComplete={onComplete} />,
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

  it('⭐ 온보딩에 과목별 학습 입력이 없다 (통찰-먼저 · §06-C로 분리)', async () => {
    const { next } = setup()
    await next()
    expect(screen.queryByRole('button', { name: '한글·독서' })).not.toBeInTheDocument()
    expect(screen.queryByText(/집에서 하는 숙제가 있어요/)).not.toBeInTheDocument()
  })

  it('지원 범위 밖(band null)이면 범위 안내가 뜬다', () => {
    setup(null)
    expect(screen.getByTestId('range-warn')).toBeInTheDocument()
  })
})

describe('S2 기관 등원 1탭 (§06-A 통찰-먼저)', () => {
  it('⭐ 유치원 질문이 뜨고, 기본은 "다녀요"', async () => {
    const { next } = setup()
    await next()
    expect(screen.getByTestId('inst-pick')).toBeInTheDocument()
    expect(screen.getByTestId('inst-yes')).toHaveAttribute('aria-pressed', 'true')
    expect(within(screen.getByTestId('inst-yes')).getByText(/유치원·어린이집 등원/)).toBeInTheDocument()
  })

  it('초1~2 band 는 "학교"로 묻는다', async () => {
    const { next } = setup('elem')
    await next()
    expect(within(screen.getByTestId('inst-yes')).getByText(/학교 등원/)).toBeInTheDocument()
  })

  it('⭐ 완료하면 attendsInstitution=true 로 온다 (유치원 자동커버)', async () => {
    const { result, next } = setup()
    await next()
    await userEvent.click(screen.getByRole('button', { name: /나이테 시작하기/ }))
    const r = result()
    expect(r.attendsInstitution).toBe(true)
    expect(r.name).toBe('첫째')
    expect(r.birthYm).toBe('2021-01')
  })

  it('"아직이요"를 고르면 attendsInstitution=false', async () => {
    const { result, next } = setup()
    await next()
    await userEvent.click(screen.getByTestId('inst-no'))
    await userEvent.click(screen.getByRole('button', { name: /나이테 시작하기/ }))
    expect(result().attendsInstitution).toBe(false)
  })

  it('"나중에"로 즉시 건너뛰어도 완료된다', async () => {
    const { result } = setup()
    await userEvent.click(screen.getByRole('button', { name: '나중에' }))
    expect(result().priorityDomains).toEqual([])
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
})
