/**
 * 목표의 출처 판정 (Provenance). docs/07-계약.md §11
 *
 * "이거 공교육 기준 맞아?"에 답하기 위한 것 (피드백 ④).
 *   - origin='공교육'  → source.document 로 누리과정/성취기준 구분
 *   - origin='해석'    → refines 가 가리키는 공교육 기준의 문서로 귀속 (INV-STD-07/08)
 *   - origin='자체', 또는 근거(refines) 없는 해석 → 자체
 *
 * ⚠️ 순수 함수. UI 는 이 결과를 라벨로만 바꾼다 (판단하지 않는다, INV-UI-00).
 */

import type { Provenance, Standard } from './types'

/** 공교육 문서명 → 짧은 라벨. 누리과정이 아니면 초1~2 성취기준(2022 개정)이다. */
function docLabel(document: string): '누리과정' | '성취기준' {
  return document.includes('누리과정') ? '누리과정' : '성취기준'
}

/**
 * 한 기준의 출처를 판정한다.
 * @param all 해석이 refines 로 가리키는 공교육 기준을 찾기 위한 전체 목록
 */
export function provenanceOf(standard: Standard, all: readonly Standard[]): Provenance {
  if (standard.origin === '공교육' && standard.source) {
    return { kind: '공교육', doc: docLabel(standard.source.document) }
  }
  if (standard.origin === '해석' && standard.refines) {
    const base = all.find((s) => s.id === standard.refines)
    if (base?.source) return { kind: '공교육', doc: docLabel(base.source.document) }
  }
  return { kind: '자체' }
}

/** 공교육 근거 목표인가 — 대표 목표(요약 줄·배지)를 앞세우는 정렬에 쓴다. */
export function isPublicProvenance(p: Provenance): boolean {
  return p.kind === '공교육'
}
