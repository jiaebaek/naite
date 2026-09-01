/**
 * ARRR 사이클 #4 — RED
 * 대상: src/domain/nature.ts
 * 계약: docs/07-계약.md §2-B
 *
 * nature 는 저장되지 않는다. targetIds 에서 파생된다.
 * 사용자는 성격을 고르지 않고 "겨냥하는 목표"만 선택한다.
 */

import { describe, it, expect } from 'vitest'
import { deriveNature, shouldWarnOnMiss } from '../../src/domain/nature'
import type { Standard } from '../../src/domain/types'

const 공교육기준: Standard = {
  id: 'std-public',
  domain: '국어',
  baselinePeriod: { start: '2028-03', end: '2030-02' },
  statement: '한글 자모의 이름과 소릿값을 알고 정확하게 발음하고 쓴다.',
  source: { document: '별책 5 국어과', code: '2국04-01' },
  origin: '공교육',
}

const 해석기준: Standard = {
  id: 'int-ours',
  domain: '국어',
  baselinePeriod: { start: '2027-09', end: '2028-02' },
  statement: '받침 없는 단어를 소리 내어 읽는다',
  source: { document: '04 문서' },
  origin: '해석',
}

const 자체기준: Standard = {
  id: 'own-english',
  domain: '영어',
  baselinePeriod: { start: '2026-09', end: '2027-02' },
  statement: '영어 그림책 한 권을 끝까지 듣는다',
  source: null,
  origin: '자체',
}

const ALL = [공교육기준, 해석기준, 자체기준]

describe('INV-NAT-02 — targetIds 가 비면 반드시 "추가"', () => {
  it('목표를 겨냥하지 않는 활동은 추가다', () => {
    expect(deriveNature({ targetIds: [] }, ALL)).toBe('자유')
  })

  it('기준 목록이 비어 있어도 추가다', () => {
    expect(deriveNature({ targetIds: [] }, [])).toBe('자유')
  })

  it('존재하지 않는 id 만 가리키면 연결된 것이 없으므로 추가다', () => {
    expect(deriveNature({ targetIds: ['없는id'] }, ALL)).toBe('자유')
  })
})

describe('INV-NAT-03 — 공교육/해석이 연결되면 "적기"', () => {
  it('해석 기준에 연결되면 적기다', () => {
    expect(deriveNature({ targetIds: ['int-ours'] }, ALL)).toBe('필수')
  })

  it('공교육 기준에 연결되어도 적기다', () => {
    expect(deriveNature({ targetIds: ['std-public'] }, ALL)).toBe('필수')
  })

  it('⭐ 자체 기준과 섞여 있어도 적기가 우선이다', () => {
    expect(deriveNature({ targetIds: ['own-english', 'int-ours'] }, ALL)).toBe('필수')
    expect(deriveNature({ targetIds: ['int-ours', 'own-english'] }, ALL)).toBe('필수')
  })
})

describe('자체 기준만 연결되면 "자체목표"', () => {
  it('영어처럼 공교육 기준이 없는 영역의 활동', () => {
    expect(deriveNature({ targetIds: ['own-english'] }, ALL)).toBe('자체목표')
  })
})

describe('INV-NAT-04 — deriveNature 는 순수 함수다', () => {
  it('같은 입력이면 항상 같은 출력', () => {
    const input = { targetIds: ['int-ours'] }
    const results = Array.from({ length: 5 }, () => deriveNature(input, ALL))
    expect(new Set(results).size).toBe(1)
  })

  it('입력을 변경하지 않는다', () => {
    const input = { targetIds: ['int-ours'] }
    const before = JSON.stringify(input)
    deriveNature(input, ALL)
    expect(JSON.stringify(input)).toBe(before)
  })
})

describe('INV-NAT-05 — 자체목표·추가의 미완료는 경고하지 않는다 (C-6 / X-3)', () => {
  it('적기만 경고한다', () => {
    expect(shouldWarnOnMiss('필수')).toBe(true)
  })

  it('⭐ 자체목표는 경고하지 않는다 — 우리가 정한 목표는 우리가 조정할 수 있다', () => {
    expect(shouldWarnOnMiss('자체목표')).toBe(false)
  })

  it('⭐ 추가는 경고하지 않는다 — "어제는 영상을 빼먹었어"는 기준 위반이 아니다', () => {
    expect(shouldWarnOnMiss('자유')).toBe(false)
  })

  it('경고 대상은 셋 중 하나뿐이다 — 죄책감 생성기가 되지 않는다', () => {
    const warned = (['필수', '자체목표', '자유'] as const).filter(shouldWarnOnMiss)
    expect(warned).toEqual(['필수'])
  })
})
