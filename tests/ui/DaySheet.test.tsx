/**
 * DaySheet (지난 날 backfill 바텀시트) — UX 리디자인 보강 §B.
 * 그 날짜의 활동 체크시트. 토글 = 그 날짜 Record 추가/삭제. 활동 연결 시트와 동일 패턴.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DaySheet } from '../../src/boundary/ui/DaySheet'
import type { TaskVM } from '../../src/boundary/ui/vm'

const TASKS: readonly TaskVM[] = [
  { activityId: 'en-book', name: '영어 원서 1권', domain: '영어', badgeCls: 'own', badgeLabel: '자체 목표', aim: '영어 그림책 한 권을 끝까지 듣는다', done: true },
  { activityId: 'hangul', name: '한글 학원 숙제', domain: '국어', badgeCls: 'gov', badgeLabel: '공교육·누리과정', aim: '아는 글자를 찾아낸다', done: false },
]

const setup = (over: Partial<React.ComponentProps<typeof DaySheet>> = {}) => {
  const onToggle = vi.fn(); const onClose = vi.fn()
  render(<DaySheet dateLabel="8월 31일 월요일" isToday={false} tasks={TASKS} onToggle={onToggle} onClose={onClose} {...over} />)
  return { onToggle, onClose }
}

describe('그 날 체크시트', () => {
  it('날짜와 활동들이 보인다', () => {
    setup()
    expect(screen.getByText(/8월 31일/)).toBeInTheDocument()
    expect(screen.getByText('영어 원서 1권')).toBeInTheDocument()
    expect(screen.getByText('한글 학원 숙제')).toBeInTheDocument()
  })

  it('그 날 한 활동은 눌린 상태(aria-pressed)', () => {
    setup()
    expect(screen.getByTestId('day-task-en-book')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('day-task-hangul')).toHaveAttribute('aria-pressed', 'false')
  })

  it('⭐ 활동을 누르면 onToggle(activityId)', async () => {
    const { onToggle } = setup()
    await userEvent.click(screen.getByTestId('day-task-hangul'))
    expect(onToggle).toHaveBeenCalledWith('hangul')
  })

  it('배경/✕ 로 닫는다', async () => {
    const { onClose } = setup()
    await userEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('안내 카피가 지난 날 채움을 허용한다', () => {
    setup()
    expect(screen.getByText(/지난 날도 채울 수 있어요/)).toBeInTheDocument()
  })

  it('오늘이면 제목에 · 오늘 이 붙는다', () => {
    setup({ isToday: true })
    expect(screen.getByText(/· 오늘/)).toBeInTheDocument()
  })

  it('그 날 예정된 활동이 없으면 안내', () => {
    setup({ tasks: [] })
    expect(screen.getByText(/예정된 활동이 없어요/)).toBeInTheDocument()
  })
})
