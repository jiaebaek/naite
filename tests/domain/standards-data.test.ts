/**
 * ARRR 사이클 #3 — 데이터 무결성
 * 대상: src/domain/standards/child2021.ts
 *
 * 계약은 코드만이 아니라 **데이터에도** 걸려야 한다.
 * 초판 04 문서에서 원문과 다른 문장 7건이 나온 이유가 이 검증이 없었기 때문이다.
 */

import { describe, it, expect } from 'vitest'
import { STANDARDS_2021, INITIAL_OFFSETS } from '../../src/domain/standards/child2021'
import { requireValidStandard } from '../../src/domain/guards'
import { currentTargets, resolveTargetPeriod, effectiveOffset } from '../../src/domain/pace'
import { DOMAINS } from '../../src/domain/types'

describe('데이터가 Standard 계약을 만족한다', () => {
  it('모든 기준이 requireValidStandard 를 통과한다', () => {
    for (const s of STANDARDS_2021) {
      expect(() => requireValidStandard(s, STANDARDS_2021), s.id).not.toThrow()
    }
  })

  it('id 가 중복되지 않는다', () => {
    const ids = STANDARDS_2021.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('INV-STD-03b — 모든 공교육 기준에 성취기준 코드나 URL이 있다', () => {
    for (const s of STANDARDS_2021.filter((x) => x.origin === '공교육')) {
      const hasRef = Boolean(s.source?.code?.trim() || s.source?.url?.trim())
      expect(hasRef, `${s.id} 에 code/url 이 없다`).toBe(true)
    }
  })

  it('INV-STD-04 — 자체 기준은 source 가 없어도 된다', () => {
    const own = STANDARDS_2021.filter((s) => s.origin === '자체')
    expect(own.length).toBeGreaterThan(0)
    expect(own.every((s) => s.source === null)).toBe(true)
  })

  it('INV-STD-08 — refines 는 모두 존재하는 공교육 기준을 가리킨다', () => {
    const byId = new Map(STANDARDS_2021.map((s) => [s.id, s]))
    for (const s of STANDARDS_2021) {
      if (!s.refines) continue
      const target = byId.get(s.refines)
      expect(target, `${s.id} → ${s.refines} 가 없다`).toBeDefined()
      expect(target?.origin, `${s.id} → ${s.refines} 가 공교육이 아니다`).toBe('공교육')
    }
  })

  it('domain 값이 모두 유효하다', () => {
    for (const s of STANDARDS_2021) {
      expect(DOMAINS as readonly string[], s.id).toContain(s.domain)
    }
  })

  it('INV-PERIOD-01 — 모든 구간이 start <= end 다', () => {
    for (const s of STANDARDS_2021) {
      expect(s.baselinePeriod.start <= s.baselinePeriod.end, s.id).toBe(true)
    }
  })
})

describe('원문 충실성 — 공교육 기준은 원문 그대로여야 한다', () => {
  const find = (id: string) => STANDARDS_2021.find((s) => s.id === id)

  it('[2국04-01] — "발음하고"가 빠지지 않았다 (초판 오류 #1)', () => {
    expect(find('std-2국04-01')?.statement).toBe(
      '한글 자모의 이름과 소릿값을 알고 정확하게 발음하고 쓴다.',
    )
  })

  it('[2국02-01] — "짧은 글"이 빠지지 않았다 (초판 오류 #2)', () => {
    expect(find('std-2국02-01')?.statement).toBe(
      '글자, 단어, 문장, 짧은 글을 정확하게 소리 내어 읽는다.',
    )
  })

  it('누리과정 — "그림으로"를 덧붙이지 않았다 (초판 오류 #4)', () => {
    const s = find('nuri-com-9')
    expect(s?.statement).toBe('자신의 생각을 글자와 비슷한 형태로 표현한다.')
    expect(s?.statement).not.toContain('그림')
  })

  it('공교육 기준의 baselinePeriod 는 학년군/누리과정 구간이지 임의 시기가 아니다', () => {
    // 2022 개정은 학년군 단위다. "1학년에 무엇을 배운다"는 교육과정에 없다 (초판 오류 #6)
    for (const s of STANDARDS_2021.filter((x) => x.origin === '공교육' && x.source?.code?.startsWith('2'))) {
      expect(s.baselinePeriod, s.id).toEqual({ start: '2028-03', end: '2030-02' })
    }
  })
})

describe('INV-STD-06 — 공교육 원문은 목표 판정에서 제외된다', () => {
  it('지금 목표에 공교육 기준이 섞이지 않는다', () => {
    const targets = currentTargets(STANDARDS_2021, INITIAL_OFFSETS, '2026-11')
    expect(targets.every((t) => t.origin !== '공교육')).toBe(true)
  })

  it('그래도 근거는 남아 있다 — 해석은 refines 로 원문을 가리킨다', () => {
    const targets = currentTargets(STANDARDS_2021, INITIAL_OFFSETS, '2026-11')
    const withBasis = targets.filter((t) => t.refines)
    expect(withBasis.length).toBeGreaterThan(0)
  })
})

describe('1년 선행이 실제 상황과 맞는지 — 04 문서 §1-B 검증', () => {
  const NOW = '2026-11'

  it('국어: 1년 선행이면 "받침 없는 단어 읽기"가 지금 목표가 된다', () => {
    const ids = currentTargets(STANDARDS_2021, INITIAL_OFFSETS, NOW).map((t) => t.id)
    expect(ids).toContain('int-ko-read-simple-words')
  })

  it('수학: 1년 선행이면 "50까지 세기"가 지금 목표가 된다', () => {
    const ids = currentTargets(STANDARDS_2021, INITIAL_OFFSETS, NOW).map((t) => t.id)
    expect(ids).toContain('int-ma-count-50')
  })

  it('학교적응: 오프셋 0이므로 아직 목표가 아니다 (선행할 이유가 없다)', () => {
    const ids = currentTargets(STANDARDS_2021, INITIAL_OFFSETS, NOW).map((t) => t.id)
    expect(ids).not.toContain('int-hs-sit-40min')
    expect(effectiveOffset('사회·인성', INITIAL_OFFSETS)).toBe(0)
  })

  it('영어: 자체 기준이라 오프셋 없이 지금 목표다', () => {
    const ids = currentTargets(STANDARDS_2021, INITIAL_OFFSETS, NOW).map((t) => t.id)
    expect(ids).toContain('own-en-listen-picturebook')
  })

  it('INV-PACE-02 — 영어 자체 기준에 오프셋을 걸어도 구간이 변하지 않는다', () => {
    const en = STANDARDS_2021.find((s) => s.id === 'own-en-listen-picturebook')!
    expect(resolveTargetPeriod(en, 24)).toEqual(en.baselinePeriod)
  })

  it('오프셋을 0으로 되돌리면 국어 목표가 사라진다 — 오프셋이 실제로 동작한다', () => {
    const zero = INITIAL_OFFSETS.map((o) => ({ ...o, months: 0 as const }))
    const ids = currentTargets(STANDARDS_2021, zero, NOW).map((t) => t.id)
    expect(ids).not.toContain('int-ko-read-simple-words')
  })
})

describe('⭐ 누적 모델 — 선행은 바꿔치기가 아니라 더하는 것 (설계 정정 ⑤)', () => {
  // 사용자 지적: "6살껄 하면서 7살껄 미리 하는 게 선행인데, 1년 누르면 할 게 없다는 게 말이 안 된다"
  const NOW = '2026-11'
  const idsAt = (months: 0 | 12 | 24) =>
    currentTargets(
      STANDARDS_2021,
      INITIAL_OFFSETS.map((o) => (o.domain === '국어' ? { ...o, months } : o)),
      NOW,
    )
      .filter((t) => t.domain === '국어')
      .map((t) => t.id)

  it('적기(0)에는 지금 목표만 있다', () => {
    const ids = idsAt(0)
    expect(ids).toContain('int-ko-listen') // 지금
    expect(ids).not.toContain('int-ko-letter-sounds') // 아직 아님
  })

  it('⭐ 1년 선행하면 지금 목표가 사라지지 않는다 — 그 위에 다음 것이 얹힌다', () => {
    const ids = idsAt(12)
    expect(ids).toContain('int-ko-listen') // 지금 것 유지
    expect(ids).toContain('int-ko-letter-sounds') // 1년치 추가
  })

  it('⭐ 2년 선행하면 더 얹힌다 — 지금 + 1년 + 2년', () => {
    const ids = idsAt(24)
    expect(ids).toContain('int-ko-listen') // 지금
    expect(ids).toContain('int-ko-letter-sounds') // 1년
    expect(ids).toContain('int-ko-read-simple-words') // 2년(취학직전 후반)
  })

  it('⭐ 목표 수는 선행할수록 늘어난다 (줄지 않는다)', () => {
    // 데이터가 3단계뿐이라 1년 지평이 이미 마지막 단계까지 닿으면 12=24가 될 수 있다.
    // 핵심은 "줄지 않는다" — 초판 버그는 선행할수록 줄어드는 것이었다.
    expect(idsAt(12).length).toBeGreaterThan(idsAt(0).length)
    expect(idsAt(24).length).toBeGreaterThanOrEqual(idsAt(12).length)
  })

  it('⭐ 국어를 2년 선행해도 "기준밖"이 되지 않는다 — 목표가 0이 아니다', () => {
    // 초판 버그: 2년 선행 시 목표가 전부 밀려나 0이 되고 "목표 없이 하는중(초과)"으로 떴다
    expect(idsAt(24).length).toBeGreaterThan(0)
  })

  it('자체 기준(영어)은 오프셋과 무관하게 자기 시기에 뜬다 (INV-PACE-02)', () => {
    for (const months of [0, 12, 24] as const) {
      const ids = currentTargets(
        STANDARDS_2021,
        [{ domain: '국어', months }],
        NOW,
      ).map((t) => t.id)
      expect(ids).toContain('own-en-listen-picturebook')
    }
  })

  it('이미 지나간 목표는 실제 현재 기준으로 빠진다', () => {
    // 과거에 끝난 구간의 목표는 아무리 선행해도 다시 뜨지 않는다.
    // (현재 데이터엔 과거 구간이 없어 회귀 방지용 경계만 확인)
    const ids = currentTargets(STANDARDS_2021, INITIAL_OFFSETS, '2030-06')
    expect(ids.every((t) => t.baselinePeriod.end >= '2030-06')).toBe(true)
  })
})
