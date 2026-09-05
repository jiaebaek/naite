/**
 * AreaScreen (F3) — UX 리디자인 §08.
 * 갭 우선 정렬 · 색으로 챙김/비어있음 구분 · 선행 UI 없음(원칙 5).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AreaScreen } from '../../src/boundary/ui/AreaScreen'
import type { DomainVM, MilestoneVM } from '../../src/boundary/ui/vm'
import type { Domain } from '../../src/domain/types'

const ms = (status: MilestoneVM['status']): MilestoneVM => ({
  standardId: `s-${Math.random()}`, statement: '목표', badgeCls: 'gov', badgeLabel: '공교육·누리과정',
  status, coveredBy: status === '챙기는중' ? '활동' : null, done: status === '됨',
})
const dom = (domain: Domain, statuses: MilestoneVM['status'][], noPublic = false): DomainVM => {
  const milestones = statuses.map(ms)
  const gap = milestones.filter((m) => m.status === '활동필요').length
  const done = milestones.filter((m) => m.status === '됨').length
  const prog = milestones.filter((m) => m.status === '챙기는중').length
  const total = milestones.length
  const group: DomainVM['group'] = total === 0 ? 'full' : gap === total ? 'empty' : gap > 0 ? 'partial' : 'full'
  return { domain, milestones, total, on: total - gap, done, prog, gap, group, noPublic }
}

// 국어=부분, 과학·탐구=비어있음, 건강·안전=완료 (프로토타입 축약)
const DOMAINS_VM: readonly DomainVM[] = [
  dom('국어', ['챙기는중', '활동필요']),
  dom('과학·탐구', ['활동필요', '활동필요', '활동필요']),
  dom('건강·안전', ['챙기는중', '챙기는중', '챙기는중']),
]

const setup = () => {
  const onOpenDetail = vi.fn()
  const utils = render(<AreaScreen dateLabel="9월 3일 목요일" domains={DOMAINS_VM} onOpenDetail={onOpenDetail} />)
  return { ...utils, onOpenDetail }
}

describe('갭 우선 정렬', () => {
  it('세 그룹 라벨이 모두 있다', () => {
    setup()
    expect(screen.getByText('먼저 챙기면 좋아요')).toBeInTheDocument()
    expect(screen.getByText('채우는 중')).toBeInTheDocument()
    expect(screen.getByText('비어있는 곳 없어요')).toBeInTheDocument()
  })

  it('⭐ 비어있는 영역이 DOM 상 맨 위에 온다', () => {
    const { container } = setup()
    const cards = [...container.querySelectorAll('[data-testid^="domain-"]')]
    expect(cards[0]!.getAttribute('data-testid')).toBe('domain-과학·탐구')
  })
})

describe('개요 — 몇 곳이 비어있는가', () => {
  it('챙김/비어있음 수가 요약된다', () => {
    setup()
    expect(screen.getByText(/3개 영역 중 2곳 챙기고 있어요/)).toBeInTheDocument()
    expect(screen.getByText(/비어있는 곳 1/)).toBeInTheDocument()
  })
})

describe('⭐ 원칙 5 — 선행 UI 가 없다 (회귀 방지)', () => {
  it('"선행"·"1년"·"2년" 같은 선행 문구가 화면에 없다', () => {
    const { container } = setup()
    const text = container.textContent ?? ''
    expect(text).not.toContain('선행')
    expect(text).not.toMatch(/[12]\s*년\s*선행/)
  })

  it('오프셋 선택 컨트롤(라디오/셀렉트)이 없다', () => {
    setup()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})

describe('드릴다운', () => {
  it('영역 카드의 액션을 누르면 onOpenDetail(domain)', async () => {
    const { onOpenDetail } = setup()
    const card = screen.getByTestId('domain-과학·탐구')
    await userEvent.click(within(card).getAllByRole('button')[0]!)
    expect(onOpenDetail).toHaveBeenCalledWith('과학·탐구')
  })
})
