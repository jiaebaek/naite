/**
 * ARRR 사이클 #19 — RED
 * 대상: src/domain/provenance.ts
 * 계약: docs/07-계약.md §11 · 피드백 ④("공교육 기준인지 표시")
 */

import { describe, it, expect } from 'vitest'
import { provenanceOf, isPublicProvenance } from '../../src/domain/provenance'
import { STANDARDS_2021 } from '../../src/domain/standards/child2021'
import type { Standard } from '../../src/domain/types'

const find = (id: string): Standard => {
  const s = STANDARDS_2021.find((x) => x.id === id)
  if (!s) throw new Error(`no standard ${id}`)
  return s
}

describe('provenanceOf — 공교육(누리과정/성취기준) 판정', () => {
  it('누리과정 원문 → 공교육·누리과정', () => {
    expect(provenanceOf(find('nuri-com-1'), STANDARDS_2021)).toEqual({ kind: '공교육', doc: '누리과정' })
  })

  it('초1~2 성취기준 원문 → 공교육·성취기준', () => {
    expect(provenanceOf(find('std-2국04-01'), STANDARDS_2021)).toEqual({ kind: '공교육', doc: '성취기준' })
  })
})

describe('provenanceOf — refines 를 따라 공교육으로 귀속 (INV-STD-07/08)', () => {
  // 해석 계층은 제거됐지만 refines 귀속 로직은 남는다(로컬 픽스처로 검증).
  it('성취기준을 refine 하는 목표 → 공교육·성취기준', () => {
    const 해석: Standard = {
      id: 'int-x', domain: '국어', baselinePeriod: { start: '2027-03', end: '2027-08' },
      statement: '자음·모음의 소릿값을 안다', source: { document: '04' }, origin: '해석', refines: 'std-2국04-01',
    }
    expect(provenanceOf(해석, STANDARDS_2021)).toEqual({ kind: '공교육', doc: '성취기준' })
  })

  it('누리과정을 refine 하는 목표 → 공교육·누리과정', () => {
    const 해석: Standard = {
      id: 'int-y', domain: '수학', baselinePeriod: { start: '2026-08', end: '2027-02' },
      statement: '반복 규칙을 이어간다', source: { document: '04' }, origin: '해석', refines: 'nuri-nat-8',
    }
    expect(provenanceOf(해석, STANDARDS_2021)).toEqual({ kind: '공교육', doc: '누리과정' })
  })
})

describe('provenanceOf — 자체', () => {
  it('origin=자체 → 자체 (doc 없음)', () => {
    // 자체 목표(영어 등)는 이제 코드가 아니라 부모 입력이라 로컬 픽스처로 판정한다
    const 자체영어: Standard = {
      id: 'own-en', domain: '영어', baselinePeriod: { start: '2000-01', end: '2099-12' },
      statement: '영어 그림책 읽기', source: null, origin: '자체',
    }
    expect(provenanceOf(자체영어, STANDARDS_2021)).toEqual({ kind: '자체' })
  })

  it('⭐ 근거(refines) 없는 목표는 자체로 본다', () => {
    const 근거없음: Standard = {
      id: 'int-z', domain: '건강·안전', baselinePeriod: { start: '2027-09', end: '2028-02' },
      statement: '40분간 자리에 앉아 있는다', source: { document: '04' }, origin: '해석',
    }
    expect(provenanceOf(근거없음, STANDARDS_2021)).toEqual({ kind: '자체' })
  })
})

describe('isPublicProvenance', () => {
  it('공교육이면 true, 자체면 false', () => {
    expect(isPublicProvenance({ kind: '공교육', doc: '누리과정' })).toBe(true)
    expect(isPublicProvenance({ kind: '자체' })).toBe(false)
  })
})
