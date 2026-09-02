/**
 * 표시 라벨 — 도메인 값을 사람 말로 옮기는 것뿐이다 (판단하지 않는다, INV-UI-00).
 * 오늘·현황 화면이 함께 쓴다.
 */

import type { Provenance } from '../../domain/types'

/** 출처 배지 문구. 피드백 ④ · docs/07 §11 */
export function provenanceLabel(p: Provenance): string {
  if (p.kind === '자체') return '자체 목표'
  return p.doc === '누리과정' ? '공교육·누리과정' : '공교육·성취기준'
}
