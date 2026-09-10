/**
 * ARRR 사이클 #3 — 데이터 무결성
 * 대상: src/domain/standards/child2021.ts
 *
 * 계약은 코드만이 아니라 **데이터에도** 걸려야 한다.
 * 초판 04 문서에서 원문과 다른 문장 7건이 나온 이유가 이 검증이 없었기 때문이다.
 */

import { describe, it, expect } from 'vitest'
import { STANDARDS_2021 } from '../../src/domain/standards/child2021'
import { requireValidStandard } from '../../src/domain/guards'
import { currentPublicGoals, cohortAlignedMonth } from '../../src/domain/pace'
import { CHILD_BIRTH_YM } from '../../src/domain/standards/child2021'
import { DOMAINS } from '../../src/domain/types'
import type { Standard } from '../../src/domain/types'

// 부모가 앱에서 직접 입력한 영어(자체) 목표를 흉내 낸 픽스처 — 이제 코드에 박혀있지 않다.
const 영어자체: Standard = {
  id: 'own-en-listen-picturebook', domain: '영어',
  baselinePeriod: { start: '2000-01', end: '2099-12' },
  statement: '영어 그림책 한 권을 끝까지 듣는다', source: null, origin: '자체',
}

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
    // 자체 목표는 더 이상 코드에 박혀있지 않다(부모가 입력). 계약(guard)만 확인한다.
    expect(() => requireValidStandard(영어자체, STANDARDS_2021)).not.toThrow()
    expect(영어자체.source).toBeNull()
  })

  it('배포 기준 데이터엔 자체 목표가 없다 — 영어 목표는 부모가 입력한다', () => {
    expect(STANDARDS_2021.some((s) => s.origin === '자체')).toBe(false)
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

describe('⭐ 공교육 기준 전수 완전성 — 만3~초2 (외부 배포 신뢰)', () => {
  const gong = STANDARDS_2021.filter((s) => s.origin === '공교육')
  const countCode = (prefix: string) =>
    gong.filter((s) => (s.source?.code ?? '').startsWith(prefix)).length

  it('2019 누리과정 59개 전수', () => {
    expect(gong.filter((s) => s.id.startsWith('nuri-')).length).toBe(59)
  })

  it('2022 개정 초1~2학년군 성취기준 100개 전수', () => {
    expect(gong.filter((s) => s.id.startsWith('std-')).length).toBe(100)
  })

  it('초1~2 교과별 개수: 국어23 · 수학29 · 바른16 · 슬기16 · 즐생16', () => {
    expect(countCode('2국')).toBe(23)
    expect(countCode('2수')).toBe(29)
    expect(countCode('2바')).toBe(16)
    expect(countCode('2슬')).toBe(16)
    expect(countCode('2즐')).toBe(16)
  })

  it('영어는 공교육 기준이 0개다 (초3 시작 — 취학 전·초1~2 정규 교과 없음)', () => {
    expect(gong.filter((s) => s.domain === '영어').length).toBe(0)
  })

  it('원문 그대로 표본 — 곱셈구구·생태 탐구·학교 생활 습관', () => {
    const find = (id: string) => STANDARDS_2021.find((s) => s.id === id)?.statement
    expect(find('std-2수01-11')).toBe('곱셈구구를 이해하고, 한 자리 수의 곱셈을 할 수 있다.')
    expect(find('std-2슬01-04')).toBe('사람과 자연, 동식물이 어우러져 사는 생태를 탐구한다.')
    expect(find('std-2바01-01')).toBe('학교 생활 습관과 학습 습관을 형성하여 안전하고 건강하게 생활한다.')
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

describe('⭐ B′ currentPublicGoals — 화면 목표는 공교육 원문(+자체)', () => {
  const NOW = '2026-11' // 만 5세 (취학 전) → 누리과정 구간

  it('취학 전이면 누리과정 원문 59개가 모두 지금 목표다 (band 가 지금을 포함)', () => {
    const goals = currentPublicGoals(STANDARDS_2021, NOW)
    const nuri = goals.filter((g) => g.id.startsWith('nuri-'))
    expect(nuri.length).toBe(59)
    expect(goals.map((g) => g.id)).toContain('nuri-com-1') // 의사소통 · 듣기와 말하기
  })

  it('초1~2 성취기준은 아직 목표가 아니다 (band 가 미래 2028-03~)', () => {
    const ids = currentPublicGoals(STANDARDS_2021, NOW).map((g) => g.id)
    expect(ids).not.toContain('std-2국01-01')
  })

  it('부모가 입력한 자체(영어) 목표는 오프셋 없이 지금 목표로 함께 뜬다', () => {
    // 배포 데이터엔 없고, 앱에서 병합된 customGoals(=영어자체)가 화면 목표로 나와야 한다.
    const ids = currentPublicGoals([...STANDARDS_2021, 영어자체], NOW).map((g) => g.id)
    expect(ids).toContain('own-en-listen-picturebook')
  })

  it('입학 후(2028-06)엔 초1~2 성취기준 원문이 지금 목표가 된다', () => {
    const ids = currentPublicGoals(STANDARDS_2021, '2028-06').map((g) => g.id)
    expect(ids).toContain('std-2국04-01') // 한글 자모 소릿값
    expect(ids).not.toContain('nuri-com-1') // 누리 band(~2028-02)는 끝났다
  })

  it('⭐ 시기는 달력이 아니라 입력 나이 기준 — 초1~2 아이는 시스템이 2026이어도 초1~2 목표를 본다', () => {
    // 2019-01 생 아이(지금 만 7세, 초2)를 입력하면 달력이 2026이라도 std-* 가 지금 목표여야 한다.
    const 유효월 = cohortAlignedMonth('2026-09', '2019-01', CHILD_BIRTH_YM)
    const ids = currentPublicGoals(STANDARDS_2021, 유효월).map((g) => g.id)
    expect(ids).toContain('std-2국01-01') // 초1~2 성취기준이 지금 뜬다
    expect(ids).not.toContain('nuri-com-1') // 취학 전 누리는 이제 아니다
  })

  it('같은 코호트(2021-01) 아이는 지금(2026) 누리과정이 뜬다 — 기존 동작 보존', () => {
    const 유효월 = cohortAlignedMonth('2026-09', CHILD_BIRTH_YM, CHILD_BIRTH_YM)
    const ids = currentPublicGoals(STANDARDS_2021, 유효월).map((g) => g.id)
    expect(ids).toContain('nuri-com-1')
    expect(ids).not.toContain('std-2국01-01')
  })
})

