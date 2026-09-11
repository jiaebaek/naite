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
import { clusterById } from './standards/clusters'
import type {
  Academy,
  AcademyId,
  AcademyInput,
  Activity,
  Domain,
  IsoDate,
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
    ...(input.coversClusters !== undefined ? { coversClusters: [...input.coversClusters] } : {}),
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
  const coversCl = input.coversClusters ?? academy.coversClusters
  return {
    id: academy.id,
    active: academy.active,
    name: input.name,
    weekdays: [...input.weekdays],
    ...(input.time !== undefined ? { time: input.time } : {}),
    ...(input.contact !== undefined ? { contact: input.contact } : {}),
    ...(covers !== undefined ? { coversDomains: [...covers] } : {}),
    ...(coversCl !== undefined ? { coversClusters: [...coversCl] } : {}),
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
 * 등원형 학원의 **등원 커버**를 위한 합성 활동 (T8 · SSOT §5 등원 커버).
 *   - 등원형 학원은 숙제 활동이 없다. 대신 등원 자체가 `coversClusters`(특정 묶음)를 챙긴다.
 *   - 여기서 만든 합성 활동을 **커버리지 계산에만** 합친다(coverage.coveringActivities).
 *   - ⚠️ 오늘 화면(deriveTodayTasks)에는 절대 넣지 않는다 — 등원은 일정만, 체크 대상 아님(INV-ACAD-03).
 *   - 영역-whole 자동커버 아님: 프리셋이 확정한 **특정 묶음**만 겨냥한다(과소청구·신뢰①).
 */
export function attendanceActivities(
  academies: readonly Academy[],
): readonly Activity[] {
  const out: Activity[] = []
  for (const ac of academies) {
    if (!ac.active || !ac.coversClusters || ac.coversClusters.length === 0) continue
    out.push({
      id: `att-${ac.id}`,
      name: `${ac.name} 등원`,
      domain: clusterById(ac.coversClusters[0]!)?.domain ?? '예체능',
      track: '학원',
      targetIds: [...ac.coversClusters],
      cadence: { kind: '요일지정', weekdays: ac.weekdays.length > 0 ? ac.weekdays : [0] },
      owner: '엄마',
      active: true,
    })
  }
  return out
}
