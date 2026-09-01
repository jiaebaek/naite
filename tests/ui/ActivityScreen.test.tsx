/**
 * ARRR 사이클 #15 — RED (Boundary)
 * 대상: src/boundary/ui/ActivityScreen.tsx  (F2)
 * 계약: docs/08-UI계약.md §4
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActivityScreen } from '../../src/boundary/ui/ActivityScreen'
import { DomainError } from '../../src/domain/errors'
import type { Activity, ActivityInput, Standard } from '../../src/domain/types'

const 국어목표: Standard = {
  id: 'int-ko',
  domain: '국어',
  baselinePeriod: { start: '2026-08', end: '2027-02' },
  statement: '받침 없는 단어를 소리 내어 읽는다',
  source: { document: '04' },
  origin: '해석',
}
const 국어목표2: Standard = { ...국어목표, id: 'int-ko2', statement: '자기 이름을 쓴다' }
const 수학목표: Standard = { ...국어목표, id: 'int-ma', domain: '수학' }
const 공교육: Standard = {
  ...국어목표, id: 'std-ko', origin: '공교육',
  source: { document: '별책5', code: '2국02-01' },
}
const STANDARDS = [국어목표, 국어목표2, 수학목표, 공교육]

const act = (over: Partial<Activity> & Pick<Activity, 'id' | 'name' | 'domain'>): Activity => ({
  track: '집', targetIds: [], cadence: { kind: '매일' }, owner: '엄마', active: true, ...over,
})

const ACTIVITIES = [
  act({ id: 'a1', name: '한글 학원 숙제', domain: '국어', targetIds: ['int-ko'], owner: '아빠', academyId: 'ac1' }),
  act({ id: 'a2', name: '영어 원서', domain: '영어' }),
]

const ACADEMIES = [
  { id: 'ac1', name: '더하다', weekdays: [1] as const, time: '14:30', active: true },
  { id: 'ac2', name: '유아체육', weekdays: [0] as const, active: true },
]

const setup = (
  activities: readonly Activity[] = ACTIVITIES,
  handlers: {
    onCreate?: (i: ActivityInput) => void
    onDeactivate?: (id: string) => void
    onRetarget?: (id: string, targetIds: readonly string[]) => void
    onRename?: (id: string, name: string) => void
    onReschedule?: (id: string, cadence: unknown) => void
    onSetOwner?: (id: string, owner: string) => void
    onCreateAcademy?: (i: unknown) => void
  } = {},
  achieved: readonly string[] = [],
) => {
  const onCreate = handlers.onCreate ?? vi.fn()
  const onDeactivate = handlers.onDeactivate ?? vi.fn()
  const onRetarget = handlers.onRetarget ?? vi.fn()
  const onRename = handlers.onRename ?? vi.fn()
  const onReschedule = handlers.onReschedule ?? vi.fn()
  const onSetOwner = handlers.onSetOwner ?? vi.fn()
  const onCreateAcademy = handlers.onCreateAcademy ?? vi.fn()
  const utils = render(
    <ActivityScreen
      activities={activities}
      standards={STANDARDS}
      achieved={achieved}
      onCreate={onCreate}
      onDeactivate={onDeactivate}
      onRetarget={onRetarget}
      onRename={onRename}
      onReschedule={onReschedule}
      onSetOwner={onSetOwner}
      academies={ACADEMIES}
      onCreateAcademy={onCreateAcademy}
      onRenameAcademy={vi.fn()}
      onRescheduleAcademy={vi.fn()}
      onDeactivateAcademy={vi.fn()}
      onSetAcademyCovers={vi.fn()}
    />,
  )
  return { ...utils, onCreate, onDeactivate, onRetarget, onRename, onReschedule, onSetOwner, onCreateAcademy }
}

describe('활동 목록', () => {
  it('등록된 활동이 보인다', () => {
    setup()
    expect(screen.getByText('한글 학원 숙제')).toBeInTheDocument()
    expect(screen.getByText('영어 원서')).toBeInTheDocument()
  })

  it('파생 nature 가 표시된다 (필수/자체목표/자유)', () => {
    setup()
    const row = screen.getByTestId('activity-a1')
    expect(within(row).getByText('필수')).toBeInTheDocument() // 해석 목표 겨냥
    const row2 = screen.getByTestId('activity-a2')
    expect(within(row2).getByText('자유')).toBeInTheDocument() // 목표 없음
  })
})

describe('INV-UI-27 — 삭제가 아니라 끄기(비활성화)', () => {
  it('끄기 버튼이 있다', () => {
    setup()
    expect(within(screen.getByTestId('activity-a1')).getByRole('button', { name: /끄기/ })).toBeInTheDocument()
  })

  it('⭐ 하드 삭제 버튼은 없다 — 지난 기록이 고아가 된다', () => {
    setup()
    expect(screen.queryByRole('button', { name: /삭제|지우기|delete/i })).not.toBeInTheDocument()
  })

  it('끄기를 누르면 onDeactivate 가 불린다', async () => {
    const { onDeactivate } = setup()
    await userEvent.click(within(screen.getByTestId('activity-a1')).getByRole('button', { name: /끄기/ }))
    expect(onDeactivate).toHaveBeenCalledWith('a1')
  })

  it('비활성 활동은 목록에 흐리게/구분되어 나온다', () => {
    const withInactive = [...ACTIVITIES, act({ id: 'a3', name: '옛 활동', domain: '수학', active: false })]
    setup(withInactive)
    expect(screen.getByTestId('activity-a3')).toHaveAttribute('data-active', 'false')
  })
})

describe('INV-UI-23 — 새 활동 폼: 이름·영역·주기', () => {
  const openForm = async () => {
    await userEvent.click(screen.getByRole('button', { name: /새 활동/ }))
  }

  it('이름·영역·주기 입력이 있다', async () => {
    setup()
    await openForm()
    expect(screen.getByLabelText(/이름/)).toBeInTheDocument()
    expect(screen.getByLabelText(/영역/)).toBeInTheDocument()
    expect(screen.getByLabelText(/주기/)).toBeInTheDocument()
  })

  it('이름·영역·주기만으로 활동을 만든다', async () => {
    const onCreate = vi.fn()
    setup(ACTIVITIES, { onCreate })
    await openForm()
    await userEvent.type(screen.getByLabelText(/이름/), '수학 보드게임')
    await userEvent.selectOptions(screen.getByLabelText(/영역/), '수학')
    await userEvent.click(screen.getByRole('button', { name: /저장/ }))
    expect(onCreate).toHaveBeenCalledTimes(1)
    const input = onCreate.mock.calls[0]![0]
    expect(input.name).toBe('수학 보드게임')
    expect(input.domain).toBe('수학')
    expect(input.cadence).toEqual({ kind: '매일' })
  })

  it('주N회를 고르면 횟수 입력이 나온다', async () => {
    setup()
    await openForm()
    await userEvent.selectOptions(screen.getByLabelText(/주기/), '주N회')
    expect(screen.getByLabelText(/횟수/)).toBeInTheDocument()
  })

  it('⭐ 빈 이름으로 저장하면 도메인 에러 메시지가 뜬다', async () => {
    const onCreate = vi.fn(() => {
      throw new DomainError('E-ACT-EMPTY-NAME', '활동 이름을 입력해 주세요')
    })
    setup(ACTIVITIES, { onCreate })
    await openForm()
    await userEvent.selectOptions(screen.getByLabelText(/영역/), '수학')
    await userEvent.click(screen.getByRole('button', { name: /저장/ }))
    expect(screen.getByRole('alert')).toHaveTextContent(/이름을 입력/)
  })
})

describe('INV-UI-24 — nature 를 고르는 입력이 없다', () => {
  it('성격/nature 선택 컨트롤이 없다', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /새 활동/ }))
    expect(screen.queryByLabelText(/성격|nature/i)).not.toBeInTheDocument()
    // 필수/자체목표/자유를 고르는 라디오·셀렉트가 없어야 한다
    expect(screen.queryByRole('radio', { name: /필수|자체목표|자유/ })).not.toBeInTheDocument()
  })
})

describe('INV-UI-25 — 겨냥할 목표는 칩에서 탭, 생략 가능', () => {
  it('영역을 고르면 그 영역 목표가 칩으로 나온다', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /새 활동/ }))
    await userEvent.selectOptions(screen.getByLabelText(/영역/), '국어')
    expect(screen.getByRole('button', { name: /받침 없는 단어/ })).toBeInTheDocument()
  })

  it('⭐ 공교육 원문은 겨냥 칩으로 나오지 않는다 (근거지 목표가 아니다)', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /새 활동/ }))
    await userEvent.selectOptions(screen.getByLabelText(/영역/), '국어')
    const ids = screen.getAllByTestId(/^target-chip-/).map((c) => c.getAttribute('data-target'))
    expect(ids).toContain('int-ko') // 해석은 나온다
    expect(ids).not.toContain('std-ko') // 공교육은 제외
  })

  it('목표를 안 골라도 저장된다 (생략 가능)', async () => {
    const onCreate = vi.fn()
    setup(ACTIVITIES, { onCreate })
    await userEvent.click(screen.getByRole('button', { name: /새 활동/ }))
    await userEvent.type(screen.getByLabelText(/이름/), '알파짱 워크지')
    await userEvent.selectOptions(screen.getByLabelText(/영역/), '수학')
    await userEvent.click(screen.getByRole('button', { name: /저장/ }))
    expect(onCreate.mock.calls[0]![0].targetIds).toEqual([])
  })

  it('목표 칩을 누르면 targetIds 에 담긴다', async () => {
    const onCreate = vi.fn()
    setup(ACTIVITIES, { onCreate })
    await userEvent.click(screen.getByRole('button', { name: /새 활동/ }))
    await userEvent.type(screen.getByLabelText(/이름/), '받침 연습')
    await userEvent.selectOptions(screen.getByLabelText(/영역/), '국어')
    await userEvent.click(screen.getByRole('button', { name: /받침 없는 단어/ }))
    await userEvent.click(screen.getByRole('button', { name: /저장/ }))
    expect(onCreate.mock.calls[0]![0].targetIds).toEqual(['int-ko'])
  })
})

describe('⭐ 겨냥 목표 확인 — 이 활동이 뭘 겨냥하는지 보인다', () => {
  it('목표를 겨냥한 활동은 그 목표 문장이 보인다', () => {
    setup()
    const row = screen.getByTestId('activity-a1')
    expect(within(row).getByText(/받침 없는 단어/)).toBeInTheDocument()
  })

  it('목표가 없는 활동은 "겨냥 목표 없음"이 보인다', () => {
    setup()
    const row = screen.getByTestId('activity-a2') // 영어 원서, targetIds []
    expect(within(row).getByText(/겨냥 목표 없음/)).toBeInTheDocument()
  })
})

describe('⭐ 활동 편집 — 이름·주기·목표를 바꾼다', () => {
  const openEdit = async (testid: string) => {
    await userEvent.click(within(screen.getByTestId(testid)).getByRole('button', { name: /편집/ }))
  }

  it('편집 버튼이 있다', () => {
    setup()
    expect(within(screen.getByTestId('activity-a1')).getByRole('button', { name: /편집/ })).toBeInTheDocument()
  })

  it('편집을 열면 현재 이름·주기·목표가 채워져 있다', async () => {
    setup()
    await openEdit('activity-a1')
    const row = screen.getByTestId('activity-a1')
    expect(within(row).getByLabelText(/이름/)).toHaveValue('한글 학원 숙제')
    expect(within(row).getByRole('button', { name: /받침 없는 단어/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('⭐ 이름을 바꿔 저장하면 onRename 이 불린다', async () => {
    const onRename = vi.fn()
    setup(ACTIVITIES, { onRename })
    await openEdit('activity-a1')
    const row = screen.getByTestId('activity-a1')
    const nameInput = within(row).getByLabelText(/이름/)
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, '한글 숙제(수정)')
    await userEvent.click(within(row).getByRole('button', { name: /저장/ }))
    expect(onRename).toHaveBeenCalledWith('a1', '한글 숙제(수정)')
  })

  it('⭐ 주기를 바꿔 저장하면 onReschedule 이 불린다', async () => {
    const onReschedule = vi.fn()
    setup(ACTIVITIES, { onReschedule })
    await openEdit('activity-a1')
    const row = screen.getByTestId('activity-a1')
    await userEvent.selectOptions(within(row).getByLabelText(/주기/), '주N회')
    await userEvent.click(within(row).getByRole('button', { name: /저장/ }))
    expect(onReschedule).toHaveBeenCalledWith('a1', { kind: '주N회', times: expect.any(Number) })
  })

  it('⭐ 담당을 바꿔 저장하면 onSetOwner 가 불린다', async () => {
    const onSetOwner = vi.fn()
    setup(ACTIVITIES, { onSetOwner }) // a1 owner=아빠
    const row = screen.getByTestId('activity-a1')
    await openEdit('activity-a1')
    await userEvent.click(within(row).getByRole('button', { name: '엄마' }))
    await userEvent.click(within(row).getByRole('button', { name: /저장/ }))
    expect(onSetOwner).toHaveBeenCalledWith('a1', '엄마')
  })

  it('편집 폼에 현재 담당이 선택되어 있다', async () => {
    setup() // a1 owner=아빠
    await openEdit('activity-a1')
    const row = screen.getByTestId('activity-a1')
    expect(within(row).getByRole('button', { name: '아빠' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('⭐ 목표를 바꿔 저장하면 onRetarget 이 불린다', async () => {
    const onRetarget = vi.fn()
    setup(ACTIVITIES, { onRetarget })
    const row = screen.getByTestId('activity-a1')
    await openEdit('activity-a1')
    await userEvent.click(within(row).getByRole('button', { name: /받침 없는 단어/ })) // 해제
    await userEvent.click(within(row).getByRole('button', { name: /저장/ }))
    expect(onRetarget).toHaveBeenCalledWith('a1', [])
  })

  it('바꾸지 않은 항목의 핸들러는 불리지 않는다 (이름만 바꿈)', async () => {
    const onRename = vi.fn(); const onReschedule = vi.fn(); const onRetarget = vi.fn()
    setup(ACTIVITIES, { onRename, onReschedule, onRetarget })
    const row = screen.getByTestId('activity-a1')
    await openEdit('activity-a1')
    const nameInput = within(row).getByLabelText(/이름/)
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, '바뀐 이름')
    await userEvent.click(within(row).getByRole('button', { name: /저장/ }))
    expect(onRename).toHaveBeenCalled()
    expect(onReschedule).not.toHaveBeenCalled()
    expect(onRetarget).not.toHaveBeenCalled()
  })

  it('⭐ 편집 칩에도 공교육 원문은 나오지 않는다', async () => {
    setup()
    await openEdit('activity-a1')
    const ids = within(screen.getByTestId('activity-a1')).getAllByTestId(/^edit-chip-/)
      .map((c) => c.getAttribute('data-target'))
    expect(ids).toContain('int-ko')
    expect(ids).not.toContain('std-ko') // 공교육 제외
  })

  it('목표 없는 활동에 목표를 붙일 수 있다', async () => {
    const onRetarget = vi.fn()
    const 국어무목표 = [act({ id: 'a9', name: '받침 놀이', domain: '국어' })]
    setup(국어무목표, { onRetarget })
    const row = screen.getByTestId('activity-a9')
    await openEdit('activity-a9')
    await userEvent.click(within(row).getByRole('button', { name: /받침 없는 단어/ }))
    await userEvent.click(within(row).getByRole('button', { name: /저장/ }))
    expect(onRetarget).toHaveBeenCalledWith('a9', ['int-ko'])
  })
})

describe('⭐ INV-UI-25b — 이미 달성한 목표는 겨냥 칩에서 뺀다', () => {
  it('새 활동 폼: 달성한 목표는 칩에 안 나온다', async () => {
    // 국어 목표 2개(int-ko, int-ko2) 중 int-ko 를 이미 달성
    setup(ACTIVITIES, {}, ['int-ko'])
    await userEvent.click(screen.getByRole('button', { name: /새 활동/ }))
    await userEvent.selectOptions(screen.getByLabelText(/영역/), '국어')
    const chips = screen.getAllByTestId(/^target-chip-/)
    const ids = chips.map((c) => c.getAttribute('data-target'))
    expect(ids).toContain('int-ko2')
    expect(ids).not.toContain('int-ko') // 달성한 건 제외
  })

  it('달성한 게 없으면 다 나온다', async () => {
    setup(ACTIVITIES, {}, [])
    await userEvent.click(screen.getByRole('button', { name: /새 활동/ }))
    await userEvent.selectOptions(screen.getByLabelText(/영역/), '국어')
    const ids = screen.getAllByTestId(/^target-chip-/).map((c) => c.getAttribute('data-target'))
    expect(ids).toEqual(expect.arrayContaining(['int-ko', 'int-ko2']))
  })

  it('⭐ 편집: 이미 겨냥하던 목표는 달성했어도 남긴다 (빼면 편집 시 사라져버린다)', async () => {
    // a1 은 int-ko 를 겨냥 중. int-ko 를 달성했어도 편집 칩엔 남아야 한다.
    setup(ACTIVITIES, {}, ['int-ko'])
    const row = screen.getByTestId('activity-a1')
    await userEvent.click(within(row).getByRole('button', { name: /편집/ }))
    const ids = within(row).getAllByTestId(/^edit-chip-/).map((c) => c.getAttribute('data-target'))
    expect(ids).toContain('int-ko') // 겨냥 중이라 남는다
  })

  it('편집: 겨냥 안 하던 달성 목표는 칩에서 뺀다', async () => {
    // a1 은 int-ko 만 겨냥. int-ko2 를 달성 → 편집 칩에서 제외
    setup(ACTIVITIES, {}, ['int-ko2'])
    const row = screen.getByTestId('activity-a1')
    await userEvent.click(within(row).getByRole('button', { name: /편집/ }))
    const ids = within(row).getAllByTestId(/^edit-chip-/).map((c) => c.getAttribute('data-target'))
    expect(ids).toContain('int-ko') // 겨냥 중
    expect(ids).not.toContain('int-ko2') // 달성 + 겨냥 안 함 → 제외
  })
})

describe('⭐ 학원 (Academy) — 활동과 구분', () => {
  it('학원이 이름·스케줄로 보인다', () => {
    setup()
    const card = screen.getByTestId('academy-ac1')
    expect(within(card).getByText('더하다')).toBeInTheDocument()
    expect(within(card).getByText(/월.*14:30/)).toBeInTheDocument()
  })

  it('⭐ 숙제는 그 학원 아래 nested 로 뜬다', () => {
    setup()
    const 더하다 = screen.getByTestId('academy-ac1')
    // 한글 학원 숙제(a1)는 academyId ac1 → 더하다 카드 안
    expect(within(더하다).getByText('한글 학원 숙제')).toBeInTheDocument()
  })

  it('숙제 없는 학원은 "가는 것 자체가 활동" 안내', () => {
    setup()
    const 체육 = screen.getByTestId('academy-ac2')
    expect(within(체육).getByText(/가는 것 자체가 활동/)).toBeInTheDocument()
  })

  it('⭐ 엄마표 활동은 학원 아래가 아니라 우리집 섹션에 있다', () => {
    setup()
    // 영어 원서(a2)는 academyId 없음 → 어떤 academy 카드에도 없다
    const 더하다 = screen.getByTestId('academy-ac1')
    expect(within(더하다).queryByText('영어 원서')).not.toBeInTheDocument()
    expect(screen.getByText('영어 원서')).toBeInTheDocument() // 화면 어딘가엔 있다
  })

  it('학원 등록 폼: 이름·요일로 onCreateAcademy 가 불린다', async () => {
    const onCreateAcademy = vi.fn()
    setup(ACTIVITIES, { onCreateAcademy })
    await userEvent.click(screen.getByRole('button', { name: /학원 등록/ }))
    await userEvent.type(screen.getByLabelText(/학원 이름/), '에그스쿨')
    await userEvent.click(screen.getByRole('button', { name: '금' }))
    await userEvent.type(screen.getByLabelText(/시간/), '16:00')
    await userEvent.click(screen.getByRole('button', { name: /저장/ }))
    expect(onCreateAcademy).toHaveBeenCalledWith(
      expect.objectContaining({ name: '에그스쿨', weekdays: [5], time: '16:00' }),
    )
  })

  it('⭐ 학원 등록 폼: 등원용 영역을 고르면 coversDomains 로 들어간다 (INV-ACAD-06)', async () => {
    const onCreateAcademy = vi.fn()
    setup(ACTIVITIES, { onCreateAcademy })
    await userEvent.click(screen.getByRole('button', { name: /학원 등록/ }))
    await userEvent.type(screen.getByLabelText(/학원 이름/), '유아체육')
    await userEvent.click(screen.getByRole('button', { name: '일' }))
    // "가는 것만으로 챙기는 영역" 칩에서 예체능 선택
    const coverField = screen.getByText(/가는 것만으로 챙기는 영역/).closest('.aform__field') as HTMLElement
    await userEvent.click(within(coverField).getByRole('button', { name: '예체능' }))
    await userEvent.click(screen.getByRole('button', { name: /저장/ }))
    expect(onCreateAcademy).toHaveBeenCalledWith(
      expect.objectContaining({ name: '유아체육', coversDomains: ['예체능'] }),
    )
  })

  it('⭐ 학원 편집에서 등원용 영역을 바꾸면 onSetAcademyCovers 가 불린다', async () => {
    const onSetAcademyCovers = vi.fn()
    render(
      <ActivityScreen
        activities={ACTIVITIES}
        standards={STANDARDS}
        achieved={[]}
        onCreate={vi.fn()}
        onDeactivate={vi.fn()}
        onRetarget={vi.fn()}
        onRename={vi.fn()}
        onReschedule={vi.fn()}
        onSetOwner={vi.fn()}
        academies={ACADEMIES}
        onCreateAcademy={vi.fn()}
        onRenameAcademy={vi.fn()}
        onRescheduleAcademy={vi.fn()}
        onDeactivateAcademy={vi.fn()}
        onSetAcademyCovers={onSetAcademyCovers}
      />,
    )
    const card = screen.getByTestId('academy-ac2') // 유아체육, coversDomains 없음
    await userEvent.click(within(card).getByRole('button', { name: /편집/ }))
    const coverField = within(card).getByText(/가는 것만으로 챙기는 영역/).closest('.aform__field') as HTMLElement
    await userEvent.click(within(coverField).getByRole('button', { name: '예체능' }))
    await userEvent.click(within(card).getByRole('button', { name: /저장/ }))
    expect(onSetAcademyCovers).toHaveBeenCalledWith('ac2', ['예체능'])
  })

  it('⭐ 새 활동 폼에서 학원을 고르면 숙제(academyId)가 된다', async () => {
    const onCreate = vi.fn()
    setup(ACTIVITIES, { onCreate })
    await userEvent.click(screen.getByRole('button', { name: /새 활동/ }))
    await userEvent.type(screen.getByLabelText(/이름/), '한글 복습')
    await userEvent.selectOptions(screen.getByLabelText(/^영역/), '국어')
    await userEvent.selectOptions(screen.getByLabelText(/학원/), 'ac1')
    await userEvent.click(screen.getByRole('button', { name: /저장/ }))
    expect(onCreate.mock.calls[0]![0].academyId).toBe('ac1')
  })
})

describe('INV-UI-26 — owner 는 표시·선택만, 알림/요청 UI 없다', () => {
  it('담당 선택은 있다', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /새 활동/ }))
    expect(screen.getByLabelText(/담당/)).toBeInTheDocument()
  })

  it('⭐ 알림·요청·확인 컨트롤이 없다 (OOS-1)', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /새 활동/ }))
    for (const bad of [/알림/, /요청/, /보내기/, /리마인/]) {
      expect(screen.queryByRole('button', { name: bad })).not.toBeInTheDocument()
    }
  })
})
