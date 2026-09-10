/**
 * 영역 커버리지 (F3 · P-6). docs/07-계약.md §3
 *
 * "모든 영역에서 다 하고 있는지 확인하고 싶어서 이걸 정리하는 것" — 이 앱을 만드는 이유.
 */

import type { Activity, Domain, Standard, StandardId } from './types'

/** 한 목표의 상태 (현황 세그먼트·배지용). 점수가 아니라 상태다. */
export type GoalStatus = '됨' | '챙기는중' | '활동필요'

/**
 * 이 **공교육/자체 목표**를 명시적으로 겨냥하는 활성 활동들.
 *   ① 이 목표를 직접 겨냥하는 활동('활동 연결'), 또는
 *   ② 이 목표를 refines 하는 목표를 겨냥하는 활동(현재는 거의 없음 · 방어적으로 유지).
 * 영역 단위 챙김은 domainHasActivity 가 따로 본다.
 */
export function coveringActivities(
  goalId: StandardId,
  activities: readonly Activity[],
  standards: readonly Standard[],
): readonly Activity[] {
  const aim = new Set<StandardId>([goalId])
  for (const s of standards) if (s.refines === goalId) aim.add(s.id)
  return activities.filter((a) => a.active && a.targetIds.some((id) => aim.has(id)))
}

/**
 * 영역 단위 챙김 — 이 영역에 활성 활동/등원이 하나라도 있으면 그 영역은 챙겨지고 있다.
 *
 * ⚠️ 일반 앱의 핵심: 학부모는 **영역 단위**로 학원·활동을 넣는다("우리 국어 챙겨요").
 *    특정 아이용으로 손으로 쓴 '해석'(2021-01 전용)에 의존하지 않고, 활동의 domain 만 본다.
 *    → 어떤 생년월의 아이든, 넣은 학원·활동이 그 영역 목표에 곧바로 반영된다.
 */
export function domainHasActivity(
  domain: Domain,
  activities: readonly Activity[],
): boolean {
  return activities.some((a) => a.active && a.domain === domain)
}

/**
 * B′ — 공교육/자체 목표 하나의 상태. 같은 3값·같은 원칙(INV-COV-05).
 *   됨       — 부모가 '됨' 표시
 *   챙기는중 — ① 이 목표를 명시적으로 겨냥하는 활동이 있거나(활동 연결·라이브러리),
 *              ② 이 목표의 **영역**에 활성 활동/등원이 있다(영역 단위, 일반).
 *   활동필요 — 그 외(갭)
 */
export function publicGoalStatusOf(
  goalId: StandardId,
  achieved: readonly StandardId[],
  activities: readonly Activity[],
  standards: readonly Standard[],
): GoalStatus {
  if (achieved.includes(goalId)) return '됨'
  if (coveringActivities(goalId, activities, standards).length > 0) return '챙기는중'
  const goal = standards.find((s) => s.id === goalId)
  if (goal !== undefined && domainHasActivity(goal.domain, activities)) return '챙기는중'
  return '활동필요'
}
