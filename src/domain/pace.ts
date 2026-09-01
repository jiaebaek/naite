/**
 * 선행 오프셋 (F3 · P-3). docs/07-계약.md §1
 *
 *   우리 집 목표 시기 = Standard.baselinePeriod − PaceOffset(domain)
 */

import { requireValidOffsetMonths } from './guards'
import type {
  Domain,
  OffsetMonths,
  OffsetWarning,
  PaceOffset,
  Period,
  Standard,
  YearMonth,
} from './types'

const NOT_IMPLEMENTED = 'NOT_IMPLEMENTED'

/**
 * INV-PACE-01 months ∈ {0,12,24}
 * INV-PACE-03 영역당 오프셋은 0개 또는 1개
 * @throws DomainError E-PACE-INVALID-MONTHS
 */
export function setPaceOffset(domain: Domain, months: number): PaceOffset {
  // assertion 가드라 이 아래에서 months 는 OffsetMonths 로 좁혀진다 — 캐스팅 불필요
  requireValidOffsetMonths(months)
  return { domain, months }
}

/**
 * INV-PACE-04 — 설정되지 않은 영역의 실효 오프셋은 0 이다.
 */
export function effectiveOffset(
  domain: Domain,
  offsets: readonly PaceOffset[],
): OffsetMonths {
  return offsets.find((o) => o.domain === domain)?.months ?? 0
}

/**
 * 기준 시기에 오프셋을 적용해 "우리 집 목표 시기"를 만든다.
 *
 * INV-PACE-02  origin='자체' → 오프셋을 적용하지 않고 baselinePeriod 를 그대로 반환
 * INV-PERIOD-01 결과는 start <= end
 * INV-PERIOD-02 구간 길이를 보존한다 (start·end 를 같은 폭으로 이동)
 *
 * @throws DomainError E-PACE-INVALID-MONTHS
 */
export function resolveTargetPeriod(
  standard: Standard,
  offsetMonths: OffsetMonths,
): Period {
  requireValidOffsetMonths(offsetMonths)

  // INV-PACE-02 — 자체 기준은 이미 시기까지 우리가 정한 것이다.
  // 오프셋을 얹으면 이중 조정이 된다.
  if (standard.origin === '자체') return standard.baselinePeriod

  // INV-PERIOD-02 — 두 끝을 같은 폭으로 이동하므로 구간 길이가 보존된다.
  return {
    start: shiftYearMonth(standard.baselinePeriod.start, offsetMonths),
    end: shiftYearMonth(standard.baselinePeriod.end, offsetMonths),
  }
}

/** 오프셋 상향 시 함께 노출할 발달 신호. docs/04-교육기준표-2021년생.md §1-B */
const DEVELOPMENT_SIGNALS: readonly string[] = [
  '아이가 해당 활동을 회피하거나 "하기 싫어"가 반복된다',
  '같은 내용을 반복해도 진전이 없다',
  '활동 중 짜증·울음 빈도가 올라간다',
]

/**
 * INV-PACE-05 — 오프셋 **상향 시 반드시 경고를 반환**한다. 무음 상향 불가.
 *
 * 이 계약이 없으면 이 앱은 적기교육 도구가 아니라 선행 압박 도구가 된다.
 */
export function assessOffsetRaise(
  current: OffsetMonths,
  next: OffsetMonths,
): OffsetWarning | null {
  if (next <= current) return null

  return {
    from: current,
    to: next,
    message:
      '오프셋은 목표 시기를 당길 뿐 발달 단계를 이기지 못합니다. ' +
      '아래 신호가 보이면 다시 낮추세요.',
    signals: DEVELOPMENT_SIGNALS,
  }
}

/** 'YYYY-MM' 에서 months 만큼 뺀다. 연도 경계를 넘어간다. */
export function shiftYearMonth(ym: YearMonth, minusMonths: number): YearMonth {
  const [yearPart, monthPart] = ym.split('-')
  const year = Number(yearPart)
  const month = Number(monthPart)

  // 0-based 절대 월수로 바꿔 계산하면 연도 경계가 자연히 처리된다
  const total = year * 12 + (month - 1) - minusMonths
  const shiftedYear = Math.floor(total / 12)
  const shiftedMonth = total - shiftedYear * 12 + 1

  return `${shiftedYear}-${String(shiftedMonth).padStart(2, '0')}`
}

/**
 * 오늘 기준으로 "지금 우리 목표"에 해당하는 Standard 만 고른다. (F3)
 *
 * ⭐ 누적 모델 (INV-PACE-06) — 선행은 **바꿔치기가 아니라 더하는 것**이다.
 *    사용자 지적: "6살껄 하면서 7살껄 미리 하는 게 선행인데, 1년 누르면 할 게 없다는 게 말이 안 된다"
 *    초판은 목표 구간을 통째로 과거로 밀어 지금 목표를 **없앴다.** 그래서 선행할수록 목표가 줄었다.
 *    누적 모델에서는 오프셋을 올릴수록 목표가 **늘어난다**:
 *      - 가속 지평(now + offset)까지 **이미 시작된** 목표이고 (start ≤ now+offset)
 *      - 실제 현재 기준으로 **아직 안 끝난** 목표 (end ≥ now)
 *
 * INV-STD-06 — origin='공교육' 은 제외한다. 원문은 근거 표시용이지 겨냥 대상이 아니다.
 * INV-PACE-02 — '자체' 는 오프셋을 적용하지 않는다 (자기 시기 그대로).
 */
export function currentTargets(
  standards: readonly Standard[],
  offsets: readonly PaceOffset[],
  now: YearMonth,
): readonly Standard[] {
  return standards.filter((s) => {
    if (s.origin === '공교육') return false

    const offset = s.origin === '자체' ? 0 : effectiveOffset(s.domain, offsets)
    const horizon = shiftYearMonth(now, -offset) // now + offset (미래로 당긴 지평)

    // 시작됐고(지평 기준) 아직 안 끝났다(현재 기준)
    return s.baselinePeriod.start <= horizon && s.baselinePeriod.end >= now
  })
}
