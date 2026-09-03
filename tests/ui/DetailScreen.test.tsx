/**
 * DetailScreen (영역 상세, drill) — UX 리디자인 §09.
 * 비어있는 목표를 위로 · 추천 활동 + [활동 연결]/[이미 해요].
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DetailScreen } from '../../src/boundary/ui/DetailScreen'
import type { DomainVM, MilestoneVM } from '../../src/boundary/ui/vm'

const EMPTY: MilestoneVM = {
  standardId: 'int-ko-find-letters', statement: '간판·과자봉지에서 아는 글자를 찾아낸다',
  badgeCls: 'gov', badgeLabel: '공교육·누리과정', status: '활동필요', coveredBy: null, done: false,
  recommend: '마트에서 글자 찾기 놀이',
}
const ON: MilestoneVM = {
  standardId: 'int-ko-listen', statement: '책을 읽어주면 끝까지 듣는다',
  badgeCls: 'gov', badgeLabel: '공교육·누리과정', status: '챙기는중', coveredBy: '한글 학원 숙제', done: false,
}
const VM: DomainVM = {
  domain: '국어', milestones: [EMPTY, ON], total: 2, on: 1, gap: 1, group: 'partial', noPublic: false,
}

const setup = () => {
  const onBack = vi.fn(); const onOpenLink = vi.fn(); const onMarkDone = vi.fn()
  const utils = render(<DetailScreen vm={VM} onBack={onBack} onOpenLink={onOpenLink} onMarkDone={onMarkDone} />)
  return { ...utils, onBack, onOpenLink, onMarkDone }
}

describe('비어있는 목표 우선', () => {
  it('갭 목표에 추천 활동이 붙는다', () => {
    setup()
    const card = screen.getByTestId('ms-int-ko-find-letters')
    expect(within(card).getByText(/마트에서 글자 찾기 놀이/)).toBeInTheDocument()
  })

  it('챙기는 중 목표는 무엇으로 챙기는지 보여준다', () => {
    setup()
    const card = screen.getByTestId('ms-int-ko-listen')
    expect(within(card).getByText(/한글 학원 숙제/)).toBeInTheDocument()
  })
})

describe('갭 메우기 액션', () => {
  it('[활동 연결]을 누르면 onOpenLink(목표)', async () => {
    const { onOpenLink } = setup()
    await userEvent.click(screen.getByRole('button', { name: '활동 연결' }))
    expect(onOpenLink).toHaveBeenCalledWith(EMPTY)
  })

  it('[이미 해요]를 누르면 onMarkDone(standardId)', async () => {
    const { onMarkDone } = setup()
    await userEvent.click(screen.getByRole('button', { name: '이미 해요' }))
    expect(onMarkDone).toHaveBeenCalledWith('int-ko-find-letters')
  })

  it('뒤로 가기 버튼이 동작한다', async () => {
    const { onBack } = setup()
    await userEvent.click(screen.getByRole('button', { name: '영역으로' }))
    expect(onBack).toHaveBeenCalled()
  })
})

describe('⭐ 원칙 5 — 상세에도 선행 UI 가 없다', () => {
  it('선행 문구가 없다', () => {
    const { container } = setup()
    expect(container.textContent ?? '').not.toContain('선행')
  })
})
