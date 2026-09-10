/**
 * 시기 산출 (F3). docs/00-전략-원칙.md §10 결정 A.
 *
 * 선행(달력식 앞서기) 오프셋은 제품에 없다 — 목표는 언제나 "현재 시기 band" 한 겹뿐이다.
 * 시기는 시스템 달력이 아니라 **입력받은 아이 나이**로 고른다(cohortAlignedMonth).
 */

import type { Standard, YearMonth } from './types'

/** 'YYYY-MM' 에서 months 만큼 뺀다(음수면 더한다). 연도 경계를 넘어간다. */
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
 * cohortBirthYm 과 같은 생년월이면 now 그대로.
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
 * baselinePeriod(누리/학년군 구간)가 now 를 포함하는 목표만 — 선행 없음(현재 시기 한 겹).
 * 해석(refines 판단층)은 제품에서 제거됐고, 혹시 남아도 화면 목표가 아니므로 제외한다.
 */
export function currentPublicGoals(
  standards: readonly Standard[],
  now: YearMonth,
): readonly Standard[] {
  return standards.filter(
    (s) => s.origin !== '해석' && s.baselinePeriod.start <= now && s.baselinePeriod.end >= now,
  )
}
