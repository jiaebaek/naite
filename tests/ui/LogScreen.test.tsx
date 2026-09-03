/**
 * ARRR 사이클 #21 — (Boundary) 기록 화면 F4
 * 계약: docs/08-UI계약.md §6 · 피드백 ⑦⑧
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogScreen } from '../../src/boundary/ui/LogScreen'
import type { WeekDay } from '../../src/boundary/ui/LogScreen'
import type { WeeklyReportRow } from '../../src/domain/report'
import type { Task } from '../../src/domain/types'

const WEEK: readonly WeekDay[] = [
  { date: '2026-11-02', dayNum: 2, dow: '월', isToday: false, isFuture: false, doneCount: 2 },
  { date: '2026-11-03', dayNum: 3, dow: '화', isToday: false, isFuture: false, doneCount: 0 },
  { date: '2026-11-04', dayNum: 4, dow: '수', isToday: true, isFuture: false, doneCount: 1 },
  { date: '2026-11-05', dayNum: 5, dow: '목', isToday: false, isFuture: true, doneCount: 0 },
  { date: '2026-11-06', dayNum: 6, dow: '금', isToday: false, isFuture: true, doneCount: 0 },
  { date: '2026-11-07', dayNum: 7, dow: '토', isToday: false, isFuture: true, doneCount: 0 },
  { date: '2026-11-08', dayNum: 8, dow: '일', isToday: false, isFuture: true, doneCount: 0 },
]

const task = (over: Partial<Task> & Pick<Task, 'activityId' | 'domain' | 'name'>): Task => ({
  nature: '자유', targets: [], done: false, ...over,
})

const DAY_TASKS: readonly Task[] = [
  task({ activityId: 'en-book', domain: '영어', name: '영어 원서 1권', done: true }),
  task({ activityId: 'hangul', domain: '국어', name: '한글 숙제', done: false }),
]

const REPORT: readonly WeeklyReportRow[] = [
  { activityId: 'en-book', name: '영어 원서 1권', domain: '영어', cadence: { kind: '매일' }, done: 3, target: 7, streak: 2 },
  { activityId: 'board', name: '보드게임', domain: '수학', cadence: { kind: '주N회', times: 2 }, done: 1, target: 2 },
  { activityId: 'alpha', name: '알파짱', domain: '수학', cadence: { kind: '주N회', times: 3 }, done: 0, target: 3 },
  { activityId: 'hw', name: '한글 숙제', domain: '국어', cadence: { kind: '주N회', times: 1 }, done: 1, target: 1 },
]

const setup = (over: Partial<React.ComponentProps<typeof LogScreen>> = {}) => {
  const onSelectDay = vi.fn()
  const onToggleDay = vi.fn()
  const utils = render(
    <LogScreen
      weekDays={WEEK}
      selectedDate="2026-11-04"
      selectedLabel="11월 4일 수요일"
      selectedIsToday
      onSelectDay={onSelectDay}
      dayTasks={DAY_TASKS}
      onToggleDay={onToggleDay}
      report={REPORT}
      {...over}
    />,
  )
  return { ...utils, onSelectDay, onToggleDay }
}

describe('주간 스트립 (⑦) — 지난 날 선택', () => {
  it('한 주 7일이 보인다', () => {
    setup()
    for (const n of ['2', '3', '4', '5', '6', '7', '8']) {
      expect(screen.getByText(n)).toBeInTheDocument()
    }
  })

  it('지난 날을 누르면 onSelectDay 가 불린다', async () => {
    const { onSelectDay } = setup()
    await userEvent.click(screen.getByText('2')) // 월요일
    expect(onSelectDay).toHaveBeenCalledWith('2026-11-02')
  })

  it('⭐ 미래 날짜는 누를 수 없다 (비활성)', async () => {
    const { onSelectDay } = setup()
    const future = screen.getByText('5').closest('button')!
    expect(future).toBeDisabled()
    await userEvent.click(future).catch(() => {})
    expect(onSelectDay).not.toHaveBeenCalled()
  })
})

describe('선택한 날 기록 — 소급 체크 (⑦)', () => {
  it('그 날의 활동이 체크 상태로 보인다', () => {
    setup()
    expect(within(screen.getByTestId('logrow-en-book')).getByText('영어 원서 1권')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /영어 원서/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /한글 숙제/ })).not.toBeChecked()
  })

  it('체크하면 onToggleDay 가 불린다', async () => {
    const { onToggleDay } = setup()
    await userEvent.click(screen.getByRole('checkbox', { name: /한글 숙제/ }))
    expect(onToggleDay).toHaveBeenCalledWith('hangul')
  })

  it('오늘이 아니면 "지금 체크해도 기록돼요" 안내가 보인다', () => {
    setup({ selectedIsToday: false, selectedLabel: '11월 2일 월요일' })
    expect(screen.getByText(/지금 체크해도 기록돼요/)).toBeInTheDocument()
  })

  it('오늘이면 그 안내는 없다', () => {
    setup()
    expect(screen.queryByText(/지금 체크해도 기록돼요/)).not.toBeInTheDocument()
  })
})

describe('주간 리포트 (⑧) — 한 것을 센다, 긍정 프레이밍', () => {
  it('활동별 "이번 주 N일" 이 보인다', () => {
    setup()
    const row = screen.getByTestId('report-en-book')
    expect(within(row).getByText(/이번 주 3일/)).toBeInTheDocument()
  })

  it("'매일' 활동엔 streak 이 붙는다", () => {
    setup()
    expect(within(screen.getByTestId('report-en-book')).getByText(/2일째/)).toBeInTheDocument()
  })

  it('⭐ 결핍을 강조하지 않는다 — "달성"·점수·N/N·퍼센트 없음', () => {
    const { container } = setup()
    const text = container.textContent ?? ''
    expect(text).not.toContain('달성')
    expect(text).not.toContain('못한')
    expect(text).not.toMatch(/\d+\s*\/\s*\d+/)
    expect(text).not.toMatch(/\d+%/)
  })

  it('한 게 없는 활동은 "이번 주 기록 없음" (결핍 아닌 중립)', () => {
    setup()
    expect(within(screen.getByTestId('report-alpha')).getByText(/기록 없음/)).toBeInTheDocument()
  })

  it('⭐ INV-REPORT-03 — 주1회를 한 번 하면 막대가 꽉 찬다 (회귀 방지)', () => {
    setup()
    const fill = screen.getByTestId('report-hw').querySelector('.report__bar-fill')!
    expect(fill).toHaveAttribute('data-full', 'true')
  })

  it('아직 리듬 미달이면 막대가 안 찼다 (주3회 중 0회)', () => {
    setup()
    const fill = screen.getByTestId('report-alpha').querySelector('.report__bar-fill')!
    expect(fill).toHaveAttribute('data-full', 'false')
  })
})
