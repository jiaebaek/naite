/**
 * ManageScreen (관리, drill) — UX 리디자인 §11.
 * 아이 정보 · 학원 · 활동 등록 · 성취 됨-처리 · 온보딩 다시 보기.
 * 회귀 방지: 활동/학원 등록과 '됨' 토글이 실제로 동작해야 한다.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ManageScreen } from '../../src/boundary/ui/ManageScreen'
import type { AchGroupVM } from '../../src/boundary/ui/ManageScreen'

const ACHIEVEMENT: readonly AchGroupVM[] = [
  {
    domain: '국어',
    goals: [
      { standardId: 'int-ko-find-letters', statement: '아는 글자를 찾아낸다', done: false, coveredByActivity: true },
      { standardId: 'int-ko-listen', statement: '책을 끝까지 듣는다', done: false, coveredByActivity: false },
      { standardId: 'int-ko-name', statement: '자기 이름을 쓴다', done: true, coveredByActivity: false },
    ],
  },
]

const setup = (over: Partial<React.ComponentProps<typeof ManageScreen>> = {}) => {
  const h = {
    onBack: vi.fn(), onToggleAchieved: vi.fn(), onOpenOnboarding: vi.fn(),
    onCreateAcademy: vi.fn(), onDeactivateAcademy: vi.fn(),
    onCreateActivity: vi.fn(), onDeactivateActivity: vi.fn(),
  }
  render(
    <ManageScreen
      childLabel="2021년 1월생 · 만 5세 8개월 · 2028년 3월 초등 입학"
      academies={[{ id: 'ac-plus', name: '더하다사고력', sub: '월 14:30' }]}
      activities={[{ id: 'hw-hangul', name: '한글 학원 숙제', sub: '더하다사고력 · 주 1회 · 국어' }]}
      achievement={ACHIEVEMENT}
      {...h}
      {...over}
    />,
  )
  return h
}

describe('정보 표시', () => {
  it('아이 정보·학원·활동이 보인다', () => {
    setup()
    expect(screen.getByText(/2021년 1월생/)).toBeInTheDocument()
    expect(screen.getByText('더하다사고력')).toBeInTheDocument()
    expect(screen.getByText('한글 학원 숙제')).toBeInTheDocument()
  })
})

describe('성취 됨-처리', () => {
  it('활동으로 챙기는 목표는 "활동으로 챙김" 태그 (토글 없음)', () => {
    setup()
    const row = screen.getByTestId('goal-int-ko-find-letters')
    expect(within(row).getByText('활동으로 챙김')).toBeInTheDocument()
    expect(within(row).queryByRole('button')).not.toBeInTheDocument()
  })

  it('⭐ 비어있는 목표에 "됨으로"를 누르면 onToggleAchieved 가 불린다', async () => {
    const h = setup()
    const row = screen.getByTestId('goal-int-ko-listen')
    await userEvent.click(within(row).getByRole('button', { name: '됨으로' }))
    expect(h.onToggleAchieved).toHaveBeenCalledWith('int-ko-listen')
  })

  it('이미 됨인 목표는 "됨"으로 표시된다', () => {
    setup()
    const row = screen.getByTestId('goal-int-ko-name')
    expect(within(row).getByRole('button', { name: '됨' })).toBeInTheDocument()
  })
})

describe('⭐ 활동 등록 (회귀 방지)', () => {
  it('활동 추가 → 이름 입력 → 추가하면 onCreateActivity 가 불린다', async () => {
    const h = setup()
    await userEvent.click(screen.getByRole('button', { name: /활동 추가/ }))
    const form = screen.getByTestId('activity-form')
    await userEvent.type(within(form).getByPlaceholderText('활동 이름'), '한글 놀이')
    await userEvent.click(within(form).getByRole('button', { name: '추가' }))
    expect(h.onCreateActivity).toHaveBeenCalledTimes(1)
    const input = h.onCreateActivity.mock.calls[0]![0]
    expect(input).toMatchObject({ name: '한글 놀이', track: '집', targetIds: [] })
    expect(input.cadence).toBeDefined()
  })

  it('이름 없이 추가하면 오류 메시지가 뜨고 호출되지 않는다', async () => {
    const h = setup()
    await userEvent.click(screen.getByRole('button', { name: /활동 추가/ }))
    await userEvent.click(within(screen.getByTestId('activity-form')).getByRole('button', { name: '추가' }))
    expect(screen.getByText(/이름을 입력해 주세요/)).toBeInTheDocument()
    expect(h.onCreateActivity).not.toHaveBeenCalled()
  })
})

describe('⭐ 학원 등록 (회귀 방지)', () => {
  it('학원 추가 → 이름 입력 → 추가하면 onCreateAcademy 가 불린다', async () => {
    const h = setup()
    await userEvent.click(screen.getByRole('button', { name: /학원 추가/ }))
    const form = screen.getByTestId('academy-form')
    await userEvent.type(within(form).getByPlaceholderText('학원 이름'), '영어학원')
    await userEvent.click(within(form).getByRole('button', { name: '추가' }))
    expect(h.onCreateAcademy).toHaveBeenCalledTimes(1)
    expect(h.onCreateAcademy.mock.calls[0]![0]).toMatchObject({ name: '영어학원' })
  })
})

describe('기타', () => {
  it('온보딩 다시 보기 → onOpenOnboarding', async () => {
    const h = setup()
    await userEvent.click(screen.getByRole('button', { name: '보기' }))
    expect(h.onOpenOnboarding).toHaveBeenCalled()
  })

  it('닫기(뒤로) → onBack', async () => {
    const h = setup()
    await userEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(h.onBack).toHaveBeenCalled()
  })
})
