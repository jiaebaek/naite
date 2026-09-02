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
  /** '매일' 활동의 연속 기록. 없으면 undefined (INV-STREAK-04) */
  readonly streak?: number
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
        ...(streak !== undefined ? { streak } : {}),
      }
    })
}
