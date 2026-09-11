/**
 * DetailScreen (영역 상세, drill) — UX 리디자인 §09 (2축 3상태).
 * 비어있음 → 챙기는 중 → 이룸. 이룸(됨)은 활동과 무관하게 언제나 토글.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DetailScreen } from '../../src/boundary/ui/DetailScreen'
import type { DomainVM, MilestoneVM } from '../../src/boundary/ui/vm'

const EMPTY: MilestoneVM = {
  standardId: 'int-ko-find-letters', statement: '간판·과자봉지에서 아는 글자를 찾아낸다',
  badgeCls: 'gov', badgeLabel: '공교육·누리과정', status: '활동필요', coveredBy: null, done: false,
  // 추천은 근거 있는 라이브러리 항목이 있을 때만 채워진다(§10-A) — 화면 렌더 확인용 픽스처
  recommend: { title: '그림책 속 글자 손가락으로 짚기', badgeCls: 'gov', sourceLabel: '공교육·누리과정', effortMin: 5, placeLabel: '집', cost: 'free' },
}
const PROG: MilestoneVM = {
  standardId: 'int-ko-sounds', statement: '자음·모음의 소릿값을 안다',
  badgeCls: 'gov', badgeLabel: '공교육·성취기준', status: '챙기는중', coveredBy: '한글 학원 숙제', done: false,
}
const DONE: MilestoneVM = {
  standardId: 'int-ko-name', statement: '자기 이름을 쓴다',
  badgeCls: 'gov', badgeLabel: '공교육·성취기준', status: '됨', coveredBy: null, done: true,
}
const VM: DomainVM = {
  domain: '국어', milestones: [EMPTY, PROG, DONE], total: 3, on: 2, done: 1, prog: 1, gap: 1, group: 'partial', lane: '학습', noPublic: false, priority: false,
}

const setup = (vm: DomainVM = VM) => {
  const onBack = vi.fn(); const onOpenLink = vi.fn(); const onToggleAchieved = vi.fn()
  render(<DetailScreen vm={vm} onBack={onBack} onOpenLink={onOpenLink} onToggleAchieved={onToggleAchieved} />)
  return { onBack, onOpenLink, onToggleAchieved }
}

describe('요약 — 3상태 카운트', () => {
  it('이룸·챙기는 중·비어있음 수가 요약에 나온다', () => {
    setup()
    const cover = screen.getByText(/묶음 3곳/)
    expect(cover.textContent).toMatch(/이룸 1/)
    expect(cover.textContent).toMatch(/챙기는 중 1/)
    expect(cover.textContent).toMatch(/비어있음 1곳/)
  })

  it('비어있음이 0이면 "비어있음 없음"', () => {
    setup({ ...VM, milestones: [PROG, DONE], total: 2, on: 2, done: 1, prog: 1, gap: 0, group: 'full' })
    expect(screen.getByText(/비어있음 없음/)).toBeInTheDocument()
  })
})

describe('세 그룹 · 상태별 액션', () => {
  it('비어있음: 추천 활동 + [활동 연결] [이뤘어요]', () => {
    setup()
    const card = screen.getByTestId('ms-int-ko-find-letters')
    expect(within(card).getByText(/그림책 속 글자 손가락으로 짚기/)).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: '활동 연결' })).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: '이뤘어요' })).toBeInTheDocument()
  })

  it('챙기는 중: "{활동}로 챙기는 중" + [이뤘어요] (활동 연결·해제 없음)', () => {
    setup()
    const card = screen.getByTestId('ms-int-ko-sounds')
    expect(within(card).getByText(/한글 학원 숙제로 챙기는 중/)).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: '이뤘어요' })).toBeInTheDocument()
    expect(within(card).queryByRole('button', { name: '활동 연결' })).not.toBeInTheDocument()
  })

  it('이룸: "이뤘어요" + 부제 + [이룸 해제]', () => {
    setup()
    const card = screen.getByTestId('ms-int-ko-name')
    expect(within(card).getByText('직접 확인함')).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: '이룸 해제' })).toBeInTheDocument()
  })

  it('활동으로 이룬 목표는 부제가 "활동으로 이룸"', () => {
    setup({ ...VM, milestones: [{ ...DONE, coveredBy: '한글 학원 숙제' }], total: 1, on: 1, done: 1, prog: 0, gap: 0, group: 'full' })
    expect(screen.getByText('활동으로 이룸')).toBeInTheDocument()
  })
})

describe('액션 콜백', () => {
  it('[활동 연결] → onOpenLink(목표)', async () => {
    const { onOpenLink } = setup()
    await userEvent.click(screen.getByRole('button', { name: '활동 연결' }))
    expect(onOpenLink).toHaveBeenCalledWith(EMPTY)
  })

  it('⭐ [이뤘어요] → onToggleAchieved(standardId)', async () => {
    const { onToggleAchieved } = setup()
    await userEvent.click(within(screen.getByTestId('ms-int-ko-find-letters')).getByRole('button', { name: '이뤘어요' }))
    expect(onToggleAchieved).toHaveBeenCalledWith('int-ko-find-letters')
  })

  it('⭐ [이룸 해제] → onToggleAchieved(standardId) (되돌릴 수 있다)', async () => {
    const { onToggleAchieved } = setup()
    await userEvent.click(screen.getByRole('button', { name: '이룸 해제' }))
    expect(onToggleAchieved).toHaveBeenCalledWith('int-ko-name')
  })
})

describe('⭐ 원칙 5 — 상세에도 선행 UI 가 없다', () => {
  it('선행 문구가 없다', () => {
    setup()
    expect(document.body.textContent ?? '').not.toContain('선행')
  })
})

describe('⭐ T7 — 묶음 목록 + 근거 상세 (개별 성취기준)', () => {
  const cl = (id: string, statement: string, status: MilestoneVM['status'], evidence: readonly string[]): MilestoneVM => ({
    standardId: id, statement, badgeCls: 'gov', badgeLabel: '공교육·누리과정', status,
    coveredBy: status === '챙기는중' ? '그림책 읽기' : null, done: status === '됨', evidence,
  })
  const clVM: DomainVM = {
    domain: '국어',
    milestones: [
      cl('cl-nuri-ko-listen', '듣기·말하기', '챙기는중', ['말이나 이야기를 관심 있게 듣는다', '자신의 경험, 느낌, 생각을 말한다']),
      cl('cl-nuri-ko-literacy', '읽기·쓰기 관심', '활동필요', ['주변의 상징, 글자 등의 읽기에 관심을 가진다']),
    ],
    total: 2, on: 1, done: 0, prog: 1, gap: 1, group: 'partial', lane: '학습', noPublic: false, priority: false,
  }

  it('묶음이 카드로 뜬다(묶음 라벨)', () => {
    setup(clVM)
    expect(screen.getByText('듣기·말하기')).toBeInTheDocument()
    expect(screen.getByText('읽기·쓰기 관심')).toBeInTheDocument()
  })

  it('각 묶음에 근거 상세(개별 성취기준 원문)가 붙는다', () => {
    setup(clVM)
    const card = screen.getByTestId('ms-cl-nuri-ko-listen')
    expect(within(card).getByText(/근거 2개/)).toBeInTheDocument()
    expect(within(card).getByText('말이나 이야기를 관심 있게 듣는다')).toBeInTheDocument()
  })

  it('챙기는 중 묶음이 비어있음보다 위로 정렬된다 (안도-우선)', () => {
    setup(clVM)
    const cards = screen.getAllByTestId(/^ms-/)
    expect(cards[0]).toHaveAttribute('data-testid', 'ms-cl-nuri-ko-listen')
  })
})
