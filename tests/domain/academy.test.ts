/**
 * ARRR 사이클 #16 — RED
 * 대상: src/domain/academy.ts
 * 계약: docs/07-계약.md §10
 *
 * 학원은 활동과 별개. 스케줄이 있고, 등원은 오늘 화면에 일정으로만 뜬다.
 */

import { describe, it, expect } from 'vitest'
import {
  academiesToday,
  createAcademy,
  deactivateAcademy,
  editAcademy,
  homeworkOf,
  renameAcademy,
  rescheduleAcademy,
} from '../../src/domain/academy'
import { isDomainError } from '../../src/domain/errors'
import type { Academy, AcademyInput, Activity } from '../../src/domain/types'

let seq = 0
const newId = () => `acad-${++seq}`

const input = (over: Partial<AcademyInput> = {}): AcademyInput => ({
  name: '더하다사고력',
  weekdays: [1], // 월
  time: '14:30',
  ...over,
})

describe('createAcademy', () => {
  it('학원을 만든다 (active=true)', () => {
    const a = createAcademy(input(), newId)
    expect(a.name).toBe('더하다사고력')
    expect(a.weekdays).toEqual([1])
    expect(a.time).toBe('14:30')
    expect(a.active).toBe(true)
    expect(a.id).toBeTruthy()
  })

  it('빈 이름은 E-ACAD-EMPTY-NAME', () => {
    try {
      createAcademy(input({ name: '  ' }), newId)
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-ACAD-EMPTY-NAME')).toBe(true)
    }
  })

  it('요일이 비어 있어도 만들 수 있다 (스케줄 미정)', () => {
    expect(() => createAcademy(input({ weekdays: [] }), newId)).not.toThrow()
  })

  it('시간·연락처는 선택이다', () => {
    const a = createAcademy({ name: '체육', weekdays: [0] }, newId)
    expect(a.time).toBeUndefined()
    expect(a.contact).toBeUndefined()
  })
})

describe('renameAcademy / rescheduleAcademy / deactivateAcademy', () => {
  it('이름을 바꾸고 나머지는 보존', () => {
    const a = createAcademy(input(), newId)
    const b = renameAcademy(a, '더하다')
    expect(b.name).toBe('더하다')
    expect(b.id).toBe(a.id)
    expect(b.weekdays).toEqual(a.weekdays)
  })

  it('빈 이름 rename 은 E-ACAD-EMPTY-NAME', () => {
    const a = createAcademy(input(), newId)
    try {
      renameAcademy(a, '')
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-ACAD-EMPTY-NAME')).toBe(true)
    }
  })

  it('스케줄을 바꾼다 (요일·시간)', () => {
    const a = createAcademy(input(), newId)
    const b = rescheduleAcademy(a, [3], '16:00')
    expect(b.weekdays).toEqual([3])
    expect(b.time).toBe('16:00')
    expect(b.name).toBe(a.name)
  })

  it('비활성화한다 — 삭제하지 않는다', () => {
    const a = createAcademy(input(), newId)
    const b = deactivateAcademy(a)
    expect(b.active).toBe(false)
    expect(b.id).toBe(a.id)
  })

  it('원본을 변경하지 않는다', () => {
    const a = createAcademy(input(), newId)
    renameAcademy(a, '딴이름')
    deactivateAcademy(a)
    expect(a.name).toBe('더하다사고력')
    expect(a.active).toBe(true)
  })
})

describe('academiesToday — 그날 등원 학원 (오늘 화면 일정)', () => {
  // 2026-11-02 월, 11-04 수, 11-01 일
  const 더하다 = createAcademy(input({ name: '더하다', weekdays: [1] }), newId)
  const 미술 = createAcademy(input({ name: '아이마음아트', weekdays: [3] }), newId)
  const 체육 = createAcademy(input({ name: '유아체육', weekdays: [0] }), newId)
  const ALL = [더하다, 미술, 체육]

  it('월요일엔 더하다만', () => {
    expect(academiesToday(ALL, '2026-11-02').map((a) => a.name)).toEqual(['더하다'])
  })

  it('수요일엔 미술만', () => {
    expect(academiesToday(ALL, '2026-11-04').map((a) => a.name)).toEqual(['아이마음아트'])
  })

  it('화요일엔 없다', () => {
    expect(academiesToday(ALL, '2026-11-03')).toHaveLength(0)
  })

  it('비활성 학원은 안 뜬다', () => {
    const off = [deactivateAcademy(더하다), 미술, 체육]
    expect(academiesToday(off, '2026-11-02')).toHaveLength(0)
  })
})

describe('homeworkOf — 학원의 숙제 (academyId 연결)', () => {
  const act = (over: Partial<Activity> & Pick<Activity, 'id' | 'name'>): Activity => ({
    domain: '국어', track: '집', targetIds: [], cadence: { kind: '매일' },
    owner: '아빠', active: true, ...over,
  })
  const 한글 = act({ id: 'hw1', name: '한글 숙제', academyId: 'acad-1' })
  const 팩토 = act({ id: 'hw2', name: '팩토 숙제', domain: '수학', academyId: 'acad-1' })
  const 영어 = act({ id: 'x', name: '영어 원서' }) // academyId 없음
  const ALL = [한글, 팩토, 영어]

  it('그 학원의 숙제만 돌려준다', () => {
    expect(homeworkOf('acad-1', ALL).map((a) => a.name)).toEqual(['한글 숙제', '팩토 숙제'])
  })

  it('academyId 없는(엄마표) 활동은 제외', () => {
    expect(homeworkOf('acad-1', ALL).some((a) => a.name === '영어 원서')).toBe(false)
  })

  it('숙제 없는 학원은 빈 배열', () => {
    expect(homeworkOf('acad-9', ALL)).toEqual([])
  })
})

// ⛔ attendanceActivities (등원용 영역 커버 합성 활동) 은 2026-09 결정으로 제거됐다.
//    영역-whole 자동커버 = 오버클레임(신뢰①). 커버리지는 이제 학원의 **실제 숙제 활동**(setup 이
//    프리셋으로 targetIds 를 확정해 생성)이 낸다. 커버리지 판정은 tests/domain/coverage.test.ts.
//    coversDomains 필드는 학원 과목 메타데이터로만 남는다(editAcademy 보존 테스트는 아래 유지).

describe('editAcademy (편집 폼 저장) ⭐', () => {
  it('id·active 보존, 이름·요일·시간·연락처 교체', () => {
    const a = deactivateAcademy(createAcademy(input(), newId))
    const edited = editAcademy(a, { name: '한글교실', weekdays: [2, 4], time: '16:00', contact: '010-1234-5678' })
    expect(edited.id).toBe(a.id)
    expect(edited.active).toBe(false)
    expect(edited.name).toBe('한글교실')
    expect(edited.weekdays).toEqual([2, 4])
    expect(edited.time).toBe('16:00')
    expect(edited.contact).toBe('010-1234-5678')
  })

  it('⭐ 폼에 없는 coversDomains 는 원본 값을 유지한다 (등원 커버 보존)', () => {
    const pe = createAcademy(input({ name: '유아체육', coversDomains: ['예체능', '건강·안전'] }), newId)
    const edited = editAcademy(pe, { name: '유아체육', weekdays: [0], time: '13:30' })
    expect(edited.coversDomains).toEqual(['예체능', '건강·안전'])
  })

  it('빈 이름은 E-ACAD-EMPTY-NAME', () => {
    const a = createAcademy(input(), newId)
    try {
      editAcademy(a, { name: '  ', weekdays: [1] })
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-ACAD-EMPTY-NAME')).toBe(true)
    }
  })
})
