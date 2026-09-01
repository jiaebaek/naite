/**
 * 활동 (F2 · P-2). docs/07-계약.md §2-A
 *
 * ⚠️ Activity 에는 `nature` 필드가 없다 (INV-ACT-02). 파생값이므로 nature.ts 에서 계산한다.
 *
 * ⚠️ INV-ACT-05 / OOS-1 — `owner` 는 **표시 전용**이다.
 *    이 모듈은 owner 를 근거로 알림·할당·요구를 만드는 함수를 **의도적으로 제공하지 않는다.**
 *    tests/architecture.test.ts 가 그 부재를 검증한다.
 *    여기에 notify/assign/remind 계열을 추가하면 X-4(실패 조건)에 해당한다.
 */

import { requireNonEmptyName, requireValidCadence, requireValidTargets } from './guards'
import type { Activity, ActivityInput, Cadence, Owner, Standard, StandardId } from './types'

/**
 * INV-ACT-01 name 은 공백일 수 없다
 * INV-ACT-02 결과에 nature 키가 존재하지 않는다
 * INV-ACT-03 '요일지정' 이면 weekdays 가 비어있지 않다
 * INV-ACT-04 '주N회' 이면 1 <= times <= 7
 * INV-ACT-06 targetIds 는 존재하는 Standard 를 가리킨다
 * INV-ACT-07 targetIds 의 Standard.domain === input.domain
 * INV-ACT-08 targetIds 는 비어 있을 수 있다
 *
 * @throws DomainError E-ACT-EMPTY-NAME | E-ACT-EMPTY-WEEKDAYS | E-ACT-INVALID-TIMES
 *                   | E-ACT-TARGET-NOT-FOUND | E-ACT-TARGET-DOMAIN-MISMATCH
 */
export function createActivity(
  input: ActivityInput,
  standards: readonly Standard[],
  newId: () => string,
): Activity {
  requireNonEmptyName(input.name)
  requireValidCadence(input.cadence)
  requireValidTargets(input, standards)

  return {
    id: newId(),
    name: input.name,
    domain: input.domain,
    track: input.track,
    targetIds: [...input.targetIds],
    cadence: input.cadence,
    owner: input.owner,
    active: true,
  }
}

/**
 * 겨냥하는 목표를 바꾼다. 이 연산 하나로 nature 와 커버리지가 동시에 달라진다.
 * @throws DomainError E-ACT-TARGET-NOT-FOUND | E-ACT-TARGET-DOMAIN-MISMATCH
 */
export function retarget(
  activity: Activity,
  targetIds: readonly StandardId[],
  standards: readonly Standard[],
): Activity {
  requireValidTargets({ domain: activity.domain, targetIds }, standards)
  return { ...activity, targetIds: [...targetIds] }
}

/**
 * 삭제하지 않고 비활성화한다 — 지우면 지난 Completion 이 고아가 된다.
 */
export function deactivate(activity: Activity): Activity {
  return { ...activity, active: false }
}

/**
 * INV-ACT-09 — 이름만 바꾼다. id·domain·targetIds·active 는 보존.
 * @throws DomainError E-ACT-EMPTY-NAME
 */
export function rename(activity: Activity, name: string): Activity {
  requireNonEmptyName(name)
  return { ...activity, name }
}

/**
 * INV-ACT-10 — 주기만 바꾼다. 나머지는 보존.
 * @throws DomainError E-ACT-EMPTY-WEEKDAYS | E-ACT-INVALID-TIMES
 */
export function reschedule(activity: Activity, cadence: Cadence): Activity {
  requireValidCadence(cadence)
  return { ...activity, cadence }
}

/**
 * 담당만 바꾼다. owner 는 표시 전용이라 검증이 없다 (INV-ACT-05).
 */
export function setOwner(activity: Activity, owner: Owner): Activity {
  return { ...activity, owner }
}
