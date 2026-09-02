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

describe('provenanceOf — 해석은 refines 를 따라 공교육으로 귀속 (INV-STD-07/08)', () => {
  it('성취기준을 refine 하는 해석 → 공교육·성취기준', () => {
    // int-ko-letter-sounds → std-2국04-01 (국어과 성취기준)
    expect(provenanceOf(find('int-ko-letter-sounds'), STANDARDS_2021)).toEqual({
      kind: '공교육',
      doc: '성취기준',
    })
  })

  it('누리과정을 refine 하는 해석 → 공교육·누리과정', () => {
    // int-ma-pattern → nuri-nat-8 (누리과정)
    expect(provenanceOf(find('int-ma-pattern'), STANDARDS_2021)).toEqual({
      kind: '공교육',
      doc: '누리과정',
    })
  })
})

describe('provenanceOf — 자체', () => {
  it('origin=자체 → 자체 (doc 없음)', () => {
    expect(provenanceOf(find('own-en-listen-picturebook'), STANDARDS_2021)).toEqual({ kind: '자체' })
  })

  it('⭐ 근거(refines) 없는 해석은 자체로 본다', () => {
    // int-hs-sit-40min 은 refines 가 없다 (누리과정 원문에 없는 해석)
    expect(provenanceOf(find('int-hs-sit-40min'), STANDARDS_2021)).toEqual({ kind: '자체' })
  })
})

describe('isPublicProvenance', () => {
  it('공교육이면 true, 자체면 false', () => {
    expect(isPublicProvenance({ kind: '공교육', doc: '누리과정' })).toBe(true)
    expect(isPublicProvenance({ kind: '자체' })).toBe(false)
  })
})
