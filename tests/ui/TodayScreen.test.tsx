/**
 * TodayScreen (F1) = 통찰-먼저 메인 — UX 리디자인 §07 (T11).
 * 안심 히어로 → 2레인 바 → 넛지 1개 → 오늘 할 일(+등원) → 펫. App 이 계산한 InsightVM 을 렌더만 한다.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TodayScreen } from '../../src/boundary/ui/TodayScreen'
import type { InsightVM } from '../../src/boundary/ui/TodayScreen'
import type { TaskVM } from '../../src/boundary/ui/vm'

const INSIGHT: InsightVM = {
  outOfRange: false, ringPct: 87, onClusters: 13, totalClusters: 15,
  learn: { total: 6, on: 4, hasInput: true },
  life: { total: 9, on: 9, hasInput: true },
  nudge: { domain: '과학·탐구', title: '산책하며 궁금해하기', effortMin: 5 },
}

const GROUPS: { domain: TaskVM['domain']; tasks: TaskVM[] }[] = [
  {
    domain: '국어',
    tasks: [{ activityId: 'hw-hangul', name: '한글 학원 숙제', domain: '국어', badgeCls: 'gov', badgeLabel: '성취기준', aim: '자음·모음의 소릿값을 안다', done: false }],
  },
  {
    domain: '영어',
    tasks: [{ activityId: 'en-book', name: '영어 원서 1권', domain: '영어', badgeCls: 'own', badgeLabel: '자체 목표', aim: '영어 그림책 한 권을 끝까지 듣는다', done: true }],
  },
]

const setup = (over: Partial<Parameters<typeof TodayScreen>[0]> = {}) => {
  const onToggle = vi.fn()
  const onGoArea = vi.fn()
  const onShare = vi.fn()
  const utils = render(
    <TodayScreen
      dateLabel="9월 3일 목요일"
      insight={INSIGHT}
      progress={{ done: 1, total: 2 }}
      schedule={[]}
      groups={GROUPS}
      onToggle={onToggle}
      onGoArea={onGoArea}
      onShare={onShare}
      {...over}
    />,
  )
  return { ...utils, onToggle, onGoArea, onShare }
}

describe('통찰-먼저 메인 — 안심 히어로 (원칙 6 · doc13 D3)', () => {
  it('⭐ 안심 히어로가 안도로 문을 연다 — "비어있어요"로 시작하지 않는다', () => {
    setup()
    const hero = screen.getByTestId('insight-hero')
    expect(hero.textContent).toContain('대부분 잘 되고 있어요')
    expect(hero.textContent).not.toMatch(/비어있어요/)
  })

  it('권위 배지가 "전문가가 세운 기준"으로 (공교육 단어 없음)', () => {
    setup()
    const hero = screen.getByTestId('insight-hero')
    expect(hero.textContent).toContain('전문가')
    expect(hero.textContent).not.toContain('공교육')
  })

  it('챙긴 게 없으면 히어로가 "준비했어요"로 뜬다', () => {
    setup({ insight: { ...INSIGHT, onClusters: 0, learn: { total: 6, on: 0, hasInput: false }, life: { total: 9, on: 0, hasInput: false } } })
    expect(screen.getByTestId('insight-hero').textContent).toContain('준비했어요')
  })
})

describe('2레인 요약 바 — 학습/생활·마음 분리, 정직 가드', () => {
  it('두 레인이 각각 뜬다', () => {
    setup()
    const lanes = screen.getByTestId('lanes2')
    expect(lanes.textContent).toContain('학습 · 국·영·수·과')
    expect(lanes.textContent).toContain('생활·마음')
    expect(lanes.textContent).toContain('우리 학원·집이 챙겨요')
    expect(lanes.textContent).toContain('유치원·일상에서')
  })

  it('⭐ 학습 미입력은 가짜 %가 아니라 "아직 안 알려주셨어요" 초대로 (정직 가드)', () => {
    setup({ insight: { ...INSIGHT, learn: { total: 6, on: 0, hasInput: false } } })
    expect(screen.getByText(/아직 학원·집공부를 안 알려주셨어요/)).toBeInTheDocument()
  })
})

describe('넛지 1개 — 급하지 않은 톤', () => {
  it('넛지가 영역·활동과 함께 뜬다', () => {
    setup()
    const nudge = screen.getByTestId('nudge')
    expect(nudge.textContent).toContain('과학·탐구')
    expect(nudge.textContent).toContain('산책하며 궁금해하기')
    expect(nudge.textContent).toContain('급하지 않아요')
  })

  it('넛지를 누르면 영역으로 이동한다', async () => {
    const { onGoArea } = setup()
    await userEvent.click(screen.getByTestId('nudge'))
    expect(onGoArea).toHaveBeenCalledTimes(1)
  })

  it('넛지가 없으면(빈칸 없음) 안 뜬다', () => {
    setup({ insight: { ...INSIGHT, nudge: null } })
    expect(screen.queryByTestId('nudge')).not.toBeInTheDocument()
  })
})

describe('지원 범위 밖', () => {
  it('band 밖이면 준비 중 안내가 뜨고 히어로는 없다', () => {
    setup({ insight: { ...INSIGHT, outOfRange: true } })
    expect(screen.getByText(/준비 중이에요/)).toBeInTheDocument()
    expect(screen.queryByTestId('insight-hero')).not.toBeInTheDocument()
  })
})

describe('오늘 할 일 — 영역별, 한 번 탭', () => {
  it('활동이 영역 그룹과 함께 뜬다', () => {
    setup()
    expect(screen.getByText('한글 학원 숙제')).toBeInTheDocument()
    expect(screen.getByText('영어 원서 1권')).toBeInTheDocument()
  })

  it('⭐ 카드 탭 1회로 onToggle(activityId) 가 불린다', async () => {
    const { onToggle } = setup()
    await userEvent.click(screen.getByTestId('task-hw-hangul'))
    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onToggle).toHaveBeenCalledWith('hw-hangul')
  })

  it('완료 카드는 aria-pressed=true', () => {
    setup()
    expect(screen.getByTestId('task-en-book')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('task-hw-hangul')).toHaveAttribute('aria-pressed', 'false')
  })

  it('출처 배지 라벨이 텍스트로 있다 (색만으로 전달하지 않음)', () => {
    setup()
    expect(within(screen.getByTestId('task-hw-hangul')).getByText('성취기준')).toBeInTheDocument()
    expect(within(screen.getByTestId('task-en-book')).getByText('자체 목표')).toBeInTheDocument()
  })

  it('겨냥 목표 문장이 카드에 보인다', () => {
    setup()
    expect(within(screen.getByTestId('task-hw-hangul')).getByText(/자음·모음의 소릿값을 안다/)).toBeInTheDocument()
  })

  it('겨냥 목표가 없으면 "겨냥 목표 없음"', () => {
    setup({ groups: [{ domain: '수학', tasks: [{ activityId: 'alpha', name: '알파짱', domain: '수학', badgeCls: 'free', badgeLabel: '자유', aim: null, done: false }] }] })
    expect(within(screen.getByTestId('task-alpha')).getByText(/겨냥 목표 없음/)).toBeInTheDocument()
  })
})

describe('C-6 — 결핍 집계·성적표가 없다', () => {
  it('⭐ "N개 밀림/미완료" 카운터나 퍼센트가 없다', () => {
    const { container } = setup()
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/\d+\s*개\s*(남음|밀림|미완료)/)
    expect(text).not.toMatch(/\d+%/)
  })
})

describe('학원 일정 스트립 (INV-ACAD-03) — 체크 없이 정보로만', () => {
  it('오늘 등원 학원이 이름·시간으로 보인다', () => {
    setup({ schedule: [{ name: '아이마음아트', time: '14:30' }] })
    const strip = screen.getByTestId('schedule')
    expect(within(strip).getByText(/아이마음아트/)).toBeInTheDocument()
    expect(within(strip).getByText(/14:30/)).toBeInTheDocument()
  })

  it('⭐ 학원 일정에는 체크 컨트롤이 없다', () => {
    setup({ schedule: [{ name: '아이마음아트', time: '14:30' }] })
    const strip = screen.getByTestId('schedule')
    expect(within(strip).queryByRole('checkbox')).not.toBeInTheDocument()
    expect(within(strip).queryByRole('button')).not.toBeInTheDocument()
  })

  it('오늘 등원이 없으면 스트립이 안 뜬다', () => {
    setup({ schedule: [] })
    expect(screen.queryByTestId('schedule')).not.toBeInTheDocument()
  })
})

describe('날짜 표시', () => {
  it('전달된 날짜 라벨이 보인다', () => {
    setup()
    expect(screen.getByText(/9월\s*3일/)).toBeInTheDocument()
  })
})
