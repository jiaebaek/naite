/**
 * 학원 (Academy). docs/07-계약.md §10
 *
 * 활동(Activity)과 별개다.
 *   - 영역이 없다. 숙제(academyId 로 연결된 Activity)가 각자 영역·목표를 가진다.
 *   - 등원(가는 것)은 오늘 화면에 그날 일정으로만 뜬다 (체크 없음) — academiesToday().
 *   - 학원은 외부 강제력이 있어 안 까먹는다(Mom Test 분석). 그래서 체크 대상이 아니다.
 */

import { requireNonEmptyName } from './guards'
import { weekdayOf } from './today'
import type {
  Academy,
  AcademyId,
  AcademyInput,
  Activity,
  Domain,
  IsoDate,
  Standard,
  Weekday,
} from './types'

/**
 * @throws DomainError E-ACAD-EMPTY-NAME
 */
export function createAcademy(input: AcademyInput, newId: () => string): Academy {
  requireNonEmptyName(input.name, 'E-ACAD-EMPTY-NAME')
  return {
    id: newId(),
    name: input.name,
    weekdays: [...input.weekdays],
    ...(input.time !== undefined ? { time: input.time } : {}),
    ...(input.contact !== undefined ? { contact: input.contact } : {}),
    ...(input.coversDomains !== undefined ? { coversDomains: [...input.coversDomains] } : {}),
    active: true,
  }
}

/** @throws DomainError E-ACAD-EMPTY-NAME */
export function renameAcademy(academy: Academy, name: string): Academy {
  requireNonEmptyName(name, 'E-ACAD-EMPTY-NAME')
  return { ...academy, name }
}

/**
 * 편집 폼 저장(§12). id·active 보존, 나머지는 input 으로 교체.
 *   coversDomains 는 폼에 없으므로(§12 학원 폼) input 에 없으면 원본 값을 유지한다
 *   — 편집이 등원 커버(예: 유아체육→예체능)를 조용히 지우지 않게.
 * @throws DomainError E-ACAD-EMPTY-NAME
 */
export function editAcademy(academy: Academy, input: AcademyInput): Academy {
  requireNonEmptyName(input.name, 'E-ACAD-EMPTY-NAME')
  const covers = input.coversDomains ?? academy.coversDomains
  return {
    id: academy.id,
    active: academy.active,
    name: input.name,
    weekdays: [...input.weekdays],
    ...(input.time !== undefined ? { time: input.time } : {}),
    ...(input.contact !== undefined ? { contact: input.contact } : {}),
    ...(covers !== undefined ? { coversDomains: [...covers] } : {}),
  }
}

export function rescheduleAcademy(
  academy: Academy,
  weekdays: readonly Weekday[],
  time?: string,
): Academy {
  const { time: _t, ...rest } = academy // eslint-disable-line @typescript-eslint/no-unused-vars
  return { ...rest, weekdays: [...weekdays], ...(time !== undefined && time !== '' ? { time } : {}) }
}

export function deactivateAcademy(academy: Academy): Academy {
  return { ...academy, active: false }
}

/** 등원용 영역(coversDomains) 설정. 빈 배열이면 필드를 지운다. */
export function setAcademyCovers(academy: Academy, domains: readonly Domain[]): Academy {
  const { coversDomains: _c, ...rest } = academy
  return { ...rest, ...(domains.length > 0 ? { coversDomains: [...domains] } : {}) }
}

/** 오늘 등원하는 학원 (오늘 화면 일정 스트립). 활성 + 오늘 요일 포함. */
export function academiesToday(
  academies: readonly Academy[],
  date: IsoDate,
): readonly Academy[] {
  const dow = weekdayOf(date)
  return academies.filter((a) => a.active && a.weekdays.includes(dow))
}

/** 이 학원에 딸린 숙제(활동). */
export function homeworkOf(
  academyId: AcademyId,
  activities: readonly Activity[],
): readonly Activity[] {
  return activities.filter((a) => a.academyId === academyId)
}

/**
 * 등원용 영역 커버리지를 위한 **합성 활동** (INV-ACAD-06).
 *   - 활성 학원의 coversDomains 각 영역에 대해, 그 영역의 지금 목표를 겨냥하는 활동을 만든다.
 *   - 커버리지 계산에만 쓴다. **오늘 화면(deriveTodayTasks)에는 절대 넣지 않는다** (INV-ACAD-03).
 *   - 그 영역에 지금 목표가 없으면 겨냥할 게 없으므로 만들지 않는다.
 */
export function attendanceActivities(
  academies: readonly Academy[],
  currentTargets: readonly Standard[],
): readonly Activity[] {
  const out: Activity[] = []
  for (const ac of academies) {
    if (!ac.active || !ac.coversDomains) continue
    for (const domain of ac.coversDomains) {
      const targetIds = currentTargets.filter((t) => t.domain === domain).map((t) => t.id)
      if (targetIds.length === 0) continue
      out.push({
        id: `att-${ac.id}-${domain}`,
        name: `${ac.name} 등원`,
        domain,
        track: '학원',
        targetIds,
        cadence: { kind: '요일지정', weekdays: ac.weekdays.length > 0 ? ac.weekdays : [0] },
        owner: '엄마',
        active: true,
      })
    }
  }
  return out
}
