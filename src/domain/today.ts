/**
 * 오늘 할 일 도출 (F1 · P-1). docs/07-계약.md §4
 *
 * P-1: "강제력 없는 집 활동만 선택적으로 누락된다" — 시스템이 대신 강제력이 된다.
 */

import { deriveNature } from './nature'
import { findCompletion } from './completion'
import { isPublicProvenance, provenanceOf } from './provenance'
import type {
  Activity,
  Completion,
  IsoDate,
  Standard,
  Task,
  TaskTarget,
  Weekday,
} from './types'

/**
 * 'YYYY-MM-DD' 의 요일 (0=일).
 * UTC 로 고정 해석한다 — 로컬 시간대에 따라 요일이 바뀌면 안 된다.
 */
export function weekdayOf(date: IsoDate): Weekday {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1)).getUTCDay() as Weekday
}

/**
 * 그 날짜가 속한 주의 범위 (월~일, 양끝 포함).
 * INV-TASK-09 — 주간은 월요일에 시작한다 (한국 관습).
 */
export function weekRangeOf(date: IsoDate): { from: IsoDate; to: IsoDate } {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1))
  const dow = dt.getUTCDay() // 0=일
  const backToMonday = dow === 0 ? 6 : dow - 1 // 일요일은 그 주의 마지막 날이다

  const monday = new Date(dt)
  monday.setUTCDate(dt.getUTCDate() - backToMonday)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)

  const iso = (x: Date) => x.toISOString().slice(0, 10)
  return { from: iso(monday), to: iso(sunday) }
}

/** 오늘 이 활동을 노출할 것인가 */
function appearsToday(activity: Activity, date: IsoDate): boolean {
  switch (activity.cadence.kind) {
    case '매일':
      return true // INV-TASK-02
    case '요일지정':
      return activity.cadence.weekdays.includes(weekdayOf(date)) // INV-TASK-03
    case '주N회':
      return true // INV-TASK-08 — 요일을 강제하지 않는다. 재량은 사용자에게
    case '비정기':
      return false // INV-TASK-04 — 밀어붙이지 않는다
  }
}

/**
 * INV-TASK-01 active=false 인 활동은 포함하지 않는다
 * INV-TASK-02 '매일' 은 항상 포함
 * INV-TASK-03 '요일지정' 은 해당 요일에만
 * INV-TASK-04 '비정기' 는 포함하지 않는다
 * INV-TASK-05 done 은 해당 날짜의 Completion 존재 여부로 결정된다
 * INV-TASK-06 같은 activityId 가 두 번 나타나지 않는다
 * INV-TASK-07 영역별 그룹핑이 가능하다 (C-2 한 화면의 전제)
 * INV-TASK-08 '주N회' 는 매일 노출하고 주간 달성 횟수를 함께 준다
 */
export function deriveTodayTasks(
  activities: readonly Activity[],
  date: IsoDate,
  completions: readonly Completion[],
  standards: readonly Standard[],
): readonly Task[] {
  const seen = new Set<string>()
  const tasks: Task[] = []

  for (const activity of activities) {
    if (!activity.active) continue
    if (!appearsToday(activity, date)) continue
    if (seen.has(activity.id)) continue // INV-TASK-06
    seen.add(activity.id)

    const weekly = weeklyProgressOf(activity, date, completions)
    const streak = streakOf(activity, date, completions)

    tasks.push({
      activityId: activity.id,
      name: activity.name,
      domain: activity.domain,
      nature: deriveNature(activity, standards),
      targets: targetsOf(activity, standards),
      done: findCompletion(activity.id, date, completions) !== null,
      ...(weekly ? { weeklyProgress: weekly } : {}),
      ...(streak ? { streak } : {}),
    })
  }

  return tasks
}

/**
 * 활동이 겨냥하는 목표들을 표시용(문장+출처)으로 만든다. 피드백 ③④
 * 공교육 근거 목표를 앞세운다 — 대표(targets[0])가 요약 줄·배지에 쓰인다.
 */
function targetsOf(activity: Activity, standards: readonly Standard[]): readonly TaskTarget[] {
  return activity.targetIds
    .map((id) => standards.find((s) => s.id === id))
    .filter((s): s is Standard => Boolean(s))
    .map((s) => ({
      standardId: s.id,
      statement: s.statement,
      provenance: provenanceOf(s, standards),
    }))
    .sort(
      (a, b) => Number(isPublicProvenance(b.provenance)) - Number(isPublicProvenance(a.provenance)),
    )
}

/**
 * INV-TASK-08 / INV-TASK-09 — '주N회' 활동의 이번 주(월~일) 달성 횟수.
 * 시스템이 "오늘이 그 날"이라고 정하지 않는다.
 */
export function weeklyProgressOf(
  activity: Activity,
  date: IsoDate,
  completions: readonly Completion[],
): { done: number; times: number; met: boolean } | undefined {
  if (activity.cadence.kind !== '주N회') return undefined

  const { from, to } = weekRangeOf(date)
  const done = completions.filter(
    (c) => c.activityId === activity.id && c.date >= from && c.date <= to,
  ).length
  const times = activity.cadence.times

  // INV-TASK-11 — 주간 목표 달성 여부는 도메인이 판정한다.
  // UI 가 done >= times 를 직접 비교하면 INV-UI-00 위반이다.
  return { done, times, met: done >= times }
}

/** 하루 뺀 날짜 */
function previousDay(date: IsoDate): IsoDate {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1))
  dt.setUTCDate(dt.getUTCDate() - 1)
  return dt.toISOString().slice(0, 10)
}

/**
 * INV-STREAK-01 '매일' 활동에만 적용한다
 * INV-STREAK-02 date 부터 거슬러 올라가며 연속 완료된 일수를 센다
 * INV-STREAK-03 **오늘이 미완료여도 어제까지의 기록은 유지된다** — 아직 끊긴 게 아니다
 * INV-STREAK-04 0이면 undefined (0일째는 보여줄 것이 없다)
 *
 * 매일 활동은 오늘 못 하면 이월되지 않고 그냥 지나간다.
 * 대신 이어온 기록을 보여준다 — 벌이 아니라 흐름이다.
 */
export function streakOf(
  activity: Activity,
  date: IsoDate,
  completions: readonly Completion[],
): number | undefined {
  if (activity.cadence.kind !== '매일') return undefined

  const doneOn = new Set(
    completions.filter((c) => c.activityId === activity.id).map((c) => c.date),
  )

  // INV-STREAK-03 — 오늘이 아직 미완료면 어제부터 센다
  let cursor = doneOn.has(date) ? date : previousDay(date)
  let count = 0

  while (doneOn.has(cursor)) {
    count += 1
    cursor = previousDay(cursor)
  }

  return count === 0 ? undefined : count
}
