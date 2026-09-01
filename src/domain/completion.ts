/**
 * 수행 기록 (F1 · P-1). docs/07-계약.md §5
 */

import { requireNotFuture } from './guards'
import { DomainError } from './errors'
import type { ActivityId, Completion, IsoDate, ToggleResult } from './types'

/**
 * 탭 1회로 완료·해제. 확인 다이얼로그 없음. 추가 입력 없음.
 *
 * INV-COMP-01 (date, activityId) 조합은 유일하다
 * INV-COMP-02 미래 날짜에는 기록할 수 없다
 * INV-COMP-03 토글은 멱등이 아니다 — 없으면 생성, 있으면 해제
 * INV-COMP-04 기록 생성에 추가 입력을 요구하지 않는다 (memo 는 선택) — C-3 / X-2
 *
 * ⚠️ 이 함수에 memo 인자를 추가하지 말 것. 입력이 늘면 "3초 이내"가 깨지고,
 *    냉장고에 붙인 종이에 진다 (C-5).
 *
 * @throws DomainError E-COMP-FUTURE-DATE
 */
export function toggleCompletion(
  activityId: ActivityId,
  date: IsoDate,
  existing: Completion | null,
  today: IsoDate,
): ToggleResult {
  requireNotFuture(date, today)

  if (existing === null) {
    return { kind: 'created', completion: { activityId, date } }
  }
  return { kind: 'removed', activityId, date }
}

/**
 * INV-COMP-01 — 저장 전 중복 검사.
 * @throws DomainError E-COMP-DUPLICATE
 */
export function requireNoDuplicate(
  activityId: ActivityId,
  date: IsoDate,
  completions: readonly Completion[],
): void {
  if (findCompletion(activityId, date, completions) !== null) {
    throw new DomainError(
      'E-COMP-DUPLICATE',
      `이미 기록이 있습니다: ${activityId} @ ${date}`,
    )
  }
}

export function findCompletion(
  activityId: ActivityId,
  date: IsoDate,
  completions: readonly Completion[],
): Completion | null {
  return (
    completions.find((c) => c.activityId === activityId && c.date === date) ?? null
  )
}
