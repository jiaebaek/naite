/**
 * AreaScreen (F3) — §8 lean (B). 안심 한 줄 + 접힌 잘함 + 살펴볼 초대 1~2개. 표시만(계산 불변).
 * pip·커버리지 바·3그룹·pill 남발 제거(상세로). 생활·마음 안심 레인 유지.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AreaScreen } from '../../src/boundary/ui/AreaScreen'
import type { DomainVM, MilestoneVM } from '../../src/boundary/ui/vm'
import type { Domain } from '../../src/domain/types'
import { laneOf } from '../../src/domain/lanes'

const ms = (status: MilestoneVM['status']): MilestoneVM => ({
  standardId: `s-${Math.random()}`, statement: '목표', badgeCls: 'gov', badgeLabel: '누리과정',
  status, coveredBy: status === '챙기는중' ? '활동' : null, done: status === '됨',
})
const dom = (domain: Domain, statuses: MilestoneVM['status'][], noPublic = false): DomainVM => {
  const milestones = statuses.map(ms)
  const gap = milestones.filter((m) => m.status === '활동필요').length
  const done = milestones.filter((m) => m.status === '됨').length
  const prog = milestones.filter((m) => m.status === '챙기는중').length
  const total = milestones.length
  const group: DomainVM['group'] = total === 0 ? 'full' : gap === total ? 'empty' : gap > 0 ? 'partial' : 'full'
  return { domain, milestones, total, on: total - gap, done, prog, gap, group, lane: laneOf(domain), noPublic, priority: false }
}

// 학습: 국어=부분(잘함), 과학·탐구=비어있음(살펴볼), 수학=완료(잘함). + 생활: 건강·안전(안심).
const DOMAINS_VM: readonly DomainVM[] = [
  dom('국어', ['챙기는중', '활동필요']),
  dom('과학·탐구', ['활동필요', '활동필요', '활동필요']),
  dom('수학', ['챙기는중', '챙기는중', '챙기는중']),
  dom('건강·안전', ['챙기는중', '챙기는중', '챙기는중']),
]

const setup = () => {
  const onOpenDetail = vi.fn()
  const utils = render(<AreaScreen dateLabel="9월 3일 목요일" domains={DOMAINS_VM} onOpenDetail={onOpenDetail} />)
  return { ...utils, onOpenDetail }
}

describe('lean — 안심 한 줄 + 접힌 잘함 + 살펴볼 초대', () => {
  it('상단은 안심 한 줄(말로) — 커버리지 바·숫자 없음', () => {
    const { container } = setup()
    expect(screen.getByText('학습, 대부분 잘 되고 있어요')).toBeInTheDocument()
    expect(screen.getByText(/전문가가 세운 기준으로/)).toBeInTheDocument()
    expect(container.querySelector('.coverbar')).toBeNull()
  })

  it('⭐ 잘 챙기는 영역은 접힌 한 줄 — 카드로 안 깔린다', () => {
    setup()
    const fold = screen.getByTestId('well-fold')
    expect(fold.textContent).toContain('국어 · 수학')
    expect(fold.textContent).toContain('잘 되고 있어요')
    // 접힘: 국어 행이 아직 없다
    expect(screen.queryByTestId('domain-국어')).not.toBeInTheDocument()
  })

  it('접힌 줄을 펼치면 조망 + 각 영역 상세로', async () => {
    const { onOpenDetail } = setup()
    await userEvent.click(screen.getByTestId('well-fold'))
    expect(screen.getByTestId('domain-국어')).toBeInTheDocument()
    await userEvent.click(screen.getByTestId('domain-수학'))
    expect(onOpenDetail).toHaveBeenCalledWith('수학')
  })

  it('⭐ 살펴볼 곳 = 점선 초대 카드(경보 아님)', () => {
    setup()
    expect(screen.getByText(/살펴볼 곳/)).toBeInTheDocument()
    const card = screen.getByTestId('domain-과학·탐구')
    expect(within(card).getByText('알려주기')).toBeInTheDocument()
    expect(card.textContent).toContain('급하지 않아요')
  })

  it('살펴볼 카드를 누르면 onOpenDetail(domain)', async () => {
    const { onOpenDetail } = setup()
    await userEvent.click(screen.getByTestId('domain-과학·탐구'))
    expect(onOpenDetail).toHaveBeenCalledWith('과학·탐구')
  })

  it('옛 3그룹 라벨·pill 남발 제거', () => {
    setup()
    expect(screen.queryByText('먼저 챙기면 좋아요')).not.toBeInTheDocument()
    expect(screen.queryByText('채우는 중')).not.toBeInTheDocument()
  })
})

describe('⭐ 원칙 5 — 선행 UI 가 없다 (회귀 방지)', () => {
  it('"선행" 문구·오프셋 컨트롤이 없다', () => {
    const { container } = setup()
    expect((container.textContent ?? '')).not.toContain('선행')
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})

describe('⭐ 부모 우선 분야 (중요도 = 부모가 정함)', () => {
  it('살펴볼 초대에서 우선 분야가 맨 위 + "중요"', () => {
    // 과학·탐구, 예체능 둘 다 비어있음(살펴볼). 예체능이 부모 우선 → 맨 위.
    const doms: readonly DomainVM[] = [
      dom('과학·탐구', ['활동필요', '활동필요']),
      { ...dom('예체능', ['활동필요', '활동필요']), priority: true },
    ]
    const { container } = render(<AreaScreen dateLabel="9월 3일" domains={doms} onOpenDetail={vi.fn()} />)
    const cards = [...container.querySelectorAll('[data-testid^="domain-"]')]
    expect(cards[0]!.getAttribute('data-testid')).toBe('domain-예체능')
    expect(within(cards[0] as HTMLElement).getByText('중요')).toBeInTheDocument()
  })
})

describe('⭐ 생활·마음 안심 레인(유지)', () => {
  it('생활·마음이 별도 안심 섹션, 비어있어도 갭 알람 톤이 아니다', () => {
    setup()
    const life = screen.getByTestId('lane-life')
    expect(within(life).getAllByText(/일상에서 챙겨지고 있어요/).length).toBeGreaterThan(0)
  })
})
