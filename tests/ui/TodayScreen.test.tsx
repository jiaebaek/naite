/**
 * TodayScreen (F1) — UX 리디자인 §07.
 * 갭 배너(최우선) → 오늘 할 일(+등원) → 펫(강등). App 이 계산한 VM 을 렌더만 한다.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TodayScreen } from '../../src/boundary/ui/TodayScreen'
import type { GapBanner } from '../../src/boundary/ui/TodayScreen'
import type { TaskVM } from '../../src/boundary/ui/vm'

const GAP_BANNER: GapBanner = {
  gapCount: 2, onCount: 5, totalDomains: 7,
  gapNames: ['과학·탐구', '사회·인성'], clear: false,
  segs: ['on', 'on', 'gap', 'on', 'gap', 'on', 'on'],
}
const CLEAR_BANNER: GapBanner = {
  gapCount: 0, onCount: 7, totalDomains: 7, gapNames: [], clear: true,
  segs: ['on', 'on', 'on', 'on', 'on', 'on', 'on'],
}

const GROUPS: { domain: TaskVM['domain']; tasks: TaskVM[] }[] = [
  {
    domain: '국어',
    tasks: [{ activityId: 'hw-hangul', name: '한글 학원 숙제', domain: '국어', badgeCls: 'gov', badgeLabel: '공교육·성취기준', aim: '자음·모음의 소릿값을 안다', done: false }],
  },
  {
    domain: '영어',
    tasks: [{ activityId: 'en-book', name: '영어 원서 1권', domain: '영어', badgeCls: 'own', badgeLabel: '자체 목표', aim: '영어 그림책 한 권을 끝까지 듣는다', done: true }],
  },
]

const setup = (over: Partial<Parameters<typeof TodayScreen>[0]> = {}) => {
  const onToggle = vi.fn()
  const onGoArea = vi.fn()
  const utils = render(
    <TodayScreen
      dateLabel="9월 3일 목요일"
      banner={GAP_BANNER}
      progress={{ done: 1, total: 2 }}
      schedule={[]}
      groups={GROUPS}
      onToggle={onToggle}
      onGoArea={onGoArea}
      {...over}
    />,
  )
  return { ...utils, onToggle, onGoArea }
}

describe('현황 배너 — 안도 먼저, 갭은 넌지시 (원칙 6)', () => {
  it('⭐ 헤드라인은 안도로 시작한다 ("벌써 N곳") — "비어있어요"로 문 열지 않는다', () => {
    setup()
    const head = screen.getByText(/벌써 5곳을 챙기고 있어요/)
    expect(head).toBeInTheDocument()
    // 배너 헤드가 갭 문구로 시작하지 않음
    expect(head.textContent).not.toMatch(/비어있어요/)
  })

  it('갭은 서브에서 넌지시 + 갭 영역 칩', () => {
    setup()
    expect(screen.getByText(/2곳만 더 보면/)).toBeInTheDocument()
    expect(screen.getByText('과학·탐구')).toBeInTheDocument()
    expect(screen.getByText('사회·인성')).toBeInTheDocument()
  })

  it('CTA "비어있는 곳 보기"를 누르면 영역으로 이동한다', async () => {
    const { onGoArea } = setup()
    await userEvent.click(screen.getByRole('button', { name: /비어있는 곳 보기/ }))
    expect(onGoArea).toHaveBeenCalledTimes(1)
  })

  it('갭이 없으면 안심 문구가 뜨고 CTA 는 없다', () => {
    setup({ banner: CLEAR_BANNER })
    expect(screen.getByText(/놓친 곳이 없어요/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /비어있는 곳 보기/ })).not.toBeInTheDocument()
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
    expect(within(screen.getByTestId('task-hw-hangul')).getByText('공교육·성취기준')).toBeInTheDocument()
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
