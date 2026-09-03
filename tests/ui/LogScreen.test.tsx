/**
 * LogScreen (F4) — UX 리디자인 §12 + 보강 Addendum 01.
 * 나이테 링 + 주간 목표 달성(pip) + 지난 날 backfill 진입. 한 것만 센다(C-6).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogScreen } from '../../src/boundary/ui/LogScreen'
import type { WeekDayVM, RecordRowVM } from '../../src/boundary/ui/LogScreen'

const WEEK: readonly WeekDayVM[] = [
  { date: '2026-08-31', dayNum: 31, dow: '월', isToday: false, isFuture: false, doneCount: 2 },
  { date: '2026-09-01', dayNum: 1, dow: '화', isToday: false, isFuture: false, doneCount: 1 },
  { date: '2026-09-02', dayNum: 2, dow: '수', isToday: false, isFuture: false, doneCount: 3 },
  { date: '2026-09-03', dayNum: 3, dow: '목', isToday: true, isFuture: false, doneCount: 0 },
  { date: '2026-09-04', dayNum: 4, dow: '금', isToday: false, isFuture: true, doneCount: 0 },
  { date: '2026-09-05', dayNum: 5, dow: '토', isToday: false, isFuture: true, doneCount: 0 },
  { date: '2026-09-06', dayNum: 6, dow: '일', isToday: false, isFuture: true, doneCount: 0 },
]

// §보강 A 예시
const ROWS: readonly RecordRowVM[] = [
  { activityId: 'facto', name: '팩토 숙제', domain: '수학', count: 2, target: 2, met: true },
  { activityId: 'hangul', name: '한글 학원 숙제', domain: '국어', count: 2, target: 3, met: false },
  { activityId: 'video', name: '영어 영상 20분', domain: '영어', count: 3, target: 5, met: false },
  { activityId: 'alpha', name: '알파짱 워크지', domain: '수학', count: 0, target: 0, met: false },
]

const setup = (over: Partial<React.ComponentProps<typeof LogScreen>> = {}) => {
  const onDayClick = vi.fn()
  const utils = render(<LogScreen pct={0.62} weekDoneDays={3} weekDays={WEEK} rows={ROWS} onDayClick={onDayClick} {...over} />)
  return { ...utils, onDayClick }
}

describe('나이테 링 히어로', () => {
  it('제목과 채움률 캡션', () => {
    setup()
    expect(screen.getByText('한 겹씩 쌓이는 중')).toBeInTheDocument()
    expect(screen.getByText(/62% 채움/)).toBeInTheDocument()
  })
})

describe('⭐ 주간 목표 달성 표시 (보강 A · 회귀 방지)', () => {
  it('목표를 채우면 "완료"로 보인다', () => {
    setup()
    expect(within(screen.getByTestId('rec-facto')).getByText('완료')).toBeInTheDocument()
  })

  it('진행 중이면 "N/M회"', () => {
    setup()
    expect(within(screen.getByTestId('rec-hangul')).getByText('2/3회')).toBeInTheDocument()
    expect(within(screen.getByTestId('rec-video')).getByText('3/5회')).toBeInTheDocument()
  })

  it('한 게 없으면 "이번 주 없음"', () => {
    setup()
    expect(within(screen.getByTestId('rec-alpha')).getByText('이번 주 없음')).toBeInTheDocument()
  })

  it('pip 행 — 목표 칸 수만큼, 완료한 만큼만 채운다', () => {
    setup()
    const pips = screen.getByTestId('rec-hangul').querySelectorAll('.rec-pips i')
    expect(pips).toHaveLength(3) // target 3
    expect(screen.getByTestId('rec-hangul').querySelectorAll('.rec-pips i.on')).toHaveLength(2) // done 2
  })

  it('⭐ 미완 pip 은 허니(갭색)가 아니다 — 주간 미완은 갭이 아님', () => {
    setup()
    // 미완 칸은 중립(.on 아님). 허니 전용 클래스(.gap)를 쓰지 않는다.
    expect(screen.getByTestId('rec-hangul').querySelectorAll('.rec-pips i.gap')).toHaveLength(0)
  })

  it('자유 활동(target 0)엔 pip 행이 없다', () => {
    setup()
    expect(screen.getByTestId('rec-alpha').querySelector('.rec-pips')).toBeNull()
  })

  it('⭐ 결핍·성적표 어휘가 없다', () => {
    const { container } = setup()
    const text = container.textContent ?? ''
    for (const bad of ['달성', '못한', '밀림', '미완료', '미달', '부족', '실패', '성공', '클리어']) {
      expect(text).not.toContain(bad)
    }
  })
})

describe('⭐ 지난 날 backfill 진입 (보강 B · 회귀 방지)', () => {
  it('이번 주 7일이 버튼으로 있다', () => {
    setup()
    expect(WEEK.every((d) => screen.getByTestId(`wd-${d.date}`))).toBe(true)
  })

  it('지난 날을 누르면 onDayClick(date) 가 불린다', async () => {
    const { onDayClick } = setup()
    await userEvent.click(screen.getByTestId('wd-2026-08-31'))
    expect(onDayClick).toHaveBeenCalledWith('2026-08-31')
  })

  it('오늘도 누를 수 있다', async () => {
    const { onDayClick } = setup()
    await userEvent.click(screen.getByTestId('wd-2026-09-03'))
    expect(onDayClick).toHaveBeenCalledWith('2026-09-03')
  })

  it('⭐ 미래 날짜는 비활성', () => {
    setup()
    expect(screen.getByTestId('wd-2026-09-04')).toBeDisabled()
  })

  it('안내 카피가 못 채운 날을 실패로 규정하지 않는다', () => {
    setup()
    expect(screen.getByText(/그냥 비어 있을 뿐이에요/)).toBeInTheDocument()
  })
})
