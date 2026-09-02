/**
 * ARRR 사이클 #10 — RED (Boundary 트랙)
 * 대상: src/boundary/ui/TodayScreen.tsx  (F1)
 * 계약: docs/08-UI계약.md §2
 *
 * 제1원칙: UI 는 판단하지 않는다. shouldWarnOnMiss() 의 결과를 따를 뿐이다.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TodayScreen } from '../../src/boundary/ui/TodayScreen'
import type { Task } from '../../src/domain/types'

const task = (over: Partial<Task> & Pick<Task, 'activityId' | 'domain' | 'nature'>): Task => ({
  name: over.name ?? '활동',
  targets: [],
  done: false,
  ...over,
})

const TASKS: readonly Task[] = [
  task({
    activityId: 'hw-hangul', domain: '국어', name: '한글 학원 숙제', nature: '필수',
    targets: [{ standardId: 'int-ko-letter-sounds', statement: '자음·모음의 소릿값을 안다', provenance: { kind: '공교육', doc: '성취기준' } }],
  }),
  task({
    activityId: 'hw-facto', domain: '수학', name: '팩토 숙제', nature: '필수', done: true,
    targets: [{ standardId: 'int-ma-count-20', statement: '20까지 세고 숫자를 읽는다', provenance: { kind: '공교육', doc: '성취기준' } }],
  }),
  task({
    activityId: 'board', domain: '수학', name: '수학 보드게임', nature: '필수',
    weeklyProgress: { done: 2, times: 3, met: false },
    targets: [{ standardId: 'int-ma-pattern', statement: '반복 규칙을 이어간다', provenance: { kind: '공교육', doc: '누리과정' } }],
  }),
  task({
    activityId: 'en-book', domain: '영어', name: '영어 원서 1권', nature: '자체목표',
    targets: [{ standardId: 'own-en-listen', statement: '영어 그림책 한 권을 끝까지 듣는다', provenance: { kind: '자체' } }],
  }),
  task({ activityId: 'alpha', domain: '수학', name: '알파짱 워크지', nature: '자유' }),
]

const setup = (tasks: readonly Task[] = TASKS, onToggle = vi.fn()) => {
  const utils = render(<TodayScreen date="2026-11-04" tasks={tasks} onToggle={onToggle} />)
  return { ...utils, onToggle }
}

describe('학원 일정 스트립 (INV-ACAD-03) — 체크 없이 정보로만', () => {
  const withSchedule = (schedule: readonly { name: string; time?: string }[]) =>
    render(<TodayScreen date="2026-11-04" tasks={TASKS} onToggle={vi.fn()} schedule={schedule} />)

  it('오늘 등원 학원이 이름·시간으로 보인다', () => {
    withSchedule([{ name: '아이마음아트', time: '14:30' }])
    const strip = screen.getByTestId('schedule')
    expect(within(strip).getByText(/아이마음아트/)).toBeInTheDocument()
    expect(within(strip).getByText(/14:30/)).toBeInTheDocument()
  })

  it('⭐ 학원 일정에는 체크박스가 없다', () => {
    withSchedule([{ name: '아이마음아트', time: '14:30' }])
    const strip = screen.getByTestId('schedule')
    expect(within(strip).queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('오늘 등원이 없으면 스트립이 안 뜬다', () => {
    withSchedule([])
    expect(screen.queryByTestId('schedule')).not.toBeInTheDocument()
  })

  it('schedule 을 안 주면 스트립이 없다', () => {
    setup()
    expect(screen.queryByTestId('schedule')).not.toBeInTheDocument()
  })
})

describe('INV-UI-04 — 영역별로 그룹핑해 보여준다', () => {
  it('영역 제목이 렌더된다', () => {
    setup()
    for (const d of ['국어', '수학', '영어']) {
      expect(screen.getByRole('heading', { name: d })).toBeInTheDocument()
    }
  })

  it('활동이 자기 영역 그룹 안에 있다', () => {
    setup()
    const 수학 = screen.getByRole('region', { name: '수학' })
    expect(within(수학).getByText('팩토 숙제')).toBeInTheDocument()
    expect(within(수학).queryByText('한글 학원 숙제')).not.toBeInTheDocument()
  })
})

describe('INV-UI-05 — 오늘 할 일이 없는 영역은 표시하지 않는다', () => {
  it('⭐ 빈 제목이 화면을 밀어내지 않는다', () => {
    setup()
    // 시드 영역 7개 중 할 일이 있는 건 3개뿐이다
    expect(screen.queryByRole('heading', { name: '과학·탐구' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '건강·안전' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('region')).toHaveLength(3)
  })

  it('할 일이 하나도 없으면 영역이 하나도 안 뜬다', () => {
    setup([])
    expect(screen.queryAllByRole('region')).toHaveLength(0)
  })
})

describe('INV-UI-06 / 07 — 탭 1회로 기록. 다이얼로그도 추가 입력도 없다', () => {
  it('⭐ 체크 클릭 1회로 onToggle 이 불린다', async () => {
    const { onToggle } = setup()
    await userEvent.click(screen.getByRole('checkbox', { name: /한글 학원 숙제/ }))
    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onToggle).toHaveBeenCalledWith('hw-hangul')
  })

  it('⭐ 확인 다이얼로그가 뜨지 않는다', async () => {
    setup()
    await userEvent.click(screen.getByRole('checkbox', { name: /한글 학원 숙제/ }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('⭐ 메모 입력 필드가 나타나지 않는다 (INV-COMP-04)', async () => {
    setup()
    await userEvent.click(screen.getByRole('checkbox', { name: /한글 학원 숙제/ }))
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('완료된 항목은 checked 상태다', () => {
    setup()
    expect(screen.getByRole('checkbox', { name: /팩토 숙제/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /한글 학원 숙제/ })).not.toBeChecked()
  })
})

describe('INV-UI-11 / 12 — C-6: 경고는 적기에만', () => {
  it('⭐ 적기 미완료에만 경고 표시가 붙는다', () => {
    setup()
    const 한글 = screen.getByTestId('task-hw-hangul')
    expect(한글).toHaveAttribute('data-warn', 'true')
  })

  it('⭐ 자체목표 미완료는 중립이다 — "어제 영상 빼먹음"은 기준 위반이 아니다', () => {
    setup()
    expect(screen.getByTestId('task-en-book')).toHaveAttribute('data-warn', 'false')
  })

  it('⭐ 추가 미완료도 중립이다', () => {
    setup()
    expect(screen.getByTestId('task-alpha')).toHaveAttribute('data-warn', 'false')
  })

  it('완료된 적기 항목에는 경고가 없다', () => {
    setup()
    expect(screen.getByTestId('task-hw-facto')).toHaveAttribute('data-warn', 'false')
  })

  it('경고 대상은 미완료 적기뿐이다', () => {
    setup()
    const warned = TASKS.filter(
      (t) => screen.getByTestId(`task-${t.activityId}`).getAttribute('data-warn') === 'true',
    )
    expect(warned.map((t) => t.activityId)).toEqual(['hw-hangul', 'board'])
  })
})

describe('INV-UI-13 — 미완료를 집계해 보여주지 않는다', () => {
  it('⭐ "3개 밀렸음" 같은 카운터가 없다', () => {
    const { container } = setup()
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/\d+\s*개\s*(남음|밀림|미완료)/)
    expect(text).not.toMatch(/\d+\s*\/\s*\d+\s*완료/)
    expect(text).not.toMatch(/\d+%/)
  })
})

describe('INV-UI-09 — 주N회는 주간 진행을 함께 보여준다', () => {
  it('2/3 이 표시된다', () => {
    setup()
    expect(within(screen.getByTestId('task-board')).getByText(/2\s*\/\s*3/)).toBeInTheDocument()
  })

  it('매일 활동에는 진행 표시가 없다', () => {
    setup()
    expect(within(screen.getByTestId('task-hw-hangul')).queryByText(/\/\s*\d/)).not.toBeInTheDocument()
  })
})

describe('INV-UI-35 — 주간 목표를 채우면 기분 좋게 알려준다', () => {
  const 완료한주간 = [
    task({
      activityId: 'done-week', domain: '수학', name: '팩토 숙제', nature: '필수',
      weeklyProgress: { done: 1, times: 1, met: true },
    }),
  ]

  it('⭐ "이번 주 완료" 배지가 뜬다', () => {
    setup(완료한주간)
    expect(within(screen.getByTestId('task-done-week')).getByText(/이번 주 완료/)).toBeInTheDocument()
  })

  it('⭐ 진행 숫자(1/1)는 사라진다 — 다 했으면 숫자는 볼 일이 없다', () => {
    setup(완료한주간)
    expect(
      within(screen.getByTestId('task-done-week')).queryByText(/\d\s*\/\s*\d/),
    ).not.toBeInTheDocument()
  })

  it('INV-UI-13 — 그래도 "1/1 완료" 같은 집계 문자열은 만들지 않는다', () => {
    const { container } = setup(완료한주간)
    expect(container.textContent ?? '').not.toMatch(/\d+\s*\/\s*\d+\s*완료/)
  })

  it('경고 대상이 아니다 — 이번 주 할 일은 끝났다', () => {
    setup(완료한주간)
    expect(screen.getByTestId('task-done-week')).toHaveAttribute('data-warn', 'false')
    expect(screen.getByTestId('task-done-week')).toHaveAttribute('data-week-met', 'true')
  })

  it('⭐ INV-UI-36 — 주간 목표를 채워도 체크박스는 남는다 (되돌릴 수 있어야 한다)', () => {
    // 실수로 체크했을 때 되돌릴 길이 없으면 안 된다.
    // 배지는 "이번 주", 체크박스는 "오늘" — 층위가 다르므로 공존한다.
    setup(완료한주간)
    expect(within(screen.getByTestId('task-done-week')).getByRole('checkbox')).toBeInTheDocument()
  })

  it('⭐ 오늘 체크해서 채운 경우 해제할 수 있다', async () => {
    const onToggle = vi.fn()
    const 오늘채움 = [
      task({
        activityId: 'today-met', domain: '수학', name: '팩토 숙제', nature: '필수',
        done: true,
        weeklyProgress: { done: 1, times: 1, met: true },
      }),
    ]
    setup(오늘채움, onToggle)
    const box = within(screen.getByTestId('task-today-met')).getByRole('checkbox')
    expect(box).toBeChecked()
    await userEvent.click(box)
    expect(onToggle).toHaveBeenCalledWith('today-met')
  })

  it('미달 상태에서도 당연히 체크박스가 있다', () => {
    setup()
    expect(within(screen.getByTestId('task-board')).getByRole('checkbox')).toBeInTheDocument()
  })

  it('미달 상태에서는 배지가 없다', () => {
    setup()
    expect(within(screen.getByTestId('task-board')).queryByText(/이번 주 완료/)).not.toBeInTheDocument()
  })
})

describe('INV-UI-29 — 색만으로 정보를 전달하지 않는다 (출처 라벨)', () => {
  it('각 항목에 출처 라벨 텍스트가 있다', () => {
    setup()
    expect(within(screen.getByTestId('task-hw-hangul')).getByText('공교육·성취기준')).toBeInTheDocument()
    expect(within(screen.getByTestId('task-en-book')).getByText('자체 목표')).toBeInTheDocument()
    expect(within(screen.getByTestId('task-alpha')).getByText('자유')).toBeInTheDocument()
  })
})

describe('⭐ 활동↔목표 연결·출처 (피드백 ③④)', () => {
  it('연결된 목표 문장이 활동 아래 보인다', () => {
    setup()
    expect(within(screen.getByTestId('task-hw-hangul')).getByText(/자음·모음의 소릿값을 안다/)).toBeInTheDocument()
  })

  it('공교육 출처 배지가 보인다', () => {
    setup()
    expect(within(screen.getByTestId('task-board')).getByText('공교육·누리과정')).toBeInTheDocument()
  })

  it('목표가 없는 활동은 "겨냥 목표 없음"', () => {
    setup()
    expect(within(screen.getByTestId('task-alpha')).getByText(/겨냥 목표 없음/)).toBeInTheDocument()
  })

  it('⭐ 여러 목표면 대표 + "외 N개"만 보이고, 펼치면 전체가 보인다', async () => {
    const multi = [
      task({
        activityId: 'multi', domain: '국어', nature: '필수',
        targets: [
          { standardId: 'a', statement: '첫째 목표', provenance: { kind: '공교육', doc: '누리과정' } },
          { standardId: 'b', statement: '둘째 목표', provenance: { kind: '공교육', doc: '성취기준' } },
          { standardId: 'c', statement: '셋째 목표', provenance: { kind: '자체' } },
        ],
      }),
    ]
    setup(multi)
    const row = screen.getByTestId('task-multi')
    expect(within(row).getByText(/첫째 목표/)).toBeInTheDocument()
    expect(within(row).getByText(/외 2개/)).toBeInTheDocument()
    // 접힌 상태: 나머지는 숨겨져 있다
    expect(within(row).queryByText('둘째 목표')).not.toBeInTheDocument()
    // 요약 줄을 탭하면 전체가 펼쳐진다
    await userEvent.click(within(row).getByRole('button', { name: /첫째 목표/ }))
    expect(within(row).getByText('둘째 목표')).toBeInTheDocument()
    expect(within(row).getByText('셋째 목표')).toBeInTheDocument()
  })
})

describe('날짜 표시', () => {
  it('오늘 날짜가 보인다', () => {
    setup()
    expect(screen.getByText(/11월\s*4일/)).toBeInTheDocument()
  })
})
