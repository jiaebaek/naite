/**
 * ARRR 사이클 #1 — RED
 * 대상: src/domain/pace.ts  (F3 · P-3)
 * 계약: docs/07-계약.md §1
 *
 * 원칙: 계약 ID 1개 = 테스트 1개 이상. describe 블록 이름에 계약 ID를 박는다.
 */

import { describe, it, expect } from 'vitest'
import {
  assessOffsetRaise,
  effectiveOffset,
  resolveTargetPeriod,
  setPaceOffset,
  shiftYearMonth,
} from '../../src/domain/pace'
import { isDomainError } from '../../src/domain/errors'
import type { PaceOffset, Standard } from '../../src/domain/types'

// ── 픽스처 ─────────────────────────────────────────────
/** 04 문서 §2 — 취학 직전 후반 구간의 국어 목표 */
const 국어_받침없는단어: Standard = {
  id: 'ko-read-simple-words',
  domain: '국어',
  baselinePeriod: { start: '2027-09', end: '2028-02' },
  statement: '받침 없는 단어를 소리 내어 읽는다',
  source: { document: '04-교육기준표-2021년생.md §2' },
  origin: '해석',
}

/** 공교육 기준이 없는 영역에 우리가 세운 목표 */
const 영어_자체목표: Standard = {
  id: 'en-own-picturebook-listen',
  domain: '영어',
  baselinePeriod: { start: '2026-09', end: '2027-02' },
  statement: '영어 그림책 한 권을 끝까지 듣는다',
  source: null,
  origin: '자체',
}

// ── shiftYearMonth ─────────────────────────────────────
describe('shiftYearMonth', () => {
  it('같은 해 안에서 개월을 뺀다', () => {
    expect(shiftYearMonth('2027-09', 3)).toBe('2027-06')
  })

  it('연도 경계를 넘어간다', () => {
    expect(shiftYearMonth('2027-01', 1)).toBe('2026-12')
  })

  it('12개월을 빼면 연도만 1 줄고 월은 그대로다', () => {
    expect(shiftYearMonth('2027-09', 12)).toBe('2026-09')
    expect(shiftYearMonth('2028-02', 12)).toBe('2027-02')
  })

  it('24개월을 뺀다', () => {
    expect(shiftYearMonth('2028-02', 24)).toBe('2026-02')
  })

  it('0개월이면 그대로다', () => {
    expect(shiftYearMonth('2027-09', 0)).toBe('2027-09')
  })

  it('월은 항상 2자리로 채운다', () => {
    expect(shiftYearMonth('2027-11', 10)).toBe('2027-01')
  })
})

// ── setPaceOffset ──────────────────────────────────────
describe('INV-PACE-01 — months 는 0 | 12 | 24 여야 한다', () => {
  it.each([0, 12, 24] as const)('%i 개월은 허용된다', (months) => {
    const result = setPaceOffset('국어', months)
    expect(result).toEqual({ domain: '국어', months })
  })

  it.each([6, 1, -12, 13, 36, 0.5])('%p 은 E-PACE-INVALID-MONTHS 를 던진다', (months) => {
    try {
      setPaceOffset('국어', months)
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-PACE-INVALID-MONTHS')).toBe(true)
    }
  })
})

describe('INV-PACE-04 — 설정되지 않은 영역의 실효 오프셋은 0 이다', () => {
  const offsets: readonly PaceOffset[] = [
    { domain: '국어', months: 12 },
    { domain: '수학', months: 12 },
  ]

  it('설정된 영역은 그 값을 돌려준다', () => {
    expect(effectiveOffset('국어', offsets)).toBe(12)
  })

  it('설정되지 않은 영역은 0 이다', () => {
    expect(effectiveOffset('사회·인성', offsets)).toBe(0)
  })

  it('오프셋 목록이 비어 있어도 0 이다', () => {
    expect(effectiveOffset('국어', [])).toBe(0)
  })
})

// ── resolveTargetPeriod ────────────────────────────────
describe('resolveTargetPeriod — 우리 집 목표 시기 = 기준 시기 − 오프셋', () => {
  it('1년 선행하면 목표 시기가 12개월 당겨진다', () => {
    // 04 문서 §1-B: 1년 선행 시 "받침 없는 단어 읽기"가 지금 구간으로 온다
    expect(resolveTargetPeriod(국어_받침없는단어, 12)).toEqual({
      start: '2026-09',
      end: '2027-02',
    })
  })

  it('오프셋 0 이면 기준 시기를 그대로 돌려준다', () => {
    expect(resolveTargetPeriod(국어_받침없는단어, 0)).toEqual(
      국어_받침없는단어.baselinePeriod,
    )
  })

  it('2년 선행도 계산된다', () => {
    expect(resolveTargetPeriod(국어_받침없는단어, 24)).toEqual({
      start: '2025-09',
      end: '2026-02',
    })
  })

  it('INV-PERIOD-01 — 결과는 start <= end 를 만족한다', () => {
    for (const months of [0, 12, 24] as const) {
      const p = resolveTargetPeriod(국어_받침없는단어, months)
      expect(p.start <= p.end).toBe(true)
    }
  })

  it('INV-PERIOD-02 — 구간 길이를 보존한다 (당기는 것이지 늘리는 게 아니다)', () => {
    const span = (p: { start: string; end: string }) => {
      const [ys, ms] = p.start.split('-').map(Number) as [number, number]
      const [ye, me] = p.end.split('-').map(Number) as [number, number]
      return (ye - ys) * 12 + (me - ms)
    }
    const baseSpan = span(국어_받침없는단어.baselinePeriod)
    expect(span(resolveTargetPeriod(국어_받침없는단어, 12))).toBe(baseSpan)
    expect(span(resolveTargetPeriod(국어_받침없는단어, 24))).toBe(baseSpan)
  })

  it('INV-PACE-01 — 잘못된 오프셋은 E-PACE-INVALID-MONTHS 를 던진다', () => {
    try {
      // @ts-expect-error 계약 위반을 런타임에서도 막는지 확인한다
      resolveTargetPeriod(국어_받침없는단어, 6)
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-PACE-INVALID-MONTHS')).toBe(true)
    }
  })
})

describe("INV-PACE-02 — origin='자체' 기준에는 오프셋이 적용되지 않는다", () => {
  it('자체 기준은 오프셋과 무관하게 baselinePeriod 를 그대로 돌려준다', () => {
    for (const months of [0, 12, 24] as const) {
      expect(resolveTargetPeriod(영어_자체목표, months)).toEqual(
        영어_자체목표.baselinePeriod,
      )
    }
  })

  it('이미 시기를 정한 목표에 오프셋을 또 얹으면 이중 조정이 된다 — 그래서 무시한다', () => {
    const result = resolveTargetPeriod(영어_자체목표, 24)
    expect(result.start).toBe('2026-09')
    expect(result.start).not.toBe('2024-09')
  })
})

// ── assessOffsetRaise ──────────────────────────────────
describe('INV-PACE-05 — 오프셋 상향 시 반드시 경고를 반환한다', () => {
  it('0 → 12 상향은 경고를 반환한다', () => {
    const w = assessOffsetRaise(0, 12)
    expect(w).not.toBeNull()
    expect(w?.from).toBe(0)
    expect(w?.to).toBe(12)
  })

  it('12 → 24 상향도 경고를 반환한다', () => {
    expect(assessOffsetRaise(12, 24)).not.toBeNull()
  })

  it('경고에는 발달 신호 체크 항목이 담긴다', () => {
    const w = assessOffsetRaise(0, 24)
    expect(w?.signals.length).toBeGreaterThan(0)
    expect(w?.message.length).toBeGreaterThan(0)
  })

  it('하향은 경고하지 않는다', () => {
    expect(assessOffsetRaise(24, 12)).toBeNull()
    expect(assessOffsetRaise(12, 0)).toBeNull()
  })

  it('동일 값은 경고하지 않는다', () => {
    expect(assessOffsetRaise(12, 12)).toBeNull()
  })

  it('무음 상향은 불가능하다 — 모든 상향 조합이 경고를 낸다', () => {
    const pairs = [
      [0, 12],
      [0, 24],
      [12, 24],
    ] as const
    for (const [from, to] of pairs) {
      expect(assessOffsetRaise(from, to), `${from}→${to}`).not.toBeNull()
    }
  })
})
