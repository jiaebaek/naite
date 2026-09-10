/**
 * ManageSheet (학원·활동 추가/편집 바텀시트) — UX 리디자인 §12.
 * 어디서(학원/자체/자유)·영역·주간 목표 횟수·겨냥 목표. 편집엔 위험색 삭제.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ManageSheet } from '../../src/boundary/ui/ManageSheet'
import type { TargetOption } from '../../src/boundary/ui/ManageSheet'
import type { Academy, Activity } from '../../src/domain/types'

// 유형 프리셋('한글')은 그 활동유형의 primary(nuri-com-8·7)만 미리 체크한다 →
// 폼의 겨냥 목표 옵션(이 시기 목표)에 그 id 가 있어야 체크된다. 실제 id 로 픽스처를 맞춘다.
const TARGETS: readonly TargetOption[] = [
  { id: 'nuri-com-8', statement: '아는 글자를 찾아낸다', domain: '국어' },
  { id: 'nuri-com-7', statement: '책을 끝까지 듣는다', domain: '국어' },
  { id: 'nuri-nat-8', statement: '10까지 센다', domain: '수학' },
]
const ACADEMIES = [{ id: 'ac1', name: '더하다사고력' }]

const setup = (target: React.ComponentProps<typeof ManageSheet>['target']) => {
  const h = { onSaveAcademy: vi.fn(), onSaveActivity: vi.fn(), onDelete: vi.fn(), onClose: vi.fn() }
  render(<ManageSheet target={target} academies={ACADEMIES} targets={TARGETS} {...h} />)
  return h
}

describe('활동 추가 폼', () => {
  it('기본은 자체 · 영역 국어 · 주간 스텝퍼·겨냥 목표 노출', () => {
    setup({ kind: 'activity' })
    expect(screen.getByText('활동 추가')).toBeInTheDocument()
    expect(screen.getByTestId('weekly-stepper')).toBeInTheDocument()
    expect(screen.getByText('아는 글자를 찾아낸다')).toBeInTheDocument() // 국어 목표
    expect(screen.queryByText('10까지 센다')).not.toBeInTheDocument() // 수학 목표는 숨김
  })

  it('⭐ 이름·겨냥 목표·주간 횟수를 채워 추가하면 onSaveActivity(input, null)', async () => {
    const h = setup({ kind: 'activity' })
    await userEvent.type(screen.getByPlaceholderText('활동 이름'), '한글 놀이')
    await userEvent.click(screen.getByText('아는 글자를 찾아낸다'))
    await userEvent.click(within(screen.getByTestId('weekly-stepper')).getByRole('button', { name: '늘리기' }))
    await userEvent.click(screen.getByRole('button', { name: '추가' }))
    expect(h.onSaveActivity).toHaveBeenCalledTimes(1)
    const [input, editing] = h.onSaveActivity.mock.calls[0]!
    expect(editing).toBeNull()
    expect(input).toMatchObject({
      name: '한글 놀이', domain: '국어', track: '집', targetIds: ['nuri-com-8'],
      cadence: { kind: '주N회', times: 2 },
    })
  })

  it("'학원' 선택 시 학원 드롭다운이 나오고 track·academyId 로 저장된다", async () => {
    const h = setup({ kind: 'activity' })
    await userEvent.type(screen.getByPlaceholderText('활동 이름'), '학원 숙제')
    await userEvent.click(screen.getByRole('button', { name: '학원' }))
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '추가' }))
    expect(h.onSaveActivity.mock.calls[0]![0]).toMatchObject({ track: '학원', academyId: 'ac1' })
  })

  it("'자유' 선택 시 스텝퍼·겨냥 목표가 사라지고 targetIds 빈 배열·비정기로 저장", async () => {
    const h = setup({ kind: 'activity' })
    await userEvent.type(screen.getByPlaceholderText('활동 이름'), '자유 놀이')
    await userEvent.click(screen.getByRole('button', { name: '자유' }))
    expect(screen.queryByTestId('weekly-stepper')).not.toBeInTheDocument()
    expect(screen.queryByText('아는 글자를 찾아낸다')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '추가' }))
    expect(h.onSaveActivity.mock.calls[0]![0]).toMatchObject({ targetIds: [], cadence: { kind: '비정기' } })
  })

  it('영역을 바꾸면 그 영역 목표가 나오고 이전 선택은 초기화된다', async () => {
    setup({ kind: 'activity' })
    await userEvent.click(screen.getByText('아는 글자를 찾아낸다')) // 국어 선택
    await userEvent.click(screen.getByRole('button', { name: '수학' })) // 영역 변경
    expect(screen.getByText('10까지 센다')).toBeInTheDocument()
    expect(screen.queryByText('아는 글자를 찾아낸다')).not.toBeInTheDocument()
  })

  it('이름 없이 추가하면 오류 + 저장 안 됨', async () => {
    const h = setup({ kind: 'activity' })
    await userEvent.click(screen.getByRole('button', { name: '추가' }))
    expect(screen.getByText(/이름을 입력해 주세요/)).toBeInTheDocument()
    expect(h.onSaveActivity).not.toHaveBeenCalled()
  })

  it('추가 폼엔 삭제 버튼이 없다', () => {
    setup({ kind: 'activity' })
    expect(screen.queryByText(/삭제/)).not.toBeInTheDocument()
  })

  it('⭐ 유형 프리셋을 누르면 이름·영역·겨냥 목표(프리셋 primary만)가 자동 채워진다 (원칙 8·과소청구)', async () => {
    const h = setup({ kind: 'activity' })
    await userEvent.click(screen.getByRole('button', { name: '한글·독서' }))
    expect(screen.getByDisplayValue('한글 학원 숙제')).toBeInTheDocument() // 이름 자동
    await userEvent.click(screen.getByRole('button', { name: '추가' }))
    const input = h.onSaveActivity.mock.calls[0]![0]
    expect(input).toMatchObject({ name: '한글 학원 숙제', domain: '국어', track: '학원' })
    // 영역 전체가 아니라 활동유형 프리셋('한글')의 primary 만 미리 체크된다.
    expect(input.targetIds).toEqual(['nuri-com-8', 'nuri-com-7'])
  })

  it('편집 폼엔 유형 프리셋이 없다', () => {
    setup({ kind: 'activity', activity: { id: 'a1', name: 'x', domain: '국어', track: '집', targetIds: [], cadence: { kind: '주N회', times: 1 }, owner: '엄마', active: true } })
    expect(screen.queryByRole('button', { name: '한글·독서' })).not.toBeInTheDocument()
  })
})

describe('활동 편집 폼', () => {
  const ACT: Activity = {
    id: 'a1', name: '보드게임', domain: '수학', track: '집',
    targetIds: ['int-ma-a'], cadence: { kind: '주N회', times: 3 }, owner: '엄마', active: true,
  }

  it('기존값이 채워지고 제목·삭제가 편집용이다', () => {
    setup({ kind: 'activity', activity: ACT })
    expect(screen.getByText('활동 편집')).toBeInTheDocument()
    expect(screen.getByDisplayValue('보드게임')).toBeInTheDocument()
    expect(within(screen.getByTestId('weekly-stepper')).getByText('주 3회')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /이 활동 삭제/ })).toBeInTheDocument()
  })

  it('⭐ 저장하면 onSaveActivity(input, editing)', async () => {
    const h = setup({ kind: 'activity', activity: ACT })
    await userEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(h.onSaveActivity).toHaveBeenCalledTimes(1)
    expect(h.onSaveActivity.mock.calls[0]![1]).toEqual(ACT)
  })

  it('삭제를 누르면 onDelete', async () => {
    const h = setup({ kind: 'activity', activity: ACT })
    await userEvent.click(screen.getByRole('button', { name: /이 활동 삭제/ }))
    expect(h.onDelete).toHaveBeenCalled()
  })
})

describe('학원 폼', () => {
  it('추가: 이름·요일을 채워 저장하면 onSaveAcademy(input, null)', async () => {
    const h = setup({ kind: 'academy' })
    expect(screen.getByText('학원 추가')).toBeInTheDocument()
    await userEvent.type(screen.getByPlaceholderText('학원 이름'), '영어학원')
    await userEvent.click(screen.getByRole('button', { name: '월' }))
    await userEvent.click(screen.getByRole('button', { name: '추가' }))
    expect(h.onSaveAcademy).toHaveBeenCalledTimes(1)
    const [input, editing] = h.onSaveAcademy.mock.calls[0]!
    expect(editing).toBeNull()
    expect(input).toMatchObject({ name: '영어학원', weekdays: [1] })
  })

  it('편집: 기존값 + 삭제 버튼', () => {
    const AC: Academy = { id: 'x', name: '더하다', weekdays: [1], time: '14:30', active: true }
    const h = setup({ kind: 'academy', academy: AC })
    expect(screen.getByText('학원 편집')).toBeInTheDocument()
    expect(screen.getByDisplayValue('더하다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /이 학원 삭제/ })).toBeInTheDocument()
    void h
  })
})
