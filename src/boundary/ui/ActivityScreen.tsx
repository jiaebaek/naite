/**
 * 활동 화면 (F2). docs/08-UI계약.md §4
 *
 * ⚠️ INV-UI-24 — nature 를 고르는 입력을 두지 않는다. targetIds 에서 파생된다.
 * ⚠️ INV-UI-26 — owner 는 표시·선택만. 알림·요청·확인 UI 금지 (OOS-1).
 * ⚠️ INV-UI-27 — 삭제가 아니라 끄기(비활성화). 지난 기록이 고아가 되지 않게.
 */

import { useState } from 'react'
import { deriveNature } from '../../domain/nature'
import { isDomainError } from '../../domain/errors'
import { DOMAINS } from '../../domain/types'
import type {
  Academy,
  AcademyId,
  AcademyInput,
  Activity,
  ActivityId,
  ActivityInput,
  Cadence,
  Domain,
  Owner,
  Provenance,
  Standard,
  StandardId,
  Track,
  Weekday,
} from '../../domain/types'
import { provenanceLabel } from './labels'

/** 성취 기록(관리 탭) — 한 영역의 지금 목표들과 '됨' 상태 */
export interface AchievementGoal {
  readonly standardId: StandardId
  readonly statement: string
  readonly provenance: Provenance
  readonly done: boolean
}
export interface AchievementGroup {
  readonly domain: Domain
  readonly goals: readonly AchievementGoal[]
}

export interface ActivityScreenProps {
  readonly activities: readonly Activity[]
  readonly standards: readonly Standard[]
  /** 이미 달성한 목표 id. 겨냥 칩에서 제외한다 (INV-UI-25b) */
  readonly achieved: readonly StandardId[]
  // ── 성취 기록 (아이 상태 관리) ──
  readonly achievementGroups: readonly AchievementGroup[]
  readonly onToggleAchieved: (standardId: StandardId) => void
  /** may throw DomainError — 화면이 잡아서 메시지를 보여준다 */
  readonly onCreate: (input: ActivityInput) => void
  readonly onDeactivate: (id: ActivityId) => void
  /** 겨냥 목표 변경 (retarget). may throw DomainError */
  readonly onRetarget: (id: ActivityId, targetIds: readonly StandardId[]) => void
  /** 이름 변경. may throw DomainError */
  readonly onRename: (id: ActivityId, name: string) => void
  /** 주기 변경. may throw DomainError */
  readonly onReschedule: (id: ActivityId, cadence: Cadence) => void
  /** 담당 변경 */
  readonly onSetOwner: (id: ActivityId, owner: Owner) => void
  // ── 학원 ──
  readonly academies: readonly Academy[]
  readonly onCreateAcademy: (input: AcademyInput) => void
  readonly onRenameAcademy: (id: AcademyId, name: string) => void
  readonly onRescheduleAcademy: (id: AcademyId, weekdays: readonly Weekday[], time?: string) => void
  readonly onDeactivateAcademy: (id: AcademyId) => void
  readonly onSetAcademyCovers: (id: AcademyId, domains: readonly Domain[]) => void
}

function scheduleSummary(weekdays: readonly Weekday[], time?: string): string {
  const days = weekdays.map((d) => WEEKDAYS[d]?.label).join('·')
  if (!days) return time ?? '요일 미정'
  return time ? `${days} ${time}` : days
}

const WEEKDAYS: readonly { d: Weekday; label: string }[] = [
  { d: 0, label: '일' }, { d: 1, label: '월' }, { d: 2, label: '화' },
  { d: 3, label: '수' }, { d: 4, label: '목' }, { d: 5, label: '금' }, { d: 6, label: '토' },
]

function cadenceSummary(c: Cadence): string {
  switch (c.kind) {
    case '매일': return '매일'
    case '주N회': return `주 ${c.times}회`
    case '요일지정': return c.weekdays.map((d) => WEEKDAYS[d]?.label).join('·')
    case '비정기': return '비정기'
  }
}

/**
 * 겨냥 가능한 목표 칩. INV-UI-25 / INV-UI-25b
 *  - 해당 영역의 목표 중 공교육 원문 제외
 *  - 이미 달성한 목표 제외 (단 keep 에 든 것은 남긴다 — 편집 시 이미 겨냥하던 것)
 */
function targetableChips(
  standards: readonly Standard[],
  domain: Domain,
  achieved: readonly StandardId[],
  keep: readonly StandardId[] = [],
): readonly Standard[] {
  const achievedSet = new Set(achieved)
  const keepSet = new Set(keep)
  return standards.filter(
    (s) =>
      s.domain === domain &&
      s.origin !== '공교육' &&
      (!achievedSet.has(s.id) || keepSet.has(s.id)),
  )
}

export function ActivityScreen({
  activities,
  standards,
  achieved,
  achievementGroups,
  onToggleAchieved,
  onCreate,
  onDeactivate,
  onRetarget,
  onRename,
  onReschedule,
  onSetOwner,
  academies,
  onCreateAcademy,
  onRenameAcademy,
  onRescheduleAcademy,
  onDeactivateAcademy,
  onSetAcademyCovers,
}: ActivityScreenProps) {
  const [showForm, setShowForm] = useState(false)
  const [showAcadForm, setShowAcadForm] = useState(false)

  const activeAcademies = academies.filter((a) => a.active)
  const standalone = activities.filter((a) => !a.academyId)

  const rowProps = {
    standards, achieved, onDeactivate, onRetarget, onRename, onReschedule, onSetOwner,
  }

  return (
    <main className="page">
      <p className="page__date">관리</p>

      {/* ── 성취 기록 (아이 상태 관리) — '됨'은 여기서만 바꾼다 (⑥) ── */}
      <h2 className="asection__title">성취 기록</h2>
      <p className="asection__desc">
        아이가 <b>할 수 있게 된 것</b>을 표시해요. 됨으로 표시하면 그 영역의 선행 잠금이 풀릴 수 있어요.
        (영역 탭에서는 됨은 숨겨져 빈 곳만 보여요)
      </p>
      {achievementGroups.map((g) => (
        <AchievementGroupView key={g.domain} group={g} onToggleAchieved={onToggleAchieved} />
      ))}

      {/* ── 학원 ── */}
      <h2 className="asection__title">학원</h2>
      {activeAcademies.map((ac) => (
        <AcademyCard
          key={ac.id}
          academy={ac}
          homework={activities.filter((a) => a.academyId === ac.id)}
          rowProps={rowProps}
          onRenameAcademy={onRenameAcademy}
          onRescheduleAcademy={onRescheduleAcademy}
          onDeactivateAcademy={onDeactivateAcademy}
          onSetAcademyCovers={onSetAcademyCovers}
        />
      ))}
      {showAcadForm ? (
        <AcademyForm onCreate={onCreateAcademy} onDone={() => setShowAcadForm(false)} />
      ) : (
        <button type="button" className="alist__add" onClick={() => setShowAcadForm(true)}>
          ＋ 학원 등록
        </button>
      )}

      {/* ── 우리집 활동 (엄마표) ── */}
      <h2 className="asection__title">우리집 활동</h2>
      <ul className="alist">
        {standalone.map((a) => (
          <ActivityRow key={a.id} activity={a} {...rowProps} />
        ))}
      </ul>

      {showForm ? (
        <ActivityForm
          standards={standards}
          achieved={achieved}
          academies={activeAcademies}
          onCreate={onCreate}
          onDone={() => setShowForm(false)}
        />
      ) : (
        <button type="button" className="alist__add" onClick={() => setShowForm(true)}>
          ＋ 새 활동
        </button>
      )}
    </main>
  )
}

/** 한 영역의 성취 기록. '됨' 토글은 관리 탭에서만 (⑥ — 신중한 상태 변경). */
function AchievementGroupView({
  group,
  onToggleAchieved,
}: {
  group: AchievementGroup
  onToggleAchieved: (standardId: StandardId) => void
}) {
  return (
    <section className="achgroup" data-testid={`ach-${group.domain}`}>
      <h3 className="achgroup__domain">{group.domain}</h3>
      <ul className="achgroup__list">
        {group.goals.map((goal) => (
          <li
            key={goal.standardId}
            className="achrow"
            data-testid={`ach-goal-${goal.standardId}`}
            data-done={String(goal.done)}
          >
            <div className="achrow__main">
              <span className="achrow__text">{goal.statement}</span>
              <span className="achrow__prov">{provenanceLabel(goal.provenance)}</span>
            </div>
            <button
              type="button"
              className="achrow__toggle"
              aria-pressed={goal.done}
              onClick={() => onToggleAchieved(goal.standardId)}
            >
              {goal.done ? '✓ 됨' : '됨으로'}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

type RowProps = {
  standards: readonly Standard[]
  achieved: readonly StandardId[]
  onDeactivate: (id: ActivityId) => void
  onRetarget: (id: ActivityId, targetIds: readonly StandardId[]) => void
  onRename: (id: ActivityId, name: string) => void
  onReschedule: (id: ActivityId, cadence: Cadence) => void
  onSetOwner: (id: ActivityId, owner: Owner) => void
}

function AcademyCard({
  academy,
  homework,
  rowProps,
  onRenameAcademy,
  onRescheduleAcademy,
  onDeactivateAcademy,
  onSetAcademyCovers,
}: {
  academy: Academy
  homework: readonly Activity[]
  rowProps: RowProps
  onRenameAcademy: (id: AcademyId, name: string) => void
  onRescheduleAcademy: (id: AcademyId, weekdays: readonly Weekday[], time?: string) => void
  onDeactivateAcademy: (id: AcademyId) => void
  onSetAcademyCovers: (id: AcademyId, domains: readonly Domain[]) => void
}) {
  const [editing, setEditing] = useState(false)
  const activeHw = homework.filter((h) => h.active)

  return (
    <section className="acad" data-testid={`academy-${academy.id}`} data-active={String(academy.active)}>
      <div className="acad__head">
        <span className="acad__name">{academy.name}</span>
        <span className="acad__meta">{scheduleSummary(academy.weekdays, academy.time)}</span>
        <button type="button" className="arow__edit" onClick={() => setEditing((v) => !v)}>
          {editing ? '접기' : '편집'}
        </button>
        <button type="button" className="arow__off" onClick={() => onDeactivateAcademy(academy.id)}>
          끄기
        </button>
      </div>

      {editing && (
        <AcademyForm
          academy={academy}
          onRename={onRenameAcademy}
          onReschedule={onRescheduleAcademy}
          onSetCovers={onSetAcademyCovers}
          onDone={() => setEditing(false)}
        />
      )}

      {/* 숙제 (nested) */}
      {activeHw.length > 0 ? (
        <ul className="acad__hw">
          {activeHw.map((h) => (
            <ActivityRow key={h.id} activity={h} {...rowProps} />
          ))}
        </ul>
      ) : (
        <p className="acad__none-hw">숙제 없음 (가는 것 자체가 활동)</p>
      )}
    </section>
  )
}

function ActivityRow({
  activity,
  standards,
  achieved,
  onDeactivate,
  onRetarget,
  onRename,
  onReschedule,
  onSetOwner,
}: {
  activity: Activity
  standards: readonly Standard[]
  achieved: readonly StandardId[]
  onDeactivate: (id: ActivityId) => void
  onRetarget: (id: ActivityId, targetIds: readonly StandardId[]) => void
  onRename: (id: ActivityId, name: string) => void
  onReschedule: (id: ActivityId, cadence: Cadence) => void
  onSetOwner: (id: ActivityId, owner: Owner) => void
}) {
  const [editing, setEditing] = useState(false)
  const nature = deriveNature(activity, standards)

  // 겨냥 중인 목표 문장 (확인용)
  const targeted = activity.targetIds
    .map((id) => standards.find((s) => s.id === id))
    .filter((s): s is Standard => Boolean(s))

  return (
    <li className="arow" data-testid={`activity-${activity.id}`} data-active={String(activity.active)}>
      <div className="arow__row">
        <div className="arow__main">
          <span className="arow__name">{activity.name}</span>
          <span className="arow__meta">
            {activity.domain} · {cadenceSummary(activity.cadence)} · {activity.owner}
          </span>
        </div>
        <span className="arow__nature">{nature}</span>
        {activity.active && (
          <button type="button" className="arow__off" onClick={() => onDeactivate(activity.id)}>
            끄기
          </button>
        )}
      </div>

      {/* 겨냥 목표 확인 */}
      <div className="arow__targets">
        {targeted.length > 0 ? (
          <ul className="arow__tlist">
            {targeted.map((s) => (
              <li key={s.id}>🎯 {s.statement}</li>
            ))}
          </ul>
        ) : (
          <span className="arow__none">겨냥 목표 없음</span>
        )}
        {activity.active && (
          <button
            type="button"
            className="arow__edit"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? '접기' : '편집'}
          </button>
        )}
      </div>

      {editing && (
        <ActivityEditor
          activity={activity}
          standards={standards}
          achieved={achieved}
          onSave={(patch) => {
            // 바뀐 항목만 각 도메인 연산으로 반영한다 (INV-ACT-09/10, retarget, setOwner).
            if (patch.name !== undefined) onRename(activity.id, patch.name)
            if (patch.cadence !== undefined) onReschedule(activity.id, patch.cadence)
            if (patch.targetIds !== undefined) onRetarget(activity.id, patch.targetIds)
            if (patch.owner !== undefined) onSetOwner(activity.id, patch.owner)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </li>
  )
}

interface EditPatch {
  name?: string
  cadence?: Cadence
  targetIds?: readonly StandardId[]
  owner?: Owner
}

function ActivityEditor({
  activity,
  standards,
  achieved,
  onSave,
  onCancel,
}: {
  activity: Activity
  standards: readonly Standard[]
  achieved: readonly StandardId[]
  onSave: (patch: EditPatch) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(activity.name)
  const [cadenceKind, setCadenceKind] = useState<Cadence['kind']>(activity.cadence.kind)
  const [times, setTimes] = useState(
    activity.cadence.kind === '주N회' ? activity.cadence.times : 2,
  )
  const [weekdays, setWeekdays] = useState<readonly Weekday[]>(
    activity.cadence.kind === '요일지정' ? activity.cadence.weekdays : [],
  )
  const [ids, setIds] = useState<readonly StandardId[]>(activity.targetIds)
  const [owner, setOwnerState] = useState<Owner>(activity.owner)
  const [error, setError] = useState<string | null>(null)

  // INV-UI-25b — 달성한 목표는 제외하되, 이미 겨냥하던 것은 남긴다(빼면 편집 시 사라진다).
  const chips = targetableChips(standards, activity.domain, achieved, activity.targetIds)

  const toggle = (id: StandardId) =>
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const toggleWeekday = (d: Weekday) =>
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))

  const buildCadence = (): Cadence => {
    switch (cadenceKind) {
      case '주N회': return { kind: '주N회', times }
      case '요일지정': return { kind: '요일지정', weekdays }
      case '비정기': return { kind: '비정기' }
      default: return { kind: '매일' }
    }
  }

  const sameCadence = (a: Cadence, b: Cadence): boolean =>
    JSON.stringify(a) === JSON.stringify(b)
  const sameIds = (a: readonly string[], b: readonly string[]): boolean =>
    a.length === b.length && a.every((x) => b.includes(x))

  const save = () => {
    setError(null)
    // 바뀐 항목만 patch 로 넘긴다 — 불필요한 연산·검증을 줄인다.
    const patch: EditPatch = {}
    if (name !== activity.name) patch.name = name
    const cad = buildCadence()
    if (!sameCadence(cad, activity.cadence)) patch.cadence = cad
    if (!sameIds(ids, activity.targetIds)) patch.targetIds = ids
    if (owner !== activity.owner) patch.owner = owner

    try {
      onSave(patch)
    } catch (e) {
      setError(isDomainError(e) ? e.message : '저장하지 못했어요')
    }
  }

  return (
    <div className="aform aform--inline">
      {error && <p className="aform__error" role="alert">{error}</p>}

      <label className="aform__field">
        <span>이름</span>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <label className="aform__field">
        <span>주기</span>
        <select value={cadenceKind} onChange={(e) => setCadenceKind(e.target.value as Cadence['kind'])}>
          <option value="매일">매일</option>
          <option value="주N회">주N회</option>
          <option value="요일지정">요일지정</option>
          <option value="비정기">비정기</option>
        </select>
      </label>

      {cadenceKind === '주N회' && (
        <label className="aform__field">
          <span>횟수</span>
          <input type="number" min={1} max={7} value={times}
            onChange={(e) => setTimes(Number(e.target.value))} />
        </label>
      )}

      {cadenceKind === '요일지정' && (
        <div className="aform__field">
          <span>요일</span>
          <div className="aform__weekdays">
            {WEEKDAYS.map((w) => (
              <button key={w.d} type="button" aria-pressed={weekdays.includes(w.d)}
                className="aform__wd" onClick={() => toggleWeekday(w.d)}>
                {w.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="aform__field">
        <span>담당</span>
        <div role="group" aria-label="담당">
          {(['엄마', '아빠'] as const).map((o) => (
            <button key={o} type="button" aria-pressed={owner === o}
              className="aform__toggle" onClick={() => setOwnerState(o)}>
              {o}
            </button>
          ))}
        </div>
      </div>

      <div className="aform__field">
        <span>겨냥할 목표 (선택)</span>
        {chips.length === 0 ? (
          <p className="arow__none">이 영역에는 겨냥할 목표가 아직 없어요</p>
        ) : (
          <div className="aform__chips">
            {chips.map((s) => (
              <button key={s.id} type="button"
                data-testid={`edit-chip-${s.id}`} data-target={s.id}
                aria-pressed={ids.includes(s.id)} className="aform__chip"
                onClick={() => toggle(s.id)}>
                {s.statement}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="aform__actions">
        <button type="button" className="aform__cancel" onClick={onCancel}>취소</button>
        <button type="button" className="aform__save" onClick={save}>저장</button>
      </div>
    </div>
  )
}

/**
 * 학원 등록·편집 폼. academy 를 주면 편집 모드.
 */
function AcademyForm({
  academy,
  onCreate,
  onRename,
  onReschedule,
  onSetCovers,
  onDone,
}: {
  academy?: Academy
  onCreate?: (input: AcademyInput) => void
  onRename?: (id: AcademyId, name: string) => void
  onReschedule?: (id: AcademyId, weekdays: readonly Weekday[], time?: string) => void
  onSetCovers?: (id: AcademyId, domains: readonly Domain[]) => void
  onDone: () => void
}) {
  const [name, setName] = useState(academy?.name ?? '')
  const [weekdays, setWeekdays] = useState<readonly Weekday[]>(academy?.weekdays ?? [])
  const [time, setTime] = useState(academy?.time ?? '')
  const [contact, setContact] = useState(academy?.contact ?? '')
  const [covers, setCovers] = useState<readonly Domain[]>(academy?.coversDomains ?? [])
  const [error, setError] = useState<string | null>(null)

  const toggleWeekday = (d: Weekday) =>
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
  const toggleCover = (d: Domain) =>
    setCovers((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))

  const submit = () => {
    setError(null)
    try {
      if (academy) {
        if (name !== academy.name) onRename?.(academy.id, name)
        onReschedule?.(academy.id, weekdays, time || undefined)
        onSetCovers?.(academy.id, covers)
      } else {
        onCreate?.({
          name,
          weekdays,
          ...(time ? { time } : {}),
          ...(contact ? { contact } : {}),
          ...(covers.length > 0 ? { coversDomains: covers } : {}),
        })
      }
      onDone()
    } catch (e) {
      setError(isDomainError(e) ? e.message : '저장하지 못했어요')
    }
  }

  return (
    <div className="aform aform--inline">
      {error && <p className="aform__error" role="alert">{error}</p>}
      <label className="aform__field">
        <span>학원 이름</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 더하다사고력" />
      </label>
      <div className="aform__field">
        <span>요일</span>
        <div className="aform__weekdays">
          {WEEKDAYS.map((w) => (
            <button key={w.d} type="button" aria-pressed={weekdays.includes(w.d)}
              className="aform__wd" onClick={() => toggleWeekday(w.d)}>
              {w.label}
            </button>
          ))}
        </div>
      </div>
      <label className="aform__field">
        <span>시간 (선택)</span>
        <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="14:30" />
      </label>
      {!academy && (
        <label className="aform__field">
          <span>연락처 (선택)</span>
          <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="전화번호" />
        </label>
      )}

      {/* INV-ACAD-06 — 등원 자체가 챙기는 영역 (숙제 있는 학원은 보통 비워둠) */}
      <div className="aform__field">
        <span>가는 것만으로 챙기는 영역 (선택)</span>
        <div className="aform__chips">
          {DOMAINS.map((d) => (
            <button key={d} type="button" aria-pressed={covers.includes(d)}
              className="aform__chip" onClick={() => toggleCover(d)}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="aform__actions">
        <button type="button" className="aform__cancel" onClick={onDone}>취소</button>
        <button type="button" className="aform__save" onClick={submit}>저장</button>
      </div>
    </div>
  )
}

function ActivityForm({
  standards,
  achieved,
  academies,
  onCreate,
  onDone,
}: {
  standards: readonly Standard[]
  achieved: readonly StandardId[]
  academies: readonly Academy[]
  onCreate: (input: ActivityInput) => void
  onDone: () => void
}) {
  const [name, setName] = useState('')
  const [domain, setDomain] = useState<Domain>('국어')
  const [track, setTrack] = useState<Track>('집')
  const [owner, setOwner] = useState<Owner>('엄마')
  const [academyId, setAcademyId] = useState<AcademyId | ''>('')
  const [cadenceKind, setCadenceKind] = useState<Cadence['kind']>('매일')
  const [times, setTimes] = useState(2)
  const [weekdays, setWeekdays] = useState<readonly Weekday[]>([])
  const [targetIds, setTargetIds] = useState<readonly StandardId[]>([])
  const [error, setError] = useState<string | null>(null)

  // INV-UI-25 / 25b — 그 영역의 목표만. 공교육 원문·이미 달성한 목표는 제외.
  // 새 활동이라 "이미 겨냥하던 것" 예외는 없다.
  const targetChips = targetableChips(standards, domain, achieved)

  const buildCadence = (): Cadence => {
    switch (cadenceKind) {
      case '주N회': return { kind: '주N회', times }
      case '요일지정': return { kind: '요일지정', weekdays }
      case '비정기': return { kind: '비정기' }
      default: return { kind: '매일' }
    }
  }

  const submit = () => {
    setError(null)
    try {
      onCreate({
        name, domain, track, targetIds, cadence: buildCadence(), owner,
        // 학원을 고르면 숙제(academyId), 아니면 엄마표. 학원 활동은 track 도 '학원'.
        ...(academyId ? { academyId, track: '학원' as Track } : {}),
      })
      onDone()
    } catch (e) {
      // 도메인 에러를 사람 말로 그대로 보여준다
      setError(isDomainError(e) ? e.message : '저장하지 못했어요')
    }
  }

  const toggleTarget = (id: StandardId) =>
    setTargetIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const toggleWeekday = (d: Weekday) =>
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))

  return (
    <div className="aform">
      {error && (
        <p className="aform__error" role="alert">
          {error}
        </p>
      )}

      <label className="aform__field">
        <span>이름</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 수학 보드게임" />
      </label>

      <label className="aform__field">
        <span>영역</span>
        <select
          value={domain}
          onChange={(e) => {
            setDomain(e.target.value as Domain)
            setTargetIds([]) // 영역 바뀌면 목표 초기화
          }}
        >
          {DOMAINS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </label>

      {academies.length > 0 && (
        <label className="aform__field">
          <span>학원</span>
          <select value={academyId} onChange={(e) => setAcademyId(e.target.value as AcademyId | '')}>
            <option value="">우리집 (학원 아님)</option>
            {academies.map((ac) => (
              <option key={ac.id} value={ac.id}>{ac.name} 숙제</option>
            ))}
          </select>
        </label>
      )}

      <label className="aform__field">
        <span>주기</span>
        <select value={cadenceKind} onChange={(e) => setCadenceKind(e.target.value as Cadence['kind'])}>
          <option value="매일">매일</option>
          <option value="주N회">주N회</option>
          <option value="요일지정">요일지정</option>
          <option value="비정기">비정기</option>
        </select>
      </label>

      {cadenceKind === '주N회' && (
        <label className="aform__field">
          <span>횟수</span>
          <input
            type="number" min={1} max={7} value={times}
            onChange={(e) => setTimes(Number(e.target.value))}
          />
        </label>
      )}

      {cadenceKind === '요일지정' && (
        <div className="aform__field">
          <span>요일</span>
          <div className="aform__weekdays">
            {WEEKDAYS.map((w) => (
              <button
                key={w.d} type="button"
                aria-pressed={weekdays.includes(w.d)}
                className="aform__wd"
                onClick={() => toggleWeekday(w.d)}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="aform__field">
        <span>담당</span>
        <div role="group" aria-label="담당">
          {(['엄마', '아빠'] as const).map((o) => (
            <button
              key={o} type="button" aria-pressed={owner === o}
              className="aform__toggle" onClick={() => setOwner(o)}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      <div className="aform__field">
        <span>어디서</span>
        <div role="group" aria-label="트랙">
          {(['집', '학원'] as const).map((t) => (
            <button
              key={t} type="button" aria-pressed={track === t}
              className="aform__toggle" onClick={() => setTrack(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* INV-UI-25 — 겨냥할 목표 (생략 가능) */}
      {targetChips.length > 0 && (
        <div className="aform__field">
          <span>겨냥할 목표 (선택)</span>
          <div className="aform__chips">
            {targetChips.map((s) => (
              <button
                key={s.id} type="button"
                data-testid={`target-chip-${s.id}`}
                data-target={s.id}
                aria-pressed={targetIds.includes(s.id)}
                className="aform__chip"
                onClick={() => toggleTarget(s.id)}
              >
                {s.statement}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="aform__actions">
        <button type="button" className="aform__cancel" onClick={onDone}>취소</button>
        <button type="button" className="aform__save" onClick={submit}>저장</button>
      </div>
    </div>
  )
}
