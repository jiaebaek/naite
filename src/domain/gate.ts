/**
 * 달성 기반 선행 잠금 (F3). docs/07-계약.md §2-C
 *
 * ⭐ 선행 압박을 구조적으로 막는다.
 *    오프셋은 자유 다이얼이 아니라 아이가 해내야 열리는 문이다.
 *
 * ⚠️ 이 모듈은 Completion(매일 체크)을 보지 않는다. Achievement(달성)만 본다 (INV-GATE-04).
 *    매일 체크로 선행을 열면 "하루 했다고 선행"이 되어버린다.
 */

import { currentTargets } from './pace'
import type {
  Domain,
  OffsetMonths,
  Standard,
  StandardId,
  YearMonth,
} from './types'

export interface OffsetGateResult {
  readonly allowed: boolean
  /** 상향에 필요한 목표 */
  readonly required: readonly Standard[]
  /** 그중 아직 달성하지 않은 것 */
  readonly unmet: readonly Standard[]
}

/**
 * INV-GATE-01 적기(0)는 요구가 없다
 * 1년 선행 → 적기(0) 단계의 현재 목표
 * 2년 선행 → 1년(12) 단계의 현재 목표
 */
export function requiredForOffset(
  domain: Domain,
  targetOffset: OffsetMonths,
  standards: readonly Standard[],
  now: YearMonth,
): readonly Standard[] {
  if (targetOffset === 0) return []

  const belowOffset: OffsetMonths = targetOffset === 24 ? 12 : 0
  return currentTargets(standards, [{ domain, months: belowOffset }], now).filter(
    (s) => s.domain === domain,
  )
}

/**
 * INV-GATE-03 아래 단계를 전부 달성해야 상향이 열린다
 * INV-GATE-05 요구 목표가 0개면 허용 (진공에서 막지 않는다)
 */
export function offsetGate(
  domain: Domain,
  targetOffset: OffsetMonths,
  standards: readonly Standard[],
  achieved: readonly StandardId[],
  now: YearMonth,
): OffsetGateResult {
  const required = requiredForOffset(domain, targetOffset, standards, now)
  const achievedSet = new Set(achieved)
  const unmet = required.filter((s) => !achievedSet.has(s.id))

  return { allowed: unmet.length === 0, required, unmet }
}
