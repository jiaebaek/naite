/**
 * 영역 커버리지 (F3 · P-6). docs/07-계약.md §3
 *
 * "모든 영역에서 다 하고 있는지 확인하고 싶어서 이걸 정리하는 것" — 이 앱을 만드는 이유.
 */

import { requireKnownDomain } from './guards'
import { DOMAINS } from './types'
import type { Activity, Coverage, Domain, Standard } from './types'

/**
 * INV-COV-01 결과는 항상 4값 중 하나
 * INV-COV-02 활성 활동 0개 → 반드시 '비어있음'
 * INV-COV-03 활성 활동 1개 이상 → 절대 '비어있음' 아님
 * INV-COV-04 목표 0개인 영역에 활동이 있으면 '기준밖' ('하는중' 불가)
 * INV-COV-06 자체 기준을 세우면 '기준밖'에서 벗어날 수 있다
 * INV-COV-07 판정은 targetIds(실제 연결)에 근거한다. nature 라벨을 참조하지 않는다
 *
 * ⚠️ INV-COV-05 — 이 함수는 Completion(수행 이력)을 **매개변수로 받지 않는다.**
 *    커버리지는 "계획이 있는가"이지 "잘 했는가"가 아니다.
 *    며칠 빠뜨렸다고 영역이 '비어있음'으로 떨어지면 이 화면은 성적표가 된다 (C-6 / X-3).
 *    시그니처를 바꾸려 할 때 이 주석을 먼저 읽을 것.
 *
 * @throws DomainError E-COV-UNKNOWN-DOMAIN
 */
export function evaluateCoverage(
  domain: Domain,
  currentTargets: readonly Standard[],
  activities: readonly Activity[],
): Coverage {
  requireKnownDomain(domain)

  const active = activities.filter((a) => a.domain === domain && a.active)

  // INV-COV-08 — 목표도 활동도 없으면 '아직아님'. 아직 시기가 아닌 것이지 빠뜨린 게 아니다 (C-6).
  if (active.length === 0) return currentTargets.length === 0 ? '아직아님' : '비어있음'
  if (currentTargets.length === 0) return '기준밖'

  const targetIds = new Set(currentTargets.map((t) => t.id))
  const covers = active.some((a) => a.targetIds.some((id) => targetIds.has(id)))

  return covers ? '하는중' : '연결필요'
}

/**
 * 전 영역 커버리지 한 번에. F3 영역 현황판의 데이터 소스.
 * INV-TASK-07 과 함께 C-2(한 화면)를 보장한다 — 영역은 5개를 넘지 않는다.
 */
export function evaluateAllCoverage(
  targetsByDomain: ReadonlyMap<Domain, readonly Standard[]>,
  activities: readonly Activity[],
): ReadonlyMap<Domain, Coverage> {
  return new Map(
    DOMAINS.map((d) => [d, evaluateCoverage(d, targetsByDomain.get(d) ?? [], activities)]),
  )
}
