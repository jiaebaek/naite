/**
 * 기록 리포트 (F4 · 기록 탭). docs/07-계약.md §12
 *
 * 피드백 ⑧: "활동 기록한 것들을 나중에 리포트처럼 보고 싶다."
 *
 * ⚠️ 긍정 프레이밍만. "못한 날 N일" 같은 결핍 집계를 만들지 않는다 (C-6).
 *    한 것을 센다 — "이번 주 N일 했어요". 분모(목표 대비)로 성적을 만들지 않는다.
 */

import { streakOf, weekRangeOf } from './today'
import type { Activity, Cadence, Completion, Domain, IsoDate } from './types'

export interface WeeklyReportRow {
  readonly activityId: string
  readonly name: string
  readonly domain: Domain
  readonly cadence: Cadence
  /** 이번 주(월~일) 완료한 날 수. 한 것만 센다 (결핍 아님) */
  readonly done: number
  /**
   * 이번 주 리듬 기준치 (막대가 꽉 차는 지점). 주N회→N, 매일→7, 요일지정→요일 수, 비정기→0.
   * 막대는 done/target 로 채운다 — 주1회를 한 번 하면 꽉 찬다 (INV-REPORT-03).
   */
  readonly target: number
  /** '매일' 활동의 연속 기록. 없으면 undefined (INV-STREAK-04) */
  readonly streak?: number
}

/** 이번 주 리듬 기준치 (cadence 별). */
function weeklyTarget(c: Cadence): number {
  switch (c.kind) {
    case '매일': return 7
    case '주N회': return c.times
    case '요일지정': return c.weekdays.length
    case '비정기': return 0
  }
}

/**
 * anchorDate 가 속한 주(월~일)의 활동별 기록.
 * 활성 활동만. 순서는 입력 순서를 따른다 (영역 그룹핑은 UI 몫).
 */
export function weeklyReport(
  activities: readonly Activity[],
  completions: readonly Completion[],
  anchorDate: IsoDate,
): readonly WeeklyReportRow[] {
  const { from, to } = weekRangeOf(anchorDate)
  return activities
    .filter((a) => a.active)
    .map((a) => {
      const done = completions.filter(
        (c) => c.activityId === a.id && c.date >= from && c.date <= to,
      ).length
      const streak = streakOf(a, anchorDate, completions)
      return {
        activityId: a.id,
        name: a.name,
        domain: a.domain,
        cadence: a.cadence,
        done,
        target: weeklyTarget(a.cadence),
        ...(streak !== undefined ? { streak } : {}),
      }
    })
}
