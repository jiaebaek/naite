/**
 * categoryOf — B′ 내용범주(교육과정 구조) 라벨.
 * 신뢰의 핵심: 우리가 지어낸 분류가 아니라 원문 구조여야 한다.
 */
import { describe, it, expect } from 'vitest'
import { categoryOf } from '../../src/domain/category'
import { STANDARDS_2021 } from '../../src/domain/standards/child2021'
import type { Standard } from '../../src/domain/types'

const byId = (id: string): Standard => {
  const s = STANDARDS_2021.find((x) => x.id === id)
  if (!s) throw new Error(`no standard ${id}`)
  return s
}

describe('누리과정 — 내용범주 원문을 그대로 반환한다 (source.code)', () => {
  it('의사소통 · 듣기와 말하기', () => {
    expect(categoryOf(byId('nuri-com-1'))).toBe('의사소통 · 듣기와 말하기')
  })
  it('자연탐구 · 자연과 더불어 살기', () => {
    expect(categoryOf(byId('nuri-nat-11'))).toBe('자연탐구 · 자연과 더불어 살기')
  })
})

describe('초1~2 국어·수학 — 코드로 확정된 영역명만 붙인다', () => {
  it('2국02-01 → 국어 · 읽기', () => {
    expect(categoryOf(byId('std-2국02-01'))).toBe('국어 · 읽기')
  })
  it('2국04-01 → 국어 · 문법', () => {
    expect(categoryOf(byId('std-2국04-01'))).toBe('국어 · 문법')
  })
  it('2수01-01 → 수학 · 수와 연산', () => {
    expect(categoryOf(byId('std-2수01-01'))).toBe('수학 · 수와 연산')
  })
  it('2수03-07 → 수학 · 도형과 측정', () => {
    expect(categoryOf(byId('std-2수03-07'))).toBe('수학 · 도형과 측정')
  })
})

describe('초1~2 통합교과 — 하위 영역명을 지어내지 않고 교과명만 쓴다', () => {
  it('2바01-01 → 바른 생활', () => {
    expect(categoryOf(byId('std-2바01-01'))).toBe('바른 생활')
  })
  it('2슬01-04 → 슬기로운 생활', () => {
    expect(categoryOf(byId('std-2슬01-04'))).toBe('슬기로운 생활')
  })
  it('2즐01-02 → 즐거운 생활', () => {
    expect(categoryOf(byId('std-2즐01-02'))).toBe('즐거운 생활')
  })
})

describe('자체(영어) — 공교육 근거 없음', () => {
  it("origin='자체' 는 '우리 목표' (부모가 입력한 목표)", () => {
    const 자체영어: Standard = {
      id: 'own-en', domain: '영어', baselinePeriod: { start: '2000-01', end: '2099-12' },
      statement: '영어 그림책 읽기', source: null, origin: '자체',
    }
    expect(categoryOf(자체영어)).toBe('우리 목표')
  })
})
