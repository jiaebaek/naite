/**
 * Nature 파생 규칙 (F1 · F2). docs/07-계약.md §2-B
 *
 * ⚠️ nature 는 저장되지 않는다. Activity.targetIds 로부터 매번 계산된다. (INV-ACT-02)
 *    사용자는 성격을 고르지 않는다. "겨냥하는 목표"만 선택하고, 성격은 여기서 나온다.
 */

import type { Activity, Nature, Standard } from './types'

/**
 * INV-NAT-01 결과는 항상 '필수' | '자체목표' | '자유'
 * INV-NAT-02 targetIds 가 비어 있으면 반드시 '자유'
 * INV-NAT-03 공교육/해석 기준이 하나라도 연결되면 '필수' (자체와 섞여도 '필수' 우선)
 * INV-NAT-04 순수 함수 — 같은 입력이면 항상 같은 출력, 입력을 변경하지 않는다
 */
export function deriveNature(
  activity: Pick<Activity, 'targetIds'>,
  standards: readonly Standard[],
): Nature {
  const linked = standards.filter((s) => activity.targetIds.includes(s.id))

  if (linked.length === 0) return '자유'

  // INV-NAT-03 — 공교육 대응이 더 강한 사실이므로 우선한다
  if (linked.some((s) => s.origin === '공교육' || s.origin === '해석')) return '필수'

  return '자체목표'
}

/**
 * INV-NAT-05 — '자체목표'·'자유' 의 미완료는 경고색으로 표시하지 않는다. (C-6 / X-3)
 *
 * 도메인이 이 판단을 소유한다. UI 가 색을 자의적으로 정하면 C-6 가 언제든 깨진다.
 */
export function shouldWarnOnMiss(nature: Nature): boolean {
  return nature === '필수'
}
