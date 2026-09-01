/**
 * ARRR 사이클 #9 — RED
 * 대상: src/domain/activity.ts  (F2 · P-2)
 * 계약: docs/07-계약.md §2-A
 */

import { describe, it, expect } from 'vitest'
import { createActivity, deactivate, rename, reschedule, retarget, setOwner } from '../../src/domain/activity'
import { isDomainError } from '../../src/domain/errors'
import type { ActivityInput, Standard } from '../../src/domain/types'

const 국어목표: Standard = {
  id: 'int-ko',
  domain: '국어',
  baselinePeriod: { start: '2026-08', end: '2027-02' },
  statement: '받침 없는 단어를 소리 내어 읽는다',
  source: { document: '04 문서' },
  origin: '해석',
}

const 수학목표: Standard = { ...국어목표, id: 'int-ma', domain: '수학' }
const STANDARDS = [국어목표, 수학목표]

let seq = 0
const newId = () => `act-${++seq}`

const input = (over: Partial<ActivityInput> = {}): ActivityInput => ({
  name: '한글 학원 숙제',
  domain: '국어',
  track: '집',
  targetIds: [],
  cadence: { kind: '매일' },
  owner: '아빠',
  ...over,
})

describe('INV-ACT-01 — name 은 공백일 수 없다', () => {
  it.each(['', '   ', '\t\n'])('%p 은 E-ACT-EMPTY-NAME 을 던진다', (name) => {
    try {
      createActivity(input({ name }), STANDARDS, newId)
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-ACT-EMPTY-NAME')).toBe(true)
    }
  })

  it('정상 이름은 통과한다', () => {
    expect(createActivity(input(), STANDARDS, newId).name).toBe('한글 학원 숙제')
  })
})

describe('INV-ACT-02 — nature 는 저장되지 않는다', () => {
  it('⭐ 결과 객체에 nature 키가 존재하지 않는다', () => {
    // 파생값을 저장하면 목표가 바뀔 때 즉시 어긋난다
    const a = createActivity(input(), STANDARDS, newId)
    expect(Object.keys(a)).not.toContain('nature')
    expect('nature' in a).toBe(false)
  })
})

describe('INV-ACT-03 / 04 — cadence 유효성', () => {
  it('요일지정인데 weekdays 가 비면 E-ACT-EMPTY-WEEKDAYS', () => {
    try {
      createActivity(input({ cadence: { kind: '요일지정', weekdays: [] } }), STANDARDS, newId)
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-ACT-EMPTY-WEEKDAYS')).toBe(true)
    }
  })

  it('요일이 하나라도 있으면 통과한다', () => {
    const a = createActivity(
      input({ cadence: { kind: '요일지정', weekdays: [3] } }), STANDARDS, newId,
    )
    expect(a.cadence.kind).toBe('요일지정')
  })

  it.each([0, -1, 8, 99])('주N회 times=%i 는 E-ACT-INVALID-TIMES', (times) => {
    try {
      createActivity(input({ cadence: { kind: '주N회', times } }), STANDARDS, newId)
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-ACT-INVALID-TIMES')).toBe(true)
    }
  })

  it.each([1, 3, 7])('주N회 times=%i 는 통과한다', (times) => {
    expect(() =>
      createActivity(input({ cadence: { kind: '주N회', times } }), STANDARDS, newId),
    ).not.toThrow()
  })
})

describe('INV-ACT-06 / 07 / 08 — targetIds', () => {
  it('INV-ACT-08 — 비어 있어도 된다 (목표 없이 하는 활동을 막지 않는다)', () => {
    expect(() => createActivity(input({ targetIds: [] }), STANDARDS, newId)).not.toThrow()
  })

  it('존재하는 목표를 겨냥하면 통과한다', () => {
    const a = createActivity(input({ targetIds: ['int-ko'] }), STANDARDS, newId)
    expect(a.targetIds).toEqual(['int-ko'])
  })

  it('INV-ACT-06 — 없는 목표를 가리키면 E-ACT-TARGET-NOT-FOUND', () => {
    try {
      createActivity(input({ targetIds: ['없는목표'] }), STANDARDS, newId)
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-ACT-TARGET-NOT-FOUND')).toBe(true)
    }
  })

  it('INV-ACT-07 — 국어 활동이 수학 목표를 겨냥하면 E-ACT-TARGET-DOMAIN-MISMATCH', () => {
    try {
      createActivity(input({ domain: '국어', targetIds: ['int-ma'] }), STANDARDS, newId)
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-ACT-TARGET-DOMAIN-MISMATCH')).toBe(true)
    }
  })
})

describe('생성 결과', () => {
  it('active 는 true 로 시작한다', () => {
    expect(createActivity(input(), STANDARDS, newId).active).toBe(true)
  })

  it('id 는 주입된 생성기에서 온다 — 도메인은 순수하게 유지된다', () => {
    const a = createActivity(input(), STANDARDS, () => 'fixed-id')
    expect(a.id).toBe('fixed-id')
  })

  it('입력을 변경하지 않는다', () => {
    const i = input({ targetIds: ['int-ko'] })
    const before = JSON.stringify(i)
    createActivity(i, STANDARDS, newId)
    expect(JSON.stringify(i)).toBe(before)
  })
})

describe('retarget — 겨냥 목표 변경', () => {
  it('목표를 바꾸면 nature 와 커버리지가 함께 달라진다', () => {
    const a = createActivity(input(), STANDARDS, newId)
    const b = retarget(a, ['int-ko'], STANDARDS)
    expect(b.targetIds).toEqual(['int-ko'])
    expect(b.id).toBe(a.id)
  })

  it('목표를 비울 수 있다', () => {
    const a = createActivity(input({ targetIds: ['int-ko'] }), STANDARDS, newId)
    expect(retarget(a, [], STANDARDS).targetIds).toEqual([])
  })

  it('영역이 다른 목표로는 바꿀 수 없다', () => {
    const a = createActivity(input(), STANDARDS, newId)
    try {
      retarget(a, ['int-ma'], STANDARDS)
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-ACT-TARGET-DOMAIN-MISMATCH')).toBe(true)
    }
  })

  it('원본을 변경하지 않는다', () => {
    const a = createActivity(input(), STANDARDS, newId)
    retarget(a, ['int-ko'], STANDARDS)
    expect(a.targetIds).toEqual([])
  })
})

describe('rename — 이름만 바꾼다 (INV-ACT-09)', () => {
  it('이름이 바뀐다', () => {
    const a = createActivity(input(), STANDARDS, newId)
    expect(rename(a, '새 이름').name).toBe('새 이름')
  })

  it('id·domain·targetIds·active 를 보존한다', () => {
    const a = createActivity(input({ targetIds: ['int-ko'] }), STANDARDS, newId)
    const b = rename(a, '새 이름')
    expect(b.id).toBe(a.id)
    expect(b.domain).toBe(a.domain)
    expect(b.targetIds).toEqual(a.targetIds)
    expect(b.active).toBe(a.active)
  })

  it('빈 이름은 E-ACT-EMPTY-NAME', () => {
    const a = createActivity(input(), STANDARDS, newId)
    try {
      rename(a, '   ')
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-ACT-EMPTY-NAME')).toBe(true)
    }
  })

  it('원본을 변경하지 않는다', () => {
    const a = createActivity(input(), STANDARDS, newId)
    rename(a, '새 이름')
    expect(a.name).toBe('한글 학원 숙제')
  })
})

describe('reschedule — 주기만 바꾼다 (INV-ACT-10)', () => {
  it('주기가 바뀐다', () => {
    const a = createActivity(input(), STANDARDS, newId)
    expect(reschedule(a, { kind: '주N회', times: 3 }).cadence).toEqual({ kind: '주N회', times: 3 })
  })

  it('요일지정 빈 요일은 E-ACT-EMPTY-WEEKDAYS', () => {
    const a = createActivity(input(), STANDARDS, newId)
    try {
      reschedule(a, { kind: '요일지정', weekdays: [] })
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-ACT-EMPTY-WEEKDAYS')).toBe(true)
    }
  })

  it('주N회 범위 밖은 E-ACT-INVALID-TIMES', () => {
    const a = createActivity(input(), STANDARDS, newId)
    try {
      reschedule(a, { kind: '주N회', times: 0 })
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-ACT-INVALID-TIMES')).toBe(true)
    }
  })

  it('이름·목표를 보존한다', () => {
    const a = createActivity(input({ targetIds: ['int-ko'] }), STANDARDS, newId)
    const b = reschedule(a, { kind: '비정기' })
    expect(b.name).toBe(a.name)
    expect(b.targetIds).toEqual(a.targetIds)
  })

  it('원본을 변경하지 않는다', () => {
    const a = createActivity(input(), STANDARDS, newId)
    reschedule(a, { kind: '비정기' })
    expect(a.cadence).toEqual({ kind: '매일' })
  })
})

describe('setOwner — 담당만 바꾼다', () => {
  it('담당이 바뀐다', () => {
    const a = createActivity(input({ owner: '엄마' }), STANDARDS, newId)
    expect(setOwner(a, '아빠').owner).toBe('아빠')
  })

  it('이름·주기·목표를 보존한다', () => {
    const a = createActivity(input({ targetIds: ['int-ko'] }), STANDARDS, newId)
    const b = setOwner(a, '아빠')
    expect(b.name).toBe(a.name)
    expect(b.cadence).toEqual(a.cadence)
    expect(b.targetIds).toEqual(a.targetIds)
  })

  it('원본을 변경하지 않는다', () => {
    const a = createActivity(input({ owner: '엄마' }), STANDARDS, newId)
    setOwner(a, '아빠')
    expect(a.owner).toBe('엄마')
  })
})

describe('deactivate — 삭제하지 않고 비활성화한다', () => {
  it('active 가 false 가 된다', () => {
    const a = createActivity(input(), STANDARDS, newId)
    expect(deactivate(a).active).toBe(false)
  })

  it('⭐ 지난 기록이 고아가 되지 않도록 id 를 유지한다', () => {
    const a = createActivity(input(), STANDARDS, newId)
    expect(deactivate(a).id).toBe(a.id)
  })

  it('원본을 변경하지 않는다', () => {
    const a = createActivity(input(), STANDARDS, newId)
    deactivate(a)
    expect(a.active).toBe(true)
  })
})

describe('INV-ACT-05 — owner 는 표시 전용이다 (OOS-1 / X-4)', () => {
  it('owner 를 저장은 한다', () => {
    expect(createActivity(input({ owner: '아빠' }), STANDARDS, newId).owner).toBe('아빠')
  })

  it('⭐ owner 로 무언가를 생성하는 함수가 모듈에 없다', async () => {
    // 구조적 보장: 아빠에게 요구가 발생하는 순간 X-4 에 해당한다.
    // 상세 검증은 tests/architecture.test.ts
    const mod = await import('../../src/domain/activity')
    const 금지 = ['notify', 'assign', 'remind', 'alert', 'request']
    for (const name of Object.keys(mod)) {
      for (const bad of 금지) {
        expect(name.toLowerCase(), `${name} 이 ${bad} 를 포함한다`).not.toContain(bad)
      }
    }
  })
})
