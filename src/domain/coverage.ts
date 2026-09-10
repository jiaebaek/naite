/**
 * 영역 커버리지 (F3 · P-6). docs/07-계약.md §3
 *
 * "모든 영역에서 다 하고 있는지 확인하고 싶어서 이걸 정리하는 것" — 이 앱을 만드는 이유.
 *
 * ⭐ 챙김은 **활동이 명시적으로 겨냥한 특정 목표**로만 판정한다(2026-09 결정 · docs/10 배선).
 *    "학원 넣으면 그 영역 전체 챙김"(영역-whole 자동커버)은 폐기했다 — 태권도로 예체능 전부를
 *    챙김 처리하는 것은 오버클레임(신뢰① 보수적 과소청구 위반). 활동은 프리셋이 제안하고
 *    부모가 확인한 목표(targetIds)만 챙긴다. 등원(coversDomains)은 커버리지 산정에 쓰지 않는다.
 */

import type { Activity, Standard, StandardId } from './types'

/** 한 목표의 상태 (현황 세그먼트·배지용). 점수가 아니라 상태다. */
export type GoalStatus = '됨' | '챙기는중' | '활동필요'

/**
 * 이 **공교육/자체 목표**를 명시적으로 겨냥하는 활성 활동들.
 *   ① 이 목표를 직접 겨냥하는 활동('활동 연결'·셋업 프리셋 확정), 또는
 *   ② 이 목표를 refines 하는 목표를 겨냥하는 활동(현재는 거의 없음 · 방어적으로 유지).
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
 * B′ — 공교육/자체 목표 하나의 상태. 같은 3값·같은 원칙(INV-COV-05).
 *   됨       — 부모가 '됨' 표시
 *   챙기는중 — 이 목표를 **명시적으로 겨냥하는** 활성 활동이 있다(프리셋 확정·활동 연결·라이브러리).
 *   활동필요 — 그 외(갭)
 *
 * ⚠️ 활동이 아무리 이 목표를 겨냥해도 '됨'을 만들지 않는다 — 됨은 부모의 별도 관찰(achieved)뿐.
 *    (2축 불변식: 챙김 ≠ 이룸)
 */
export function publicGoalStatusOf(
  goalId: StandardId,
  achieved: readonly StandardId[],
  activities: readonly Activity[],
  standards: readonly Standard[],
): GoalStatus {
  if (achieved.includes(goalId)) return '됨'
  if (coveringActivities(goalId, activities, standards).length > 0) return '챙기는중'
  return '활동필요'
}
