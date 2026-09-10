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
 * 시기 판정은 **시스템 달력이 아니라 입력받은 아이 나이** 기준이어야 한다.
 *
 * 기준 데이터(누리/성취기준)의 baselinePeriod 는 특정 코호트(cohortBirthYm)의 절대 연월로
 * 쓰여 있다. 입력받은 아이가 코호트와 생년월이 다르면, 그 차이만큼 now 를 보정해
 * "이 아이가 지금 코호트 타임라인의 어디에 있는지"를 만든다.
 *   - 아이가 코호트보다 늦게 태어났으면(더 어리면) 유효 시점을 그만큼 앞당긴다.
 *   - 일찍 태어났으면(더 크면) 뒤로 민다 → 더 상위 학년군 목표가 지금 뜬다.
 * cohortBirthYm 과 같은 생년월이면 now 그대로 (기존 동작 보존).
 */
export function cohortAlignedMonth(
  nowMonth: YearMonth,
  childBirthYm: YearMonth,
  cohortBirthYm: YearMonth,
): YearMonth {
  const abs = (ym: YearMonth): number => {
    const [y, m] = ym.split('-')
    return Number(y) * 12 + (Number(m) - 1)
  }
  const delta = abs(childBirthYm) - abs(cohortBirthYm) // 양수 = 코호트보다 어림
  return shiftYearMonth(nowMonth, delta)
}

/**
 * 지금 화면에 **목표로 보여줄 공교육 원문(+자체)**. (F3)
 *
 *   공교육 — baselinePeriod(누리/학년군 구간)가 지금을 포함하면 노출한다. 오프셋으로 다음
 *            구간을 앞당길 수 있다(누적). 지금 앱은 오프셋 []로 호출한다(적기, 선행 없음).
 *   자체   — 오프셋 미적용, 자기 구간 그대로 (INV-PACE-02).
 */
export function currentPublicGoals(
  standards: readonly Standard[],
  offsets: readonly PaceOffset[],
  now: YearMonth,
): readonly Standard[] {
  return standards.filter((s) => {
    if (s.origin === '해석') return false

    const offset = s.origin === '자체' ? 0 : effectiveOffset(s.domain, offsets)
    const horizon = shiftYearMonth(now, -offset)

    return s.baselinePeriod.start <= horizon && s.baselinePeriod.end >= now
  })
}
