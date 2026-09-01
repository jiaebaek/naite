/**
 * ARRR 사이클 #8 — RED
 * 대상: src/domain/completion.ts  (F1 · P-1)
 * 계약: docs/07-계약.md §5
 *
 * 탭 1회로 완료·해제. 확인 다이얼로그 없음. 추가 입력 없음. (C-3 / X-2)
 */

import { describe, it, expect } from 'vitest'
import {
  findCompletion,
  requireNoDuplicate,
  toggleCompletion,
} from '../../src/domain/completion'
import { isDomainError } from '../../src/domain/errors'
import type { Completion } from '../../src/domain/types'

const TODAY = '2026-11-04'

const 기록 = (activityId: string, date: string): Completion => ({ activityId, date })

describe('INV-COMP-03 — 토글은 없으면 생성, 있으면 해제', () => {
  it('기록이 없으면 생성한다', () => {
    const r = toggleCompletion('a1', TODAY, null, TODAY)
    expect(r.kind).toBe('created')
    if (r.kind === 'created') {
      expect(r.completion.activityId).toBe('a1')
      expect(r.completion.date).toBe(TODAY)
    }
  })

  it('기록이 있으면 해제한다', () => {
    const r = toggleCompletion('a1', TODAY, 기록('a1', TODAY), TODAY)
    expect(r.kind).toBe('removed')
    if (r.kind === 'removed') {
      expect(r.activityId).toBe('a1')
      expect(r.date).toBe(TODAY)
    }
  })

  it('멱등이 아니다 — 두 번 부르면 원래대로 돌아온다', () => {
    const first = toggleCompletion('a1', TODAY, null, TODAY)
    expect(first.kind).toBe('created')
    const created = first.kind === 'created' ? first.completion : null
    const second = toggleCompletion('a1', TODAY, created, TODAY)
    expect(second.kind).toBe('removed')
  })
})

describe('INV-COMP-04 — 기록 생성에 추가 입력을 요구하지 않는다 (C-3 / X-2)', () => {
  it('⭐ activityId 와 날짜만으로 기록이 만들어진다', () => {
    // 메모를 요구하면 "3초 이내"가 깨진다. 냉장고 종이에 진다.
    const r = toggleCompletion('a1', TODAY, null, TODAY)
    if (r.kind !== 'created') throw new Error('created 여야 한다')
    expect(r.completion.memo).toBeUndefined()
  })

  it('토글 함수는 메모 인자를 받지 않는다 — 시그니처로 보장한다', () => {
    expect(toggleCompletion.length).toBe(4)
  })
})

describe('INV-COMP-02 — 미래 날짜에는 기록할 수 없다', () => {
  it('내일 날짜는 E-COMP-FUTURE-DATE 를 던진다', () => {
    try {
      toggleCompletion('a1', '2026-11-05', null, TODAY)
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-COMP-FUTURE-DATE')).toBe(true)
    }
  })

  it('오늘은 허용된다', () => {
    expect(() => toggleCompletion('a1', TODAY, null, TODAY)).not.toThrow()
  })

  it('과거는 허용된다 — 어제 한 걸 오늘 체크할 수 있다', () => {
    expect(() => toggleCompletion('a1', '2026-11-01', null, TODAY)).not.toThrow()
  })

  it('해제도 미래 날짜에는 불가능하다', () => {
    try {
      toggleCompletion('a1', '2027-01-01', 기록('a1', '2027-01-01'), TODAY)
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-COMP-FUTURE-DATE')).toBe(true)
    }
  })
})

describe('INV-COMP-01 — (date, activityId) 조합은 유일하다', () => {
  const 기존: readonly Completion[] = [기록('a1', TODAY), 기록('a2', TODAY)]

  it('중복이면 E-COMP-DUPLICATE 를 던진다', () => {
    try {
      requireNoDuplicate('a1', TODAY, 기존)
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-COMP-DUPLICATE')).toBe(true)
    }
  })

  it('같은 활동이라도 날짜가 다르면 통과한다', () => {
    expect(() => requireNoDuplicate('a1', '2026-11-03', 기존)).not.toThrow()
  })

  it('같은 날이라도 활동이 다르면 통과한다', () => {
    expect(() => requireNoDuplicate('a3', TODAY, 기존)).not.toThrow()
  })
})

describe('findCompletion', () => {
  const 기존: readonly Completion[] = [기록('a1', TODAY), 기록('a1', '2026-11-03')]

  it('해당 날짜의 기록을 찾는다', () => {
    expect(findCompletion('a1', TODAY, 기존)?.date).toBe(TODAY)
  })

  it('없으면 null 이다', () => {
    expect(findCompletion('a9', TODAY, 기존)).toBeNull()
  })

  it('날짜가 다르면 찾지 않는다', () => {
    expect(findCompletion('a1', '2026-11-02', 기존)).toBeNull()
  })
})
