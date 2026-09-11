/**
 * 나이테 앱 셸 — UX 전면 리디자인 (나이테_UX/명세·프로토타입).
 *
 * 화면: 오늘 · 영역 · 상세(drill) · 관리(drill) · 기록. 첫 방문 온보딩 3장.
 * 원칙: 갭 우선 · 일상은 '오늘'만 · 공교육 근거 = 신뢰 · 갭=꿀색 · 선행 UI 없음(오프셋 0).
 *
 * 저장: localStorage (새로고침 유지). 회사↔집은 store/supabase.ts 로 전환.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deriveTodayTasks, weekRangeOf } from '../../domain/today'
import { weeklyReport } from '../../domain/report'
import { findCompletion, toggleCompletion } from '../../domain/completion'
import { cohortAlignedMonth } from '../../domain/pace'
import { currentClusterStandards, currentClusterIds, clusterById, bandOfMonth } from '../../domain/standards/clusters'
import { publicGoalStatusOf, coveringActivities } from '../../domain/coverage'
import { categoryOf } from '../../domain/category'
import { recommendForGap } from '../../domain/recommend'
import { ACTIVITY_LIBRARY } from '../../domain/standards/activityLibrary'
import { provenanceOf } from '../../domain/provenance'
import { createActivity, deactivate, editActivity, retarget } from '../../domain/activity'
import {
  academiesToday,
  attendanceActivities,
  createAcademy,
  deactivateAcademy,
  editAcademy,
} from '../../domain/academy'
import { presetByType, suggestedTargets } from '../../domain/standards/activityPresets'
import { INITIAL_CARE, grantToken } from '../../domain/pet'
import type { CareState } from '../../domain/pet'
import { STANDARDS_2021 as REFERENCE_STANDARDS, CHILD_BIRTH_YM, SCHOOL_ENTRY_YM } from '../../domain/standards/child2021'
import { DOMAINS, NO_PUBLIC_STANDARD } from '../../domain/types'
import { laneOf } from '../../domain/lanes'
import type {
  Academy,
  AcademyInput,
  Activity,
  ActivityId,
  ActivityInput,
  Cadence,
  Completion,
  Domain,
  IsoDate,
  Standard,
  StandardId,
} from '../../domain/types'
import { getStore } from '../store'
import { SNAPSHOT_VERSION } from '../store/types'
import type { AppSnapshot } from '../store/types'
import { TodayScreen } from './TodayScreen'
import type { GapBanner } from './TodayScreen'
import { AreaScreen } from './AreaScreen'
import { DetailScreen } from './DetailScreen'
import { ManageScreen } from './ManageScreen'
import type { AchGroupVM } from './ManageScreen'
import { LogScreen } from './LogScreen'
import type { WeekDayVM, RecordRowVM } from './LogScreen'
import { Onboarding } from './Onboarding'
import { SetupFlow } from './SetupFlow'
import type { SetupResult, SetupPick } from './SetupFlow'
import { ShareSheet } from './ShareSheet'
import type { CoordArea } from './NaiteCoordArt'
import { DaySheet } from './DaySheet'
import { ManageSheet } from './ManageSheet'
import type { ManageSheetTarget } from './ManageSheet'
import { LinkSheet } from './LinkSheet'
import type { LinkChoice } from './LinkSheet'
import { GoalSheet } from './GoalSheet'
import { badgeOf, recommendVM } from './vm'
import type { DomainVM, MilestoneVM, TaskVM } from './vm'
import { BrandMark, IconGear, TabIconArea, TabIconLog, TabIconToday } from './icons'

let idCounter = 0
const newId = (): string => `act-${Date.now()}-${idCounter++}`

const ONBOARD_KEY = 'naite.onboarded'
const SETUP_KEY = 'naite.setup'
const CHILD_NAME_KEY = 'naite.childName'
const CHILD_BIRTH_KEY = 'naite.childBirthYm'
const PRIORITY_KEY = 'naite.priority'
const readLS = (k: string, fallback: string): string => {
  try { return localStorage.getItem(k) ?? fallback } catch { return fallback }
}
const writeLS = (k: string, v: string): void => {
  try { localStorage.setItem(k, v) } catch { /* private mode */ }
}
const DOW = ['일', '월', '화', '수', '목', '금', '토']

/** 로컬 날짜를 'YYYY-MM-DD' 로. 시간대 이동 없이 그대로 읽는다. */
function todayIso(): IsoDate {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** 'YYYY-MM-DD' → 'N월 N일 X요일 · 만 N세 N개월' */
function formatDate(date: IsoDate): string {
  const [y, m, d] = date.split('-').map(Number)
  const dow = DOW[new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1)).getUTCDay()]
  return `${m}월 ${d}일 ${dow}요일`
}

/** 생년월 대비 만 나이 (년·개월). */
function ageMonths(birthYm: string, date: IsoDate): number {
  const [by, bm] = birthYm.split('-').map(Number)
  const [y, m] = date.split('-').map(Number)
  return (y ?? 0) * 12 + (m ?? 1) - ((by ?? 0) * 12 + (bm ?? 1))
}

function childLabelOf(birthYm: string, date: IsoDate): string {
  const [by, bm] = birthYm.split('-').map(Number)
  const [ey, em] = SCHOOL_ENTRY_YM.split('-').map(Number)
  const months = ageMonths(birthYm, date)
  return `${by}년 ${bm}월생 · 만 ${Math.floor(months / 12)}세 ${months % 12}개월 · ${ey}년 ${em}월 초등 입학`
}

/** 만 N세 M개월 (셋업 리워드·좌표 라벨용) */
function ageLabelOf(birthYm: string, date: IsoDate): string {
  const months = ageMonths(birthYm, date)
  return `만 ${Math.floor(months / 12)}세 ${months % 12}개월`
}

function cadenceLabel(c: Cadence): string {
  switch (c.kind) {
    case '매일': return '매일'
    case '주N회': return `주 ${c.times}회`
    case '요일지정': return c.weekdays.map((w) => DOW[w]).join('·')
    case '비정기': return '비정기'
  }
}

/** anchor 가 속한 주(월~일) 7일. 기록 탭 스트립용. */
function weekDaysOf(anchor: IsoDate, today: IsoDate, completions: readonly Completion[]): readonly WeekDayVM[] {
  const { from } = weekRangeOf(anchor)
  const [y, m, d] = from.split('-').map(Number)
  const start = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1))
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(start)
    dt.setUTCDate(start.getUTCDate() + i)
    const iso = dt.toISOString().slice(0, 10)
    return {
      date: iso,
      dayNum: dt.getUTCDate(),
      dow: DOW[dt.getUTCDay()] ?? '',
      isToday: iso === today,
      isFuture: iso > today,
      doneCount: completions.filter((c) => c.date === iso).length,
    }
  })
}

function serialize(s: AppSnapshot): string {
  return JSON.stringify({
    version: s.version,
    completions: s.completions,
    achieved: s.achieved,
    activities: s.activities,
    academies: s.academies,
    care: s.care,
    customGoals: s.customGoals,
  })
}

type View = 'today' | 'area' | 'detail' | 'manage' | 'log'

export function App() {
  const [view, setView] = useState<View>('today')
  const [detailDomain, setDetailDomain] = useState<Domain | null>(null)
  const [linkTarget, setLinkTarget] = useState<MilestoneVM | null>(null)
  // 우리 목표 정하기 시트가 열린 영역 (공교육 기준 없는 영역 · null = 닫힘)
  const [goalSheetDomain, setGoalSheetDomain] = useState<Domain | null>(null)
  // 기록 탭: 지난 날 backfill 시트가 열린 날짜 (null = 닫힘)
  const [backfillDate, setBackfillDate] = useState<IsoDate | null>(null)
  // 관리 탭: 학원/활동 추가·편집 시트 (null = 닫힘)
  const [manageSheet, setManageSheet] = useState<ManageSheetTarget | null>(null)
  const [showOnboard, setShowOnboard] = useState<boolean>(() => readLS(ONBOARD_KEY, '') !== '1')
  // 첫 실행 셋업(§06-A) — 온보딩 직후 1회
  const [showSetup, setShowSetup] = useState<boolean>(() => readLS(SETUP_KEY, '') !== '1')
  const [childName, setChildName] = useState<string>(() => readLS(CHILD_NAME_KEY, '첫째'))
  const [childBirthYm, setChildBirthYm] = useState<string>(() => readLS(CHILD_BIRTH_KEY, CHILD_BIRTH_YM))
  // 부모 우선 분야 (온보딩에서 1~2개) — 중요도 정렬 기준
  const [priorityDomains, setPriorityDomains] = useState<readonly Domain[]>(() => {
    try { return JSON.parse(readLS(PRIORITY_KEY, '[]')) as Domain[] } catch { return [] }
  })
  // 안도 공유 카드(§07-A)
  const [showShare, setShowShare] = useState(false)

  const [date] = useState<IsoDate>(todayIso)
  // 빈 상태로 시작한다 — 데이터는 온보딩 셋업(§06-A)과 관리에서 사용자가 직접 입력한다.
  // (누리과정·성취기준 '목표'는 지식 기반이라 남고, 학원·활동은 전부 사용자 것)
  const [activities, setActivities] = useState<readonly Activity[]>([])
  const [academies, setAcademies] = useState<readonly Academy[]>([])
  const [completions, setCompletions] = useState<readonly Completion[]>([])
  const [achieved, setAchieved] = useState<readonly StandardId[]>([])
  const [care, setCare] = useState<CareState>(INITIAL_CARE)
  // 공교육 기준이 없는 영역(영어 등)의 목표는 부모가 직접 입력한다 — 코드가 아니라 데이터.
  const [customGoals, setCustomGoals] = useState<readonly Standard[]>([])
  // ⭐ T7: 화면 목표 단위 = 교육과정 **묶음(cluster)**. 시기는 입력받은 아이 나이로 고른다.
  //    아이를 기준 코호트(CHILD_BIRTH_YM)에 정렬해 현재 band 묶음을 산출한다(초1~2면 초1~2 묶음).
  const month = cohortAlignedMonth(date.slice(0, 7), childBirthYm, CHILD_BIRTH_YM)
  const clusterGoals = useMemo(() => currentClusterStandards(month), [month])
  // 커버리지·할 일·검증이 다루는 목표 = 현재 band 묶음 + 부모가 입력한 자체목표(영어 등).
  const standards = useMemo(() => [...clusterGoals, ...customGoals], [clusterGoals, customGoals])
  // 개별 성취기준 문장 → 묶음 근거 상세용 조회.
  const stmtById = useMemo(() => new Map(REFERENCE_STANDARDS.map((s) => [s.id, s.statement])), [])

  // 저장 계층
  const store = useMemo(() => getStore(), [])
  const loaded = useRef(false)
  const lastPersisted = useRef<string | null>(null)

  const applySnapshot = useCallback((snap: AppSnapshot) => {
    setCompletions(snap.completions)
    setAchieved(snap.achieved)
    if (snap.activities) setActivities(snap.activities)
    if (snap.academies) setAcademies(snap.academies)
    if (snap.care) setCare(snap.care)
    if (snap.customGoals) setCustomGoals(snap.customGoals)
  }, [])

  useEffect(() => {
    let alive = true
    store.load().then((snap) => {
      if (!alive) return
      if (snap) {
        applySnapshot(snap)
        lastPersisted.current = serialize(snap)
      }
      loaded.current = true
    })
    return () => { alive = false }
  }, [store, applySnapshot])

  useEffect(() => {
    if (!loaded.current) return
    const snapshot: AppSnapshot = { version: SNAPSHOT_VERSION, completions, achieved, activities, academies, care, customGoals }
    const s = serialize(snapshot)
    if (s === lastPersisted.current) return
    lastPersisted.current = s
    void store.save(snapshot)
  }, [store, completions, achieved, activities, academies, care, customGoals])

  useEffect(() => {
    const pull = store.pull?.bind(store)
    if (!pull) return
    const sync = () => {
      if (!loaded.current || document.visibilityState !== 'visible') return
      void pull().then((snap) => {
        if (!snap) return
        const s = serialize(snap)
        if (s === lastPersisted.current) return
        lastPersisted.current = s
        applySnapshot(snap)
      })
    }
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('focus', sync)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('focus', sync)
    }
  }, [store, applySnapshot])

  const activeActivities = useMemo(() => activities.filter((a) => a.active), [activities])

  // ── 커버리지 (묶음 단위) ──
  // 커버리지 = 활동이 명시적으로 겨냥한 묶음(targetIds)(모델 A · docs/11 §5).
  //   숙제형 학원·집 활동 = activeActivities · 등원형 학원 = attendanceActivities(coversClusters).
  //   등원 합성 활동은 오늘 화면(deriveTodayTasks)엔 안 들어간다 — 등원은 일정만(T8·SSOT §5).
  const publicGoals = standards
  const coverageActivities = useMemo(
    () => [...activeActivities, ...attendanceActivities(academies)],
    [activeActivities, academies],
  )

  const domainVMs: readonly DomainVM[] = useMemo(() => {
    // 가족이 이미 하는 장소(§10-A 원칙: 가족 패턴에 맞는 추천을 앞세운다)
    const familyPlaces = [...new Set(coverageActivities.map((a) => (a.track === '학원' ? 'academy' as const : 'home' as const)))]
    return DOMAINS.map((domain) => {
      const dts = publicGoals.filter((t) => t.domain === domain)
      const milestones: MilestoneVM[] = dts.map((std) => {
        // 묶음(또는 자체목표)을 겨냥한 활동으로 챙겨진다(커버리지 단위 = 묶음)
        const covering = coveringActivities(std.id, coverageActivities, standards)
        const status = publicGoalStatusOf(std.id, achieved, coverageActivities, standards)
        const badge = badgeOf(provenanceOf(std, standards))
        // 갭일 때만, 근거 있는 라이브러리에서 결정적으로 하나 뽑는다(없으면 추천 없음 · 원칙3)
        const rec = status === '활동필요' ? recommendForGap(std.id, ACTIVITY_LIBRARY, { familyPlaces }) : null
        // 묶음의 근거 상세 = 속한 개별 성취기준 문장(탭하면 보임 · docs/11 §5)
        const cl = clusterById(std.id)
        const evidence = cl
          ? cl.memberIds.map((id) => stmtById.get(id)).filter((s): s is string => Boolean(s))
          : undefined
        return {
          standardId: std.id,
          statement: std.statement,
          category: categoryOf(std),
          badgeCls: badge.cls,
          badgeLabel: badge.label,
          status,
          coveredBy: covering[0]?.name ?? null,
          done: status === '됨',
          removable: std.origin === '자체',
          ...(evidence && evidence.length > 0 ? { evidence } : {}),
          ...(rec ? { recommend: recommendVM(rec) } : {}),
        }
      })
      const total = milestones.length
      const gap = milestones.filter((m) => m.status === '활동필요').length
      const done = milestones.filter((m) => m.status === '됨').length
      const prog = milestones.filter((m) => m.status === '챙기는중').length
      const on = total - gap
      const group: DomainVM['group'] =
        total === 0 ? 'full' : gap === total ? 'empty' : gap > 0 ? 'partial' : 'full'
      return {
        domain, milestones, total, on, done, prog, gap, group,
        lane: laneOf(domain),
        noPublic: NO_PUBLIC_STANDARD.includes(domain),
        priority: priorityDomains.includes(domain),
      }
    })
  }, [publicGoals, achieved, coverageActivities, priorityDomains, standards])

  // ── 갭 배너 ──
  const banner: GapBanner = useMemo(() => {
    // 배너(안도 카드)는 **학습 레인만** 센다 — 생활·마음(사회·인성·건강·안전)은 빈칸을 갭 알람으로
    // 띄우지 않는다(SSOT §5 안심 레인). 공교육 기준 없이 목표 미정 영역(영어)도 제외.
    const assessable = domainVMs.filter((d) => d.lane === '학습' && !(d.noPublic && d.total === 0))
    const gapDomains = assessable.filter((d) => d.group === 'empty')
    // 부모 우선 분야를 갭 칩 맨 앞으로 (중요도 = 부모가 정함)
    const gapNames = [...gapDomains].sort((a, b) => Number(b.priority) - Number(a.priority)).map((d) => d.domain)
    return {
      gapCount: gapDomains.length,
      onCount: assessable.length - gapDomains.length,
      totalDomains: assessable.length,
      gapNames,
      clear: gapDomains.length === 0,
      segs: assessable.map((d) => (d.group === 'empty' ? 'gap' : 'on')),
    }
  }, [domainVMs])

  // ── 오늘 할 일 (이번 주 이미 채운 주N회는 숨김 — 피드백) ──
  const tasks = useMemo(
    () => deriveTodayTasks(activeActivities, date, completions, standards),
    [activeActivities, date, completions, standards],
  )
  const visibleTasks = useMemo(
    () => tasks.filter((t) => !(t.weeklyProgress?.met && !t.done)),
    [tasks],
  )
  const todayGroups = useMemo(() => {
    return DOMAINS.map((domain) => ({
      domain,
      tasks: visibleTasks
        .filter((t) => t.domain === domain)
        .map((t): TaskVM => {
          const rep = t.targets[0]
          const badge = badgeOf(rep?.provenance ?? null)
          return {
            activityId: t.activityId,
            name: t.name,
            domain: t.domain,
            badgeCls: badge.cls,
            badgeLabel: badge.label,
            aim: rep?.statement ?? null,
            done: t.done,
          }
        }),
    })).filter((g) => g.tasks.length > 0)
  }, [visibleTasks])
  const progress = useMemo(
    () => ({ done: visibleTasks.filter((t) => t.done).length, total: visibleTasks.length }),
    [visibleTasks],
  )

  const schedule = useMemo(
    () => academiesToday(academies, date).map((a) => ({ name: a.name, ...(a.time ? { time: a.time } : {}) })),
    [academies, date],
  )

  // ── 기록 탭 ──
  const weekDays = useMemo(() => weekDaysOf(date, date, completions), [date, completions])
  const weekDoneDays = useMemo(
    () => weekDays.filter((d) => !d.isFuture && d.doneCount > 0).length,
    [weekDays],
  )
  const recordRows: readonly RecordRowVM[] = useMemo(
    () => weeklyReport(activeActivities, completions, date).map((r) => ({
      activityId: r.activityId, name: r.name, domain: r.domain, count: r.done, target: r.target, met: r.met,
    })),
    [activeActivities, completions, date],
  )
  const growthPct = useMemo(() => {
    const total = domainVMs.reduce((s, d) => s + d.total, 0)
    const on = domainVMs.reduce((s, d) => s + d.on, 0)
    return total > 0 ? on / total : 0
  }, [domainVMs])

  // 지난 날 backfill 시트에 띄울 그 날짜의 활동 체크시트 (오늘 그룹과 같은 소스)
  const dayTasks: readonly TaskVM[] = useMemo(() => {
    if (!backfillDate) return []
    return deriveTodayTasks(activeActivities, backfillDate, completions, standards).map((t): TaskVM => {
      const rep = t.targets[0]
      const badge = badgeOf(rep?.provenance ?? null)
      return {
        activityId: t.activityId, name: t.name, domain: t.domain,
        badgeCls: badge.cls, badgeLabel: badge.label, aim: rep?.statement ?? null, done: t.done,
      }
    })
  }, [backfillDate, activeActivities, completions, standards])

  // ── 관리 탭 데이터 ──
  const academyName = useCallback(
    (id?: string) => academies.find((a) => a.id === id)?.name ?? '',
    [academies],
  )
  const manageAcademies = useMemo(
    () => academies.filter((a) => a.active).map((a) => ({
      id: a.id,
      name: a.name,
      sub: `${a.weekdays.map((w) => DOW[w]).join('·')}${a.time ? ` ${a.time}` : ''}`,
    })),
    [academies],
  )
  const manageActivities = useMemo(
    () => activeActivities.map((a) => {
      // 소속 · 주기 · 겨냥 목표 (§12 활동 목록)
      const 소속 = a.academyId ? academyName(a.academyId) : a.targetIds.length > 0 ? '자체' : '자유'
      const 겨냥 = a.targetIds.length > 0 ? `${a.domain} 겨냥 ${a.targetIds.length}곳` : '겨냥 목표 없음'
      return { id: a.id, name: a.name, sub: `${소속} · ${cadenceLabel(a.cadence)} · ${겨냥}` }
    }),
    [activeActivities, academyName],
  )
  // 활동 폼의 '겨냥 목표' 옵션 — 이 시기 화면 목표(공교육 원문·영역·문장)
  const targetOptions = useMemo(
    () => publicGoals.map((t) => ({ id: t.id, statement: t.statement, domain: t.domain })),
    [publicGoals],
  )

  const achievement: readonly AchGroupVM[] = useMemo(
    () => domainVMs
      .filter((d) => d.total > 0)
      .map((d) => ({
        domain: d.domain,
        goals: d.milestones.map((m) => ({
          standardId: m.standardId,
          statement: m.statement,
          done: m.status === '됨',
          coveredBy: m.coveredBy,
        })),
      })),
    [domainVMs],
  )

  // ── 핸들러 ──
  const handleToggle = (activityId: ActivityId) => {
    const existing = findCompletion(activityId, date, completions)
    const result = toggleCompletion(activityId, date, existing, todayIso())
    setCompletions((prev) =>
      result.kind === 'created'
        ? [...prev, result.completion]
        : prev.filter((c) => !(c.activityId === activityId && c.date === date)),
    )
    if (result.kind === 'created') setCare((c) => grantToken(c))
  }

  // 지난 날 backfill 토글. 펫 토큰은 주지 않는다 — 펫은 오늘의 리듬 전용.
  const handleBackfillToggle = (activityId: ActivityId) => {
    if (!backfillDate) return
    const existing = findCompletion(activityId, backfillDate, completions)
    const result = toggleCompletion(activityId, backfillDate, existing, todayIso())
    setCompletions((prev) =>
      result.kind === 'created'
        ? [...prev, result.completion]
        : prev.filter((c) => !(c.activityId === activityId && c.date === backfillDate)),
    )
  }

  const handleToggleAchieved = (standardId: StandardId) => {
    setAchieved((prev) =>
      prev.includes(standardId) ? prev.filter((id) => id !== standardId) : [...prev, standardId],
    )
  }

  // 공교육 기준 없는 영역(영어 등)에 부모가 목표를 직접 추가한다 (자체 Standard, 항상 지금 목표).
  const handleAddGoal = (statement: string) => {
    const domain = goalSheetDomain
    if (!domain) return
    const goal: Standard = {
      id: `own-${newId()}`,
      domain,
      baselinePeriod: { start: '2000-01', end: '2099-12' },
      statement,
      source: null,
      origin: '자체',
    }
    setCustomGoals((prev) => [...prev, goal])
    setGoalSheetDomain(null)
  }

  // 부모가 만든 자체 목표 삭제 — 그 목표를 겨냥하던 활동은 겨냥만 풀린다(활동 자체는 유지).
  const handleRemoveGoal = (standardId: StandardId) => {
    setCustomGoals((prev) => prev.filter((g) => g.id !== standardId))
    setAchieved((prev) => prev.filter((id) => id !== standardId))
    setActivities((prev) => prev.map((a) =>
      a.targetIds.includes(standardId) ? retarget(a, a.targetIds.filter((id) => id !== standardId), standards) : a))
  }

  const openDetail = (domain: Domain) => { setDetailDomain(domain); setView('detail') }
  const openLink = (m: MilestoneVM) => setLinkTarget(m)

  const handleLinkConfirm = (choice: LinkChoice) => {
    const m = linkTarget
    if (!m) return
    const std = standards.find((s) => s.id === m.standardId)
    const domain = std?.domain ?? '국어'
    if (choice.kind === 'existing') {
      const act = activities.find((a) => a.id === choice.activityId)
      if (act) {
        const next = act.targetIds.includes(m.standardId) ? act.targetIds : [...act.targetIds, m.standardId]
        setActivities((prev) => prev.map((a) => (a.id === act.id ? retarget(a, next, standards) : a)))
      }
    } else {
      const name = choice.kind === 'recommend' ? choice.name : `${domain} 활동`
      const created = createActivity(
        { name, domain, track: '집', targetIds: [m.standardId], cadence: { kind: '주N회', times: 2 }, owner: '엄마' },
        standards,
        newId,
      )
      setActivities((prev) => [...prev, created])
    }
    setLinkTarget(null)
  }

  // ── 관리 시트: 추가/편집/삭제 (createActivity·editActivity 가 계약 위반 시 던진다) ──
  const handleSaveActivity = (input: ActivityInput, editingItem: Activity | null) => {
    setActivities((prev) =>
      editingItem
        ? prev.map((a) => (a.id === editingItem.id ? editActivity(a, input, standards) : a))
        : [...prev, createActivity(input, standards, newId)],
    )
    setManageSheet(null)
  }
  const handleSaveAcademy = (input: AcademyInput, editingItem: Academy | null) => {
    setAcademies((prev) =>
      editingItem
        ? prev.map((a) => (a.id === editingItem.id ? editAcademy(a, input) : a))
        : [...prev, createAcademy(input, newId)],
    )
    setManageSheet(null)
  }
  // INV-UI-27 / INV-ACAD — 삭제가 아니라 비활성화(지난 기록이 고아가 되지 않게). 편집 시트에서만.
  const handleDeleteEntity = () => {
    if (!manageSheet) return
    if (manageSheet.kind === 'activity' && manageSheet.activity) {
      const id = manageSheet.activity.id
      setActivities((prev) => prev.map((a) => (a.id === id ? deactivate(a) : a)))
    } else if (manageSheet.kind === 'academy' && manageSheet.academy) {
      const id = manageSheet.academy.id
      setAcademies((prev) => prev.map((a) => (a.id === id ? deactivateAcademy(a) : a)))
    }
    setManageSheet(null)
  }

  const closeOnboard = () => {
    setShowOnboard(false)
    writeLS(ONBOARD_KEY, '1')
  }

  // 첫 실행 셋업 완료(§06-A): 아이 정보 저장 + 학원·집 활동 등록 → 첫 세션 안도가 실데이터로
  const completeSetup = (r: SetupResult) => {
    setChildName(r.name); writeLS(CHILD_NAME_KEY, r.name)
    setChildBirthYm(r.birthYm); writeLS(CHILD_BIRTH_KEY, r.birthYm)
    setPriorityDomains(r.priorityDomains); writeLS(PRIORITY_KEY, JSON.stringify(r.priorityDomains))

    // 아이 현재 band(입력 생년월)의 지금 목표 — 프리셋 primary 를 이 band 로 걸러 겨냥 목표로 확정한다.
    // (미리 체크된 제안을 '시작하기'로 넘기면 = 봤고 끌 수 있었으니 확정으로 간주 · docs/10 배선 rule3)
    const setupMonth = cohortAlignedMonth(date.slice(0, 7), r.birthYm, CHILD_BIRTH_YM)
    const bandClusterIds = currentClusterIds(setupMonth)
    // ⚠️ childBirthYm state 는 아직 갱신 전(이 클로저의 standards 는 옛 band)이라, 검증은
    //    입력받은 생년월의 band 묶음으로 한다 — 안 그러면 elem 묶음 겨냥이 stale nuri 로 검증돼 튕긴다.
    const setupStandards = [...currentClusterStandards(setupMonth), ...customGoals]
    // 칩 → 프리셋 → (현재 band 필터) 확정 묶음. 프리셋 없거나 band 매칭 없으면 [] (자동 겨냥 없음·과소청구·원칙3).
    const resolve = (pick: SetupPick): { domain: Domain; targetIds: readonly StandardId[]; coverMode: '등원형' | '숙제형' } => {
      const preset = pick.presetType ? presetByType(pick.presetType) : undefined
      return preset
        ? { domain: preset.domain, targetIds: suggestedTargets(preset, bandClusterIds), coverMode: preset.coverMode }
        : { domain: pick.domain, targetIds: [], coverMode: '숙제형' }
    }

    // S2 학원 = 등원 엔티티. 커버 방식(T8·SSOT §5):
    //   등원형 → 등원 자체가 묶음 커버(coversClusters), 숙제 활동 없음(오늘=일정만).
    //   숙제형 → 학원 + 숙제 활동(targetIds=묶음)이 커버(오늘=체크).
    const s2 = r.academies.map((a) => {
      const { domain, targetIds, coverMode } = resolve(a)
      if (coverMode === '등원형') {
        const academy = createAcademy({ name: a.name, weekdays: [], coversClusters: targetIds }, newId)
        return { academy, homework: null as Activity | null }
      }
      const academy = createAcademy({ name: a.name, weekdays: [] }, newId)
      const homework = createActivity({
        name: `${a.name} 숙제`, domain, track: '학원', targetIds,
        cadence: { kind: '주N회', times: 2 }, owner: '엄마', academyId: academy.id,
      }, setupStandards, newId)
      return { academy, homework: homework as Activity | null }
    })
    // S3 집 활동 = 실제 체크하는 활동. 프리셋이 있으면 확정 목표를 겨냥(챙기는중), 없으면 자유.
    const s3 = r.homeActivities.map((h) => {
      const { domain, targetIds } = resolve(h)
      return createActivity({
        name: h.name, domain, track: '집', targetIds,
        cadence: { kind: '주N회', times: 3 }, owner: '엄마',
      }, setupStandards, newId)
    })
    const newAcademies = s2.map((x) => x.academy)
    const newActivities = [...s2.map((x) => x.homework).filter((h): h is Activity => h !== null), ...s3]
    if (newAcademies.length > 0) setAcademies((prev) => [...prev, ...newAcademies])
    if (newActivities.length > 0) setActivities((prev) => [...prev, ...newActivities])
    setShowSetup(false); writeLS(SETUP_KEY, '1')
  }

  // 처음부터 다시: 로컬 데이터(스냅샷·아이 정보·플래그) 전부 지우고 새로고침 → 온보딩부터
  const handleReset = () => {
    if (typeof window !== 'undefined' && !window.confirm('입력한 데이터를 모두 지우고 처음(온보딩)부터 다시 시작할까요?')) return
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith('naite.') || k.startsWith('edu-manager:')) localStorage.removeItem(k)
      }
    } catch { /* private mode */ }
    try { window.location.reload() } catch { /* noop */ }
  }

  // 안도 공유 카드 데이터(§07-A) — 영역별 챙김 정도로 좌표 실루엣 생성
  const coordAreas: readonly CoordArea[] = useMemo(
    () => domainVMs.map((d) => ({
      name: d.domain,
      v: d.total > 0 ? Math.max(0.15, d.on / d.total) : 0.15,
      s: d.group === 'empty' ? 'gap' : d.total > 0 && d.done === d.total ? 'done' : 'prog',
    })),
    [domainVMs],
  )
  const shareOnCount = useMemo(() => domainVMs.filter((d) => d.group !== 'empty').length, [domainVMs])
  const shareDoneCount = useMemo(() => domainVMs.filter((d) => d.total > 0 && d.done === d.total).length, [domainVMs])
  const ageYears = Math.floor(ageMonths(childBirthYm, date) / 12)
  const shareCode = `N${ageYears}·${domainVMs.filter((d) => d.group === 'empty').length}C${shareOnCount}`

  const detailVM = detailDomain ? domainVMs.find((d) => d.domain === detailDomain) ?? null : null
  const linkStd = linkTarget ? standards.find((s) => s.id === linkTarget.standardId) : undefined
  const linkExisting = linkTarget
    ? activeActivities
        .filter((a) => a.domain === (linkStd?.domain ?? '') && !a.targetIds.includes(linkTarget.standardId))
        .map((a) => ({ id: a.id, name: a.name, sub: a.academyId ? `${academyName(a.academyId)} · ${cadenceLabel(a.cadence)}` : cadenceLabel(a.cadence) }))
    : []

  const tab: View | null = view === 'detail' ? 'area' : view === 'manage' ? null : view

  return (
    <div className="device">
      <div className="screen">
        <header className="appbar">
          <div className="brandrow">
            <div className="brand">
              <BrandMark />
              <div><h1>나이테</h1></div>
            </div>
            <button className="gear" aria-label="관리" onClick={() => setView('manage')}>
              <IconGear />
            </button>
          </div>
          <div className="tagline">나이에 맞게, 놓치지 않게</div>
        </header>

        {view === 'today' && (
          <TodayScreen
            dateLabel={formatDate(date)}
            banner={banner}
            progress={progress}
            schedule={schedule}
            groups={todayGroups}
            onToggle={handleToggle}
            onGoArea={() => setView('area')}
            onShare={() => setShowShare(true)}
          />
        )}
        {view === 'area' && (
          <AreaScreen dateLabel={formatDate(date)} domains={domainVMs} onOpenDetail={openDetail} />
        )}
        {view === 'detail' && detailVM && (
          <DetailScreen
            vm={detailVM}
            onBack={() => setView('area')}
            onOpenLink={openLink}
            onToggleAchieved={handleToggleAchieved}
            onAddGoal={detailVM.noPublic ? () => setGoalSheetDomain(detailVM.domain) : undefined}
            onRemoveGoal={handleRemoveGoal}
          />
        )}
        {view === 'manage' && (
          <ManageScreen
            childName={childName}
            childLabel={childLabelOf(childBirthYm, date)}
            academies={manageAcademies}
            activities={manageActivities}
            achievement={achievement}
            onBack={() => setView('today')}
            onToggleAchieved={handleToggleAchieved}
            onOpenOnboarding={() => setShowOnboard(true)}
            onAddAcademy={() => setManageSheet({ kind: 'academy' })}
            onEditAcademy={(id) => { const a = academies.find((x) => x.id === id); if (a) setManageSheet({ kind: 'academy', academy: a }) }}
            onAddActivity={() => setManageSheet({ kind: 'activity' })}
            onEditActivity={(id) => { const a = activities.find((x) => x.id === id); if (a) setManageSheet({ kind: 'activity', activity: a }) }}
            onReset={handleReset}
          />
        )}
        {view === 'log' && (
          <LogScreen
            pct={growthPct}
            weekDoneDays={weekDoneDays}
            weekDays={weekDays}
            rows={recordRows}
            onDayClick={setBackfillDate}
          />
        )}
      </div>

      <nav className="tabbar" aria-label="화면 전환">
        <button className={`tab${tab === 'today' ? ' active' : ''}`} onClick={() => setView('today')}>
          <TabIconToday /> 오늘
        </button>
        <button className={`tab${tab === 'area' ? ' active' : ''}`} onClick={() => setView('area')}>
          <TabIconArea /> 영역
        </button>
        <button className={`tab${tab === 'log' ? ' active' : ''}`} onClick={() => setView('log')}>
          <TabIconLog /> 기록
        </button>
      </nav>

      {linkTarget && linkStd && (
        <LinkSheet
          domain={linkStd.domain}
          statement={linkTarget.statement}
          standardId={linkTarget.standardId}
          recommend={linkTarget.recommend}
          existing={linkExisting}
          onConfirm={handleLinkConfirm}
          onClose={() => setLinkTarget(null)}
        />
      )}

      {goalSheetDomain && (
        <GoalSheet
          domain={goalSheetDomain}
          onAdd={handleAddGoal}
          onClose={() => setGoalSheetDomain(null)}
        />
      )}

      {manageSheet && (
        <ManageSheet
          target={manageSheet}
          academies={academies.filter((a) => a.active).map((a) => ({ id: a.id, name: a.name }))}
          targets={targetOptions}
          onSaveAcademy={handleSaveAcademy}
          onSaveActivity={handleSaveActivity}
          onDelete={handleDeleteEntity}
          onClose={() => setManageSheet(null)}
        />
      )}

      {backfillDate && (
        <DaySheet
          dateLabel={formatDate(backfillDate)}
          isToday={backfillDate === date}
          tasks={dayTasks}
          onToggle={handleBackfillToggle}
          onClose={() => setBackfillDate(null)}
        />
      )}

      {showShare && (
        <ShareSheet
          childLabel={`${childName} · ${ageLabelOf(childBirthYm, date)}`}
          ageLabel={`${ageYears}세`}
          onCount={shareOnCount}
          doneCount={shareDoneCount}
          totalDomains={domainVMs.length}
          code={shareCode}
          areas={coordAreas}
          onClose={() => setShowShare(false)}
        />
      )}

      {showOnboard && <Onboarding onClose={closeOnboard} />}
      {!showOnboard && showSetup && (
        <SetupFlow
          initialName={childName}
          initialBirthYm={childBirthYm}
          ageLabelOf={(ym) => ageLabelOf(ym, date)}
          bandOf={(ym) => bandOfMonth(cohortAlignedMonth(date.slice(0, 7), ym, CHILD_BIRTH_YM)) ?? 'nuri'}
          onComplete={completeSetup}
        />
      )}
    </div>
  )
}
