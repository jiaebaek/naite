/**
 * ARRR 사이클 #14 — RED
 * 대상: src/domain/pet.ts
 * 계약: docs/07-계약.md §9 (돌봄·펫)
 *
 * ⭐ 벌 없는 펫. 할 일을 하면 돌봄 토큰이 생기고, 그 토큰으로 펫을 돌본다.
 *    안 돌봤다고 펫이 작아지거나 굶지 않는다 — streak 철학과 같다.
 */

import { describe, it, expect } from 'vitest'
import {
  INITIAL_CARE,
  canCare,
  grantToken,
  performCare,
  petStage,
} from '../../src/domain/pet'
import { isDomainError } from '../../src/domain/errors'

describe('토큰 경제 — 완료가 돌봄을 열어준다', () => {
  it('완료 1개 → 토큰 1개', () => {
    const c = grantToken(INITIAL_CARE)
    expect(c.available).toBe(1)
    expect(c.careCount).toBe(0)
  })

  it('여러 번 완료하면 쌓인다', () => {
    let c = INITIAL_CARE
    for (let i = 0; i < 5; i++) c = grantToken(c)
    expect(c.available).toBe(5)
  })

  it('canCare — 토큰이 있어야 돌볼 수 있다', () => {
    expect(canCare(INITIAL_CARE)).toBe(false)
    expect(canCare(grantToken(INITIAL_CARE))).toBe(true)
  })
})

describe('돌봄 — 토큰 1개 쓰고 돌봄 1회 적립', () => {
  it('돌보면 토큰 1 줄고 careCount 1 는다', () => {
    const after = performCare(grantToken(INITIAL_CARE))
    expect(after.available).toBe(0)
    expect(after.careCount).toBe(1)
  })

  it('⭐ 토큰이 없으면 E-CARE-NO-TOKEN — 돌봄은 공짜가 아니다', () => {
    try {
      performCare(INITIAL_CARE)
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-CARE-NO-TOKEN')).toBe(true)
    }
  })

  it('세 번 벌어 두 번 돌보면 토큰 1 남고 careCount 2', () => {
    let c = INITIAL_CARE
    c = grantToken(grantToken(grantToken(c)))
    c = performCare(performCare(c))
    expect(c).toEqual({ available: 1, careCount: 2 })
  })
})

describe('⭐ INV-PET — 벌이 없다', () => {
  it('돌봄 함수는 careCount 를 절대 줄이지 않는다', () => {
    let c = grantToken(grantToken(grantToken(INITIAL_CARE)))
    const counts: number[] = []
    c = performCare(c); counts.push(c.careCount)
    c = performCare(c); counts.push(c.careCount)
    c = grantToken(c)
    c = performCare(c); counts.push(c.careCount)
    expect(counts).toEqual([1, 2, 3]) // 단조 증가
  })

  it('토큰을 안 써도 careCount 는 그대로다 — 방치해도 펫이 후퇴하지 않는다', () => {
    const c = grantToken(grantToken(INITIAL_CARE))
    expect(c.careCount).toBe(0) // 안 돌봐도 0에서 안 내려감(음수 없음)
  })

  it('grantToken 은 available 를 줄이지 않는다', () => {
    const c = grantToken(INITIAL_CARE)
    expect(grantToken(c).available).toBeGreaterThanOrEqual(c.available)
  })
})

describe('petStage — 누적 돌봄으로 단계 상승', () => {
  it('시작은 첫 단계', () => {
    const s = petStage(0)
    expect(s.index).toBe(0)
    expect(s.emoji.length).toBeGreaterThan(0)
    expect(s.label.length).toBeGreaterThan(0)
  })

  it('돌볼수록 단계가 오른다', () => {
    expect(petStage(30).index).toBeGreaterThan(petStage(3).index)
  })

  it('⭐ 단계는 careCount 에 대해 단조 비감소 — 절대 후퇴하지 않는다', () => {
    let prev = -1
    for (let n = 0; n <= 40; n++) {
      const idx = petStage(n).index
      expect(idx).toBeGreaterThanOrEqual(prev)
      prev = idx
    }
  })

  it('마지막 단계 다음은 없다 (nextAt null)', () => {
    expect(petStage(9999).nextAt).toBeNull()
  })

  it('중간 단계에는 다음 목표가 있다', () => {
    const s = petStage(0)
    expect(s.nextAt).not.toBeNull()
    expect(s.nextAt!).toBeGreaterThan(0)
  })

  it('음수 careCount 도 첫 단계로 안전 처리', () => {
    expect(petStage(-5).index).toBe(0)
  })
})
