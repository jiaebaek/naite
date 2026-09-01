/**
 * ARRR 사이클 #12 — RED
 * 대상: src/domain/gate.ts
 * 계약: docs/07-계약.md §2-C
 *
 * ⭐ 선행 압박을 구조적으로 막는다.
 *    오프셋은 자유 다이얼이 아니라 아이가 해내야 열리는 문이다.
 */

import { describe, it, expect } from 'vitest'
import { offsetGate, requiredForOffset } from '../../src/domain/gate'
import type { Standard } from '../../src/domain/types'

// 국어 3단계 사다리
const mk = (id: string, start: string, end: string): Standard => ({
  id,
  domain: '국어',
  baselinePeriod: { start, end },
  statement: id,
  source: { document: '04' },
  origin: '해석',
})

const 지금A = mk('now-a', '2026-08', '2027-02')
const 지금B = mk('now-b', '2026-08', '2027-02')
const 전반A = mk('h1-a', '2027-03', '2027-08')
// now(2026-11) + 12개월 지평(2027-11) 밖 — 2년치 목표
const 후반A = mk('h2-a', '2028-03', '2028-08')
const STANDARDS = [지금A, 지금B, 전반A, 후반A]
const NOW = '2026-11'

describe('requiredForOffset — 상향에 필요한 목표', () => {
  it('INV-GATE-01 — 적기(0)는 요구가 없다', () => {
    expect(requiredForOffset('국어', 0, STANDARDS, NOW)).toEqual([])
  })

  it('1년 선행은 적기(0) 목표를 요구한다', () => {
    const ids = requiredForOffset('국어', 12, STANDARDS, NOW).map((s) => s.id)
    expect(ids).toContain('now-a')
    expect(ids).toContain('now-b')
    expect(ids).not.toContain('h1-a') // 전반은 1년 단계라 아직 요구 아님
  })

  it('2년 선행은 1년 단계 목표(지금+전반)를 요구한다', () => {
    const ids = requiredForOffset('국어', 24, STANDARDS, NOW).map((s) => s.id)
    expect(ids).toContain('now-a')
    expect(ids).toContain('h1-a')
  })

  it('다른 영역 목표는 요구에 섞이지 않는다', () => {
    const 수학목표 = { ...지금A, id: 'math', domain: '수학' as const }
    const ids = requiredForOffset('국어', 12, [...STANDARDS, 수학목표], NOW).map((s) => s.id)
    expect(ids).not.toContain('math')
  })
})

describe('INV-GATE-03 — 아래 단계를 전부 달성해야 상향이 열린다', () => {
  it('⭐ 적기 목표를 하나도 달성 안 하면 1년 선행은 잠긴다', () => {
    const gate = offsetGate('국어', 12, STANDARDS, [], NOW)
    expect(gate.allowed).toBe(false)
    expect(gate.unmet.map((s) => s.id)).toEqual(['now-a', 'now-b'])
  })

  it('⭐ 일부만 달성하면 아직 잠겨 있다', () => {
    const gate = offsetGate('국어', 12, STANDARDS, ['now-a'], NOW)
    expect(gate.allowed).toBe(false)
    expect(gate.unmet.map((s) => s.id)).toEqual(['now-b'])
  })

  it('⭐ 적기 목표를 전부 달성하면 1년 선행이 열린다', () => {
    const gate = offsetGate('국어', 12, STANDARDS, ['now-a', 'now-b'], NOW)
    expect(gate.allowed).toBe(true)
    expect(gate.unmet).toEqual([])
  })

  it('2년 선행은 지금+전반을 전부 달성해야 열린다', () => {
    const 지금만 = offsetGate('국어', 24, STANDARDS, ['now-a', 'now-b'], NOW)
    expect(지금만.allowed).toBe(false)
    expect(지금만.unmet.map((s) => s.id)).toContain('h1-a')

    const 전부 = offsetGate('국어', 24, STANDARDS, ['now-a', 'now-b', 'h1-a'], NOW)
    expect(전부.allowed).toBe(true)
  })
})

describe('INV-GATE-01 / 02 — 적기와 하향은 언제나 가능', () => {
  it('적기(0)는 달성이 하나도 없어도 허용', () => {
    expect(offsetGate('국어', 0, STANDARDS, [], NOW).allowed).toBe(true)
  })
})

describe('INV-GATE-04 — Completion 이 아니라 Achievement 를 본다', () => {
  it('offsetGate 는 completions 를 인자로 받지 않는다 — 시그니처로 보장', () => {
    // 매일 체크로 선행을 열면 "하루 했다고 선행"이 되어버린다.
    expect(offsetGate.length).toBe(5) // domain, targetOffset, standards, achieved, now
  })
})

describe('INV-GATE-05 — 아래 단계 목표가 0개면 상향 허용', () => {
  it('요구 목표가 없으면 진공에서 막지 않는다', () => {
    // now 를 한참 뒤로 두어 적기 목표가 이미 다 지난 상황
    const gate = offsetGate('국어', 12, STANDARDS, [], '2030-01')
    expect(gate.required).toEqual([])
    expect(gate.allowed).toBe(true)
  })
})
