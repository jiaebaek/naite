/**
 * ManageScreen (관리, drill) — UX 리디자인 §12.
 * 목록·성취 됨-처리. 추가/편집은 콜백으로 바텀시트(ManageSheet)를 연다.
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
      { standardId: 'int-ko-find-letters', statement: '아는 글자를 찾아낸다', done: false, coveredBy: '한글 학원 숙제' },
      { standardId: 'int-ko-listen', statement: '책을 끝까지 듣는다', done: false, coveredBy: null },
      { standardId: 'int-ko-name', statement: '자기 이름을 쓴다', done: true, coveredBy: null },
    ],
  },
]

const setup = (over: Partial<React.ComponentProps<typeof ManageScreen>> = {}) => {
  const h = {
    onBack: vi.fn(), onToggleAchieved: vi.fn(), onOpenOnboarding: vi.fn(),
    onAddAcademy: vi.fn(), onEditAcademy: vi.fn(), onAddActivity: vi.fn(), onEditActivity: vi.fn(),
  }
  render(
    <ManageScreen
      childLabel="2021년 1월생 · 만 5세 8개월 · 2028년 3월 초등 입학"
      academies={[{ id: 'ac-plus', name: '더하다사고력', sub: '월 14:30' }]}
      activities={[{ id: 'hw-hangul', name: '한글 학원 숙제', sub: '더하다사고력 · 주 1회 · 국어 겨냥 1곳' }]}
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

describe('성취 됨-처리 (2축 3상태)', () => {
  it('⭐ 활동으로 챙기는 목표도 됨 토글을 그대로 노출한다 + "챙기는 중" 부제', () => {
    setup()
    const row = screen.getByTestId('goal-int-ko-find-letters')
    expect(within(row).getByText('한글 학원 숙제로 챙기는 중')).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: '됨으로' })).toBeInTheDocument()
    expect(within(row).queryByText('활동으로 챙김')).not.toBeInTheDocument()
  })

  it('⭐ 비어있는 목표에 "됨으로"를 누르면 onToggleAchieved 가 불린다', async () => {
    const h = setup()
    const row = screen.getByTestId('goal-int-ko-listen')
    await userEvent.click(within(row).getByRole('button', { name: '됨으로' }))
    expect(h.onToggleAchieved).toHaveBeenCalledWith('int-ko-listen')
  })

  it('이미 됨인 목표는 "됨"으로 표시된다', () => {
    setup()
    expect(within(screen.getByTestId('goal-int-ko-name')).getByRole('button', { name: '됨' })).toBeInTheDocument()
  })
})

describe('⭐ 추가/편집 → 시트 콜백 (회귀 방지)', () => {
  it('활동 추가 → onAddActivity', async () => {
    const h = setup()
    await userEvent.click(screen.getByRole('button', { name: /활동 추가/ }))
    expect(h.onAddActivity).toHaveBeenCalledTimes(1)
  })

  it('학원 추가 → onAddAcademy', async () => {
    const h = setup()
    await userEvent.click(screen.getByRole('button', { name: /학원 추가/ }))
    expect(h.onAddAcademy).toHaveBeenCalledTimes(1)
  })

  it('활동 편집 → onEditActivity(id)', async () => {
    const h = setup()
    await userEvent.click(within(screen.getByTestId('activity-hw-hangul')).getByRole('button', { name: '편집' }))
    expect(h.onEditActivity).toHaveBeenCalledWith('hw-hangul')
  })

  it('학원 편집 → onEditAcademy(id)', async () => {
    const h = setup()
    await userEvent.click(within(screen.getByTestId('academy-ac-plus')).getByRole('button', { name: '편집' }))
    expect(h.onEditAcademy).toHaveBeenCalledWith('ac-plus')
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
