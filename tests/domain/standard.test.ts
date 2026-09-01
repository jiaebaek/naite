/**
 * ARRR 사이클 #2 — RED
 * 대상: src/domain/guards.ts (requireValidStandard) · src/domain/pace.ts (currentTargets)
 * 계약: docs/07-계약.md §5 (원문 대조 후 강화된 계약)
 *
 * 배경: 초판 계약은 source.trim() !== '' 만 요구해서
 *      "2022 개정 교육과정 1~2학년군 국어" 같은 문자열도 통과했다.
 *      실제로 04 문서에서 원문과 다른 문장 7건이 걸러지지 않았다.
 */

import { describe, it, expect } from 'vitest'
import { requireValidStandard } from '../../src/domain/guards'
import { currentTargets } from '../../src/domain/pace'
import { isDomainError } from '../../src/domain/errors'
import type { PaceOffset, Standard } from '../../src/domain/types'

// ── 픽스처 ─────────────────────────────────────────────

/** 🟦 공교육 원문. baselinePeriod 는 **학년군 말**까지다 (초1~2학년군) */
const 공교육_한글자모: Standard = {
  id: 'std-2국04-01',
  domain: '국어',
  baselinePeriod: { start: '2028-03', end: '2030-02' },
  statement: '한글 자모의 이름과 소릿값을 알고 정확하게 발음하고 쓴다.',
  source: {
    document: '교육부 고시 제2022-33호 [별책 5] 국어과 교육과정',
    code: '2국04-01',
  },
  origin: '공교육',
}

/** 🟨 위 원문을 우리 일정에 배치한 해석 */
const 해석_받침없는단어: Standard = {
  id: 'int-ko-simple-words',
  domain: '국어',
  baselinePeriod: { start: '2027-09', end: '2028-02' },
  statement: '받침 없는 단어를 소리 내어 읽는다',
  source: { document: '04-교육기준표-2021년생.md §2' },
  origin: '해석',
  refines: 'std-2국04-01',
}

/** 자체 목표 — 공교육 기준이 없는 영역 */
const 자체_영어그림책: Standard = {
  id: 'own-en-picturebook',
  domain: '영어',
  baselinePeriod: { start: '2026-09', end: '2027-02' },
  statement: '영어 그림책 한 권을 끝까지 듣는다',
  source: null,
  origin: '자체',
}

const OFFSETS: readonly PaceOffset[] = [
  { domain: '국어', months: 12 },
  { domain: '수학', months: 12 },
]

// ── INV-STD-02 ─────────────────────────────────────────
describe('INV-STD-02 — origin 은 공교육 | 해석 | 자체 중 하나여야 한다', () => {
  it('세 origin 모두 통과한다', () => {
    expect(() => requireValidStandard(공교육_한글자모)).not.toThrow()
    expect(() => requireValidStandard(해석_받침없는단어)).not.toThrow()
    expect(() => requireValidStandard(자체_영어그림책)).not.toThrow()
  })

  it('알 수 없는 origin 은 E-STD-INVALID-ORIGIN 을 던진다', () => {
    const bad = { ...자체_영어그림책, origin: '카더라' } as unknown as Standard
    try {
      requireValidStandard(bad)
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-STD-INVALID-ORIGIN')).toBe(true)
    }
  })
})

// ── INV-STD-03 / 03b ───────────────────────────────────
describe("INV-STD-03 — origin='공교육' 이면 source.document 가 필수다", () => {
  it('source 가 null 이면 E-STD-MISSING-SOURCE', () => {
    const bad: Standard = { ...공교육_한글자모, source: null }
    try {
      requireValidStandard(bad)
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-STD-MISSING-SOURCE')).toBe(true)
    }
  })

  it('document 가 공백이면 E-STD-MISSING-SOURCE', () => {
    const bad: Standard = {
      ...공교육_한글자모,
      source: { document: '   ', code: '2국04-01' },
    }
    try {
      requireValidStandard(bad)
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-STD-MISSING-SOURCE')).toBe(true)
    }
  })
})

describe("INV-STD-03b — origin='공교육' 이면 code 또는 url 중 최소 하나가 필요하다", () => {
  it('code 만 있어도 통과한다', () => {
    expect(() => requireValidStandard(공교육_한글자모)).not.toThrow()
  })

  it('url 만 있어도 통과한다', () => {
    const ok: Standard = {
      ...공교육_한글자모,
      source: { document: '교육부 고시 제2022-33호 [별책 5]', url: 'https://ncic.re.kr/' },
    }
    expect(() => requireValidStandard(ok)).not.toThrow()
  })

  it('⭐ 문서명만 있으면 E-STD-MISSING-REFERENCE — 초판이 걸러내지 못한 바로 그 케이스', () => {
    const bad: Standard = {
      ...공교육_한글자모,
      source: { document: '2022 개정 교육과정 1~2학년군 국어' },
    }
    try {
      requireValidStandard(bad)
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-STD-MISSING-REFERENCE')).toBe(true)
    }
  })
})

// ── INV-STD-04 ─────────────────────────────────────────
describe("INV-STD-04 — origin='자체' 는 source 없이도 유효하다", () => {
  it('source 가 null 이어도 통과한다', () => {
    expect(() => requireValidStandard(자체_영어그림책)).not.toThrow()
  })

  it("공교육 기준이 없는 영역(영어)에도 만들 수 있다", () => {
    expect(자체_영어그림책.domain).toBe('영어')
    expect(() => requireValidStandard(자체_영어그림책)).not.toThrow()
  })
})

// ── INV-STD-08 ─────────────────────────────────────────
describe('INV-STD-08 — refines 는 존재하는 공교육 기준을 가리켜야 한다', () => {
  const all = [공교육_한글자모, 해석_받침없는단어, 자체_영어그림책]

  it('올바른 refines 는 통과한다', () => {
    expect(() => requireValidStandard(해석_받침없는단어, all)).not.toThrow()
  })

  it('존재하지 않는 id 를 가리키면 E-STD-INVALID-REFINES', () => {
    const bad: Standard = { ...해석_받침없는단어, refines: 'std-없는코드' }
    try {
      requireValidStandard(bad, all)
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-STD-INVALID-REFINES')).toBe(true)
    }
  })

  it("공교육이 아닌 기준을 가리키면 E-STD-INVALID-REFINES", () => {
    const bad: Standard = { ...해석_받침없는단어, refines: 'own-en-picturebook' }
    try {
      requireValidStandard(bad, all)
      expect.unreachable('던져야 한다')
    } catch (e) {
      expect(isDomainError(e, 'E-STD-INVALID-REFINES')).toBe(true)
    }
  })
})

// ── INV-STD-06 · currentTargets ────────────────────────
describe("INV-STD-06 — origin='공교육' 은 currentTargets 에 포함되지 않는다", () => {
  const all = [공교육_한글자모, 해석_받침없는단어, 자체_영어그림책]

  it('⭐ 공교육 원문은 근거 표시용이지 목표가 아니다', () => {
    const targets = currentTargets(all, OFFSETS, '2026-11')
    expect(targets.some((t) => t.origin === '공교육')).toBe(false)
  })

  it('해석 기준은 오프셋이 적용되어 지금 목표가 된다', () => {
    // 2027-09~2028-02 에 국어 오프셋 12개월 → 2026-09~2027-02. 2026-11 은 그 안이다
    const targets = currentTargets(all, OFFSETS, '2026-11')
    expect(targets.map((t) => t.id)).toContain('int-ko-simple-words')
  })

  it('오프셋을 0으로 되돌리면 아직 목표가 아니다', () => {
    const targets = currentTargets(all, [{ domain: '국어', months: 0 }], '2026-11')
    expect(targets.map((t) => t.id)).not.toContain('int-ko-simple-words')
  })

  it('자체 기준은 오프셋 없이 자기 구간에서 목표가 된다 (INV-PACE-02)', () => {
    // 2026-09~2027-02. 영어에는 오프셋이 없다
    const targets = currentTargets(all, OFFSETS, '2026-11')
    expect(targets.map((t) => t.id)).toContain('own-en-picturebook')
  })

  it('구간을 벗어난 시점에는 목표가 아니다', () => {
    const targets = currentTargets(all, OFFSETS, '2025-01')
    expect(targets).toHaveLength(0)
  })

  it('구간 양끝은 포함이다', () => {
    expect(currentTargets(all, OFFSETS, '2026-09').map((t) => t.id)).toContain('int-ko-simple-words')
    expect(currentTargets(all, OFFSETS, '2027-02').map((t) => t.id)).toContain('int-ko-simple-words')
  })
})
