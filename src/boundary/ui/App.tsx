/**
 * MVP 셸. 오늘 화면(F1) + 영역 화면(F3) + 활동 화면(F2).
 *
 * 저장: localStorage (새로고침 유지). 회사↔집 동기화는 store/supabase.ts 로 전환.
 * 활동은 사용자가 F2에서 등록·수정하며 저장에 포함된다. 시드는 첫 실행 기본값.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { deriveTodayTasks, weekRangeOf } from '../../domain/today'
import { weeklyReport } from '../../domain/report'
import { findCompletion, toggleCompletion } from '../../domain/completion'
import { assessOffsetRaise, currentTargets, effectiveOffset } from '../../domain/pace'
import { evaluateCoverage, goalStatusOf } from '../../domain/coverage'
import { provenanceOf } from '../../domain/provenance'
import { offsetGate } from '../../domain/gate'
import { createActivity, deactivate, rename, reschedule, retarget, setOwner } from '../../domain/activity'
import {
  academiesToday,
  attendanceActivities,
  createAcademy,
  deactivateAcademy,
  renameAcademy,
  rescheduleAcademy,
  setAcademyCovers,
} from '../../domain/academy'
import { INITIAL_CARE, canCare as canCareGuard, grantToken, performCare } from '../../domain/pet'
import type { CareState } from '../../domain/pet'
import { STANDARDS_2021, INITIAL_OFFSETS } from '../../domain/standards/child2021'
import { DOMAINS, NO_PUBLIC_STANDARD, OFFSET_MONTHS } from '../../domain/types'
import { SEED_ACADEMIES, SEED_ACTIVITIES } from '../seed'
import { getStore } from '../store'
import { SNAPSHOT_VERSION } from '../store/types'
import type { AppSnapshot } from '../store/types'
import { TodayScreen } from './TodayScreen'
import { PetPanel } from './PetPanel'
import { DomainScreen } from './DomainScreen'
import { ActivityScreen } from './ActivityScreen'
import { LogScreen } from './LogScreen'
import type { DomainCard, OffsetOption } from './DomainScreen'
import type { WeekDay } from './LogScreen'
import type {
  Academy,
  AcademyId,
  AcademyInput,
  Activity,
  ActivityId,
  ActivityInput,
  Completion,
  Domain,
  IsoDate,
  OffsetMonths,
  OffsetWarning,
  PaceOffset,
  StandardId,
  Weekday,
} from '../../domain/types'

let idCounter = 0
const newId = (): string => `act-${Date.now()}-${idCounter++}`

const OFFSET_LABEL: Record<OffsetMonths, string> = { 0: '적기', 12: '1년 선행', 24: '2년 선행' }

/** 로컬 날짜를 'YYYY-MM-DD' 로. 시간대 이동 없이 그대로 읽는다. */
function todayIso(): IsoDate {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/**
 * 스냅샷을 한 가지 순서로 직렬화한다. 저장·당겨오기·초기로드가 같은 문자열을 만들어야
 * "안 바뀌었으면 저장 안 함" 비교가 성립한다 — 당겨온 걸 도로 저장해 원격을 덮는 걸 막는다.
 */
function serialize(s: AppSnapshot): string {
  return JSON.stringify({
    version: s.version,
    completions: s.completions,
    achieved: s.achieved,
    offsets: s.offsets,
    activities: s.activities,
    academies: s.academies,
    care: s.care,
  })
}

const DOW = ['일', '월', '화', '수', '목', '금', '토']

/** 'YYYY-MM-DD' → 'N월 N일 X요일' */
function formatDate(date: IsoDate): string {
  const [y, m, d] = date.split('-').map(Number)
  const dow = DOW[new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1)).getUTCDay()]
  return `${m}월 ${d}일 ${dow}요일`
}

/** anchor 가 속한 주(월~일) 7일. 기록 탭 스트립용. */
function weekDaysOf(
  anchor: IsoDate,
  today: IsoDate,
  completions: readonly Completion[],
): readonly WeekDay[] {
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

type Tab = '오늘' | '영역' | '기록' | '활동'

export function App() {
  const [tab, setTab] = useState<Tab>('오늘')
  const [date] = useState<IsoDate>(todayIso)
  // 시드 활동(실제 학원·엄마표)만 기본값. 완료 기록은 깨끗하게 시작한다.
  const [activities, setActivities] = useState<readonly Activity[]>(SEED_ACTIVITIES)
  const [academies, setAcademies] = useState<readonly Academy[]>(SEED_ACADEMIES)
  const [completions, setCompletions] = useState<readonly Completion[]>([])
  const [offsets, setOffsets] = useState<readonly PaceOffset[]>(INITIAL_OFFSETS)
  const [achieved, setAchieved] = useState<readonly StandardId[]>([])
  const [care, setCare] = useState<CareState>(INITIAL_CARE)
  const [warning, setWarning] = useState<{ domain: Domain; warning: OffsetWarning } | null>(null)
  // 기록 탭에서 선택한 날 (기본 오늘). 지난 날을 골라 소급 기록한다 (⑦)
  const [selectedDate, setSelectedDate] = useState<IsoDate>(todayIso)

  // 저장 계층. 처음엔 로드 전이므로 저장을 막아, 로드 결과를 seed 로 덮어쓰지 않는다.
  const store = useMemo(() => getStore(), [])
  const loaded = useRef(false)
  // 마지막으로 저장/로드/당겨온 스냅샷의 직렬화본. 같으면 다시 저장하지 않는다
  // (원격에서 당겨온 걸 곧바로 도로 저장해 원격을 덮어쓰는 되먹임을 막는다).
  const lastPersisted = useRef<string | null>(null)

  // 스냅샷으로 화면 상태를 채운다. 초기 로드·원격 당겨오기가 함께 쓴다.
  const applySnapshot = useCallback((snap: AppSnapshot) => {
    setCompletions(snap.completions)
    setAchieved(snap.achieved)
    setOffsets(snap.offsets)
    if (snap.activities) setActivities(snap.activities)
    if (snap.academies) setAcademies(snap.academies)
    if (snap.care) setCare(snap.care)
  }, [])

  // 마운트 시 1회 로드. 저장된 게 있으면 seed 를 밀어낸다.
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
    return () => {
      alive = false
    }
  }, [store, applySnapshot])

  // 상태가 바뀌면 저장. 로드 전·직전과 동일하면 건너뛴다(INV-STORE 되먹임 방지).
  useEffect(() => {
    if (!loaded.current) return
    const snapshot: AppSnapshot = { version: SNAPSHOT_VERSION, completions, achieved, offsets, activities, academies, care }
    const s = serialize(snapshot)
    if (s === lastPersisted.current) return
    lastPersisted.current = s
    void store.save(snapshot)
  }, [store, completions, achieved, offsets, activities, academies, care])

  // 회사↔집 전환: 앱이 다시 보이면(탭 복귀·포커스) 원격 최신본을 당겨온다.
  // 로컬 전용(store.pull 없음)이면 아무 일도 하지 않는다.
  useEffect(() => {
    const pull = store.pull?.bind(store)
    if (!pull) return
    const sync = () => {
      if (!loaded.current || document.visibilityState !== 'visible') return
      void pull().then((snap) => {
        if (!snap) return
        const s = serialize(snap)
        if (s === lastPersisted.current) return // 이미 최신이면 건드리지 않는다
        lastPersisted.current = s // 당겨온 걸로 표시 → 저장 이펙트가 도로 안 쏜다
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
  const tasks = deriveTodayTasks(activeActivities, date, completions, STANDARDS_2021)

  // 기록 탭 (F4) — 이번 주 스트립 / 선택한 날 기록 / 주간 리포트
  const weekDays = useMemo(() => weekDaysOf(date, date, completions), [date, completions])
  const dayTasks = useMemo(
    () => deriveTodayTasks(activeActivities, selectedDate, completions, STANDARDS_2021),
    [activeActivities, selectedDate, completions],
  )
  const report = useMemo(
    () => weeklyReport(activeActivities, completions, date),
    [activeActivities, completions, date],
  )

  // INV-ACAD-03 — 오늘 등원 학원 (일정 스트립)
  const schedule = useMemo(
    () => academiesToday(academies, date).map((a) => ({ name: a.name, ...(a.time ? { time: a.time } : {}) })),
    [academies, date],
  )

  // INV-UI-19 — 오프셋이 바뀌면 "지금 우리 목표"가 즉시 재계산된다
  const cards: readonly DomainCard[] = useMemo(() => {
    const nowYm = date.slice(0, 7)
    const targets = currentTargets(STANDARDS_2021, offsets, nowYm)

    // INV-ACAD-06 — 등원용 영역 합성 활동을 커버리지 계산에만 합친다.
    // (오늘 화면 tasks 에는 넣지 않는다 — 등원은 체크 대상이 아니다)
    const coverageActivities = [
      ...activeActivities,
      ...attendanceActivities(academies, targets),
    ]

    return DOMAINS.map((domain) => {
      const domainTargets = targets.filter((t) => t.domain === domain)
      const currentOffset = effectiveOffset(domain, offsets)

      // 달성 기반 선행 잠금 (INV-GATE-*)
      const offsetOptions: OffsetOption[] = OFFSET_MONTHS.map((months) => {
        const gate = offsetGate(domain, months, STANDARDS_2021, achieved, nowYm)
        return {
          months,
          label: OFFSET_LABEL[months],
          current: currentOffset === months,
          // INV-GATE-02 — 하향은 언제나 가능. 게이트는 상향에만.
          locked: months > currentOffset && !gate.allowed,
          unmetCount: gate.unmet.length,
        }
      })

      return {
        domain,
        coverage: evaluateCoverage(domain, domainTargets, coverageActivities, achieved),
        offsetApplicable: !NO_PUBLIC_STANDARD.includes(domain),
        targets: domainTargets.map((standard) => ({
          standard,
          // INV-UI-00 — 상태·출처는 도메인이 판정한다. UI 는 표현만.
          status: goalStatusOf(standard.id, achieved, coverageActivities),
          provenance: provenanceOf(standard, STANDARDS_2021),
          // 이 목표를 겨냥하는 활성 활동 이름 (등원 합성 포함). 피드백 ③
          activities: coverageActivities
            .filter((a) => a.active && a.targetIds.includes(standard.id))
            .map((a) => a.name),
        })),
        offsetOptions,
        activityCount: activeActivities.filter((a) => a.domain === domain).length,
      }
    })
  }, [date, offsets, achieved, activeActivities, academies])

  // 성취 기록(관리 탭) — 지금 목표를 영역별로, '됨' 상태와 함께. 목표 있는 영역만.
  const achievementGroups = useMemo(
    () =>
      cards
        .filter((c) => c.targets.length > 0)
        .map((c) => ({
          domain: c.domain,
          goals: c.targets.map((t) => ({
            standardId: t.standard.id,
            statement: t.standard.statement,
            provenance: t.provenance,
            done: t.status === '됨',
          })),
        })),
    [cards],
  )

  const handleToggle = (activityId: ActivityId) => {
    const existing = findCompletion(activityId, date, completions)
    const result = toggleCompletion(activityId, date, existing, todayIso())

    // INV-UI-08 — 낙관적 반영. 저장 완료를 기다리지 않는다.
    setCompletions((prev) =>
      result.kind === 'created'
        ? [...prev, result.completion]
        : prev.filter((c) => !(c.activityId === activityId && c.date === date)),
    )

    // INV-UI-43 — 완료 1개 → 돌봄 토큰 1개. 체크 해제는 벌하지 않는다(토큰 회수 없음).
    if (result.kind === 'created') setCare((c) => grantToken(c))
  }

  // ⑦ 지난 날 기록 (기록 탭). 소급 기록은 펫 토큰을 주지 않는다 — 펫은 오늘의 리듬 전용 (결정 #2)
  const handleLogPast = (activityId: ActivityId) => {
    const existing = findCompletion(activityId, selectedDate, completions)
    const result = toggleCompletion(activityId, selectedDate, existing, todayIso())
    setCompletions((prev) =>
      result.kind === 'created'
        ? [...prev, result.completion]
        : prev.filter((c) => !(c.activityId === activityId && c.date === selectedDate)),
    )
  }

  // INV-UI-45 — 돌봄 1회. 토큰이 없으면 도메인이 막는다(버튼도 비활성).
  const handleCare = () => {
    setCare((c) => (canCareGuard(c) ? performCare(c) : c))
  }

  const handleOffsetChange = (domain: Domain, months: OffsetMonths) => {
    const current = effectiveOffset(domain, offsets)

    // INV-PACE-05 / INV-UI-18 — 상향이면 반드시 경고를 노출한다. 무음 상향은 없다.
    setWarning(() => {
      const w = assessOffsetRaise(current, months)
      return w ? { domain, warning: w } : null
    })

    setOffsets((prev) => [
      ...prev.filter((o) => o.domain !== domain),
      { domain, months },
    ])
  }

  const handleToggleAchieved = (standardId: StandardId) => {
    setAchieved((prev) =>
      prev.includes(standardId)
        ? prev.filter((id) => id !== standardId)
        : [...prev, standardId],
    )
  }

  // createActivity 가 계약 위반 시 던진다 — ActivityScreen 이 잡아 메시지를 보여준다.
  const handleCreateActivity = (input: ActivityInput) => {
    const created = createActivity(input, STANDARDS_2021, newId)
    setActivities((prev) => [...prev, created])
  }

  // INV-UI-27 — 삭제가 아니라 비활성화. 지난 기록이 고아가 되지 않게.
  const handleDeactivate = (id: ActivityId) => {
    setActivities((prev) => prev.map((a) => (a.id === id ? deactivate(a) : a)))
  }

  // 겨냥 목표 변경. retarget 이 계약 위반 시 던진다(같은 영역만 허용).
  const handleRetarget = (id: ActivityId, targetIds: readonly StandardId[]) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? retarget(a, targetIds, STANDARDS_2021) : a)),
    )
  }

  const handleRename = (id: ActivityId, name: string) => {
    setActivities((prev) => prev.map((a) => (a.id === id ? rename(a, name) : a)))
  }

  const handleReschedule = (id: ActivityId, cadence: Parameters<typeof reschedule>[1]) => {
    setActivities((prev) => prev.map((a) => (a.id === id ? reschedule(a, cadence) : a)))
  }

  const handleSetOwner = (id: ActivityId, owner: Parameters<typeof setOwner>[1]) => {
    setActivities((prev) => prev.map((a) => (a.id === id ? setOwner(a, owner) : a)))
  }

  // ── 학원 ────────────────────────────────────────────
  const handleCreateAcademy = (input: AcademyInput) => {
    const created = createAcademy(input, newId)
    setAcademies((prev) => [...prev, created])
  }
  const handleRenameAcademy = (id: AcademyId, name: string) => {
    setAcademies((prev) => prev.map((a) => (a.id === id ? renameAcademy(a, name) : a)))
  }
  const handleRescheduleAcademy = (id: AcademyId, weekdays: readonly Weekday[], time?: string) => {
    setAcademies((prev) => prev.map((a) => (a.id === id ? rescheduleAcademy(a, weekdays, time) : a)))
  }
  const handleDeactivateAcademy = (id: AcademyId) => {
    setAcademies((prev) => prev.map((a) => (a.id === id ? deactivateAcademy(a) : a)))
  }
  // INV-ACAD-06 — 등원용 영역 설정. 커버리지에만 반영된다(오늘 화면 아님).
  const handleSetAcademyCovers = (id: AcademyId, domains: readonly Domain[]) => {
    setAcademies((prev) => prev.map((a) => (a.id === id ? setAcademyCovers(a, domains) : a)))
  }

  return (
    <>
      {/* 상단 브랜드바 — 나이테 + 관리(⚙, 우측). 프로토타입 셸 */}
      <header className="appbar">
        <span className="appbar__brand">
          <span className="appbar__ring" aria-hidden="true" />
          나이테
        </span>
        <button
          type="button"
          className="appbar__gear"
          aria-label="관리"
          aria-pressed={tab === '활동'}
          onClick={() => setTab(tab === '활동' ? '오늘' : '활동')}
        >
          ⚙
        </button>
      </header>

      {tab === '오늘' && (
        <TodayScreen
          date={date}
          tasks={tasks}
          onToggle={handleToggle}
          pet={<PetPanel care={care} onCare={handleCare} />}
          schedule={schedule}
        />
      )}
      {tab === '영역' && (
        <DomainScreen
          cards={cards}
          onOffsetChange={handleOffsetChange}
          warning={warning}
        />
      )}
      {tab === '기록' && (
        <LogScreen
          weekDays={weekDays}
          selectedDate={selectedDate}
          selectedLabel={formatDate(selectedDate)}
          selectedIsToday={selectedDate === date}
          onSelectDay={setSelectedDate}
          dayTasks={dayTasks}
          onToggleDay={handleLogPast}
          report={report}
        />
      )}
      {tab === '활동' && (
        <ActivityScreen
          activities={activities}
          standards={STANDARDS_2021}
          achieved={achieved}
          achievementGroups={achievementGroups}
          onToggleAchieved={handleToggleAchieved}
          onCreate={handleCreateActivity}
          onDeactivate={handleDeactivate}
          onRetarget={handleRetarget}
          onRename={handleRename}
          onReschedule={handleReschedule}
          onSetOwner={handleSetOwner}
          academies={academies}
          onCreateAcademy={handleCreateAcademy}
          onRenameAcademy={handleRenameAcademy}
          onRescheduleAcademy={handleRescheduleAcademy}
          onDeactivateAcademy={handleDeactivateAcademy}
          onSetAcademyCovers={handleSetAcademyCovers}
        />
      )}

      {/* INV-UI-02 — 일상 3탭(아이콘). 관리는 상단 ⚙로 강등 (①②) */}
      <nav className="tabs" aria-label="화면 전환">
        {([
          { id: '오늘', icon: '🌱' },
          { id: '영역', icon: '🧭' },
          { id: '기록', icon: '📖' },
        ] as const).map(({ id, icon }) => (
          <button
            key={id}
            type="button"
            className="tabs__btn"
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            <span className="tabs__icon" aria-hidden="true">{icon}</span>
            <span className="tabs__label">{id}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
