/**
 * 영역 화면 (F3). docs/08-UI계약.md §3
 *
 * ⭐ 이 앱을 만드는 이유에 해당하는 화면이다.
 *    P-6 "모든 영역에서 다 하고 있는지 확인하고 싶어서 이걸 정리하는 것"
 *
 * ⚠️ 제1원칙 (INV-UI-00): UI 는 판단하지 않는다.
 *    커버리지는 evaluateCoverage() 가, 경고는 assessOffsetRaise() 가,
 *    선행 잠금은 offsetGate() 가 이미 정했다. 여기서는 그 결과를 표현만 한다.
 */

import { useState } from 'react'
import type {
  Coverage,
  Domain,
  OffsetMonths,
  OffsetWarning,
  Provenance,
  Standard,
  StandardId,
} from '../../domain/types'
import type { GoalStatus } from '../../domain/coverage'
import { provenanceLabel } from './labels'

/** 목표 + 상태(됨/챙기는중/아직) + 출처 + 겨냥하는 활동. 상태·출처는 도메인이 판정. */
export interface DomainTarget {
  readonly standard: Standard
  readonly status: GoalStatus
  readonly provenance: Provenance
  /** 이 목표를 겨냥하는 활성 활동 이름 (피드백 ③) */
  readonly activities: readonly string[]
}

/** 오프셋 선택지 (게이트 반영) */
export interface OffsetOption {
  readonly months: OffsetMonths
  readonly label: string
  readonly current: boolean
  /** 아래 단계 목표를 다 달성하지 못해 잠김 (INV-GATE-03) */
  readonly locked: boolean
  /** 몇 개 더 달성하면 열리는지 */
  readonly unmetCount: number
}

export interface DomainCard {
  readonly domain: Domain
  readonly coverage: Coverage
  /** 영어처럼 공교육 기준이 없는 영역은 오프셋이 성립하지 않는다 (INV-PACE-02) */
  readonly offsetApplicable: boolean
  readonly targets: readonly DomainTarget[]
  readonly offsetOptions: readonly OffsetOption[]
  readonly activityCount: number
}

export interface DomainScreenProps {
  readonly cards: readonly DomainCard[]
  readonly onOffsetChange: (domain: Domain, months: OffsetMonths) => void
  readonly onToggleAchieved: (standardId: StandardId) => void
  readonly warning: { readonly domain: Domain; readonly warning: OffsetWarning } | null
}

/**
 * 커버리지 → 표현 규칙. docs/08-UI계약.md §3
 *
 * ⚠️ INV-UI-21 — `기준밖` 은 경고가 아니라 정보다 (info).
 * ⚠️ INV-UI-20 — `아직아님` 은 가장 약하고, 조치를 요구하지 않는다.
 */
const COVERAGE_VIEW: Record<
  Coverage,
  { tone: 'ok' | 'warn' | 'info' | 'faint'; note: string; action: string | null }
> = {
  하는중: { tone: 'ok', note: '제때 하고 있어요', action: null },
  비어있음: { tone: 'warn', note: '지금 시기인데 활동이 없어요', action: '활동 추가' },
  연결필요: { tone: 'warn', note: '하고는 있는데 지금 목표를 안 겨냥해요', action: '활동 연결' },
  기준밖: { tone: 'info', note: '공교육 기준 밖에서 하고 있어요', action: '자체 기준 세우기' },
  아직아님: { tone: 'faint', note: '아직 시기가 아니에요', action: null },
}

/** 상태 라벨. 배지·집계에 같은 말을 쓴다. */
const STATUS_LABEL: Record<GoalStatus, string> = {
  됨: '됨',
  챙기는중: '챙기는 중',
  아직: '아직',
}

export function DomainScreen({
  cards,
  onOffsetChange,
  onToggleAchieved,
  warning,
}: DomainScreenProps) {
  return (
    <main className="page">
      <p className="page__date">영역별 현황</p>
      {/* INV-UI-14 — 7개 영역 전부. 필터로 숨기지 않는다 */}
      {cards.map((card) => (
        <DomainCardView
          key={card.domain}
          card={card}
          onOffsetChange={onOffsetChange}
          onToggleAchieved={onToggleAchieved}
          warning={warning?.domain === card.domain ? warning.warning : null}
        />
      ))}
    </main>
  )
}

function DomainCardView({
  card,
  onOffsetChange,
  onToggleAchieved,
  warning,
}: {
  card: DomainCard
  onOffsetChange: (domain: Domain, months: OffsetMonths) => void
  onToggleAchieved: (standardId: StandardId) => void
  warning: OffsetWarning | null
}) {
  const view = COVERAGE_VIEW[card.coverage]
  // ⑥ — '됨' 은 신중한 선언(선행 잠금에 영향). 브라우즈 중엔 못 바꾸고 이 모드에서만.
  const [editing, setEditing] = useState(false)

  const total = card.targets.length
  const done = card.targets.filter((t) => t.status === '됨').length
  const doing = card.targets.filter((t) => t.status === '챙기는중').length
  const yet = card.targets.filter((t) => t.status === '아직').length

  return (
    <section
      className="dcard"
      data-testid={`domain-${card.domain}`}
      data-coverage={card.coverage}
      data-tone={view.tone}
      aria-labelledby={`dh-${card.domain}`}
    >
      <header className="dcard__head">
        <h2 className="dcard__title" id={`dh-${card.domain}`}>
          {card.domain}
        </h2>
        {/* INV-UI-29 — 색만으로 정보를 전달하지 않는다 */}
        <span className="dcard__badge">{card.coverage}</span>
      </header>

      <p className="dcard__note">{view.note}</p>

      {total > 0 && (
        <>
          {/*
            ⑤ — 커버리지를 한눈에. INV-UI-22 — 점수·퍼센트·진행바가 아니다.
            목표별 상태를 색으로 나눈 장식이라 aria-hidden. 개수는 아래 글자가 준다.
          */}
          <div className="segbar" aria-hidden="true">
            {card.targets.map((t) => (
              <span key={t.standard.id} className="seg" data-status={t.status} />
            ))}
          </div>
          <p className="dcard__breakdown">
            지금 목표 {total}
            {done > 0 && <> · 됨 {done}</>}
            {doing > 0 && <> · 챙기는 중 {doing}</>}
            {yet > 0 && <> · 아직 {yet}</>}
          </p>

          <div className="dcard__targets-head">
            <span className="dcard__targets-label">지금 시기 목표</span>
            <button
              type="button"
              className="dcard__achieve"
              aria-pressed={editing}
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? '완료' : '성취 확인'}
            </button>
          </div>
          {editing && (
            <p className="dcard__achieve-hint">‘됨’은 되돌릴 수 있고, 선행 잠금에 영향을 줘요.</p>
          )}

          <ul className="dcard__targets">
            {card.targets.map((t) => (
              <TargetRow
                key={t.standard.id}
                domain={card.domain}
                target={t}
                editing={editing}
                onToggleAchieved={onToggleAchieved}
              />
            ))}
          </ul>
        </>
      )}

      <div className="dcard__foot">
        <span className="dcard__count">
          {card.activityCount === 0 ? '활동 없음' : `활동 ${card.activityCount}개`}
        </span>

        {/* INV-UI-20 — `아직아님` 은 조치 버튼을 띄우지 않는다 */}
        {view.action && (
          <button type="button" className="dcard__action">
            {view.action}
          </button>
        )}
      </div>

      {/* INV-UI-17 — 오프셋 조정은 이 화면에서 직접. 설정 메뉴로 보내지 않는다 */}
      {card.offsetApplicable ? (
        <div className="offset" role="group" aria-label={`${card.domain} 선행 속도`}>
          {card.offsetOptions.map((opt) => (
            <OffsetButton
              key={opt.months}
              domain={card.domain}
              opt={opt}
              onOffsetChange={onOffsetChange}
            />
          ))}
        </div>
      ) : (
        <p className="offset__na">공교육 기준이 없어 선행 개념이 성립하지 않습니다</p>
      )}

      {/* INV-UI-18 — 상향 경고와 신호를 모두 노출. 건너뛰기 버튼은 두지 않는다 */}
      {warning && <OffsetWarningBox warning={warning} />}
    </section>
  )
}

function OffsetButton({
  domain,
  opt,
  onOffsetChange,
}: {
  domain: Domain
  opt: OffsetOption
  onOffsetChange: (domain: Domain, months: OffsetMonths) => void
}) {
  // INV-UI-37 — 잠김이면 왜 잠겼는지 함께 보여준다. 무음 잠금 금지.
  const lockHint = opt.locked ? `${opt.unmetCount}개 더 하면 열려요` : undefined

  return (
    <button
      type="button"
      className="offset__btn"
      aria-pressed={opt.current}
      aria-disabled={opt.locked}
      data-locked={String(opt.locked)}
      title={lockHint}
      onClick={() => {
        if (!opt.locked) onOffsetChange(domain, opt.months)
      }}
    >
      <span className="offset__label">
        {opt.locked && <span aria-hidden="true">🔒 </span>}
        {opt.label}
      </span>
      {lockHint && <span className="offset__hint">{lockHint}</span>}
    </button>
  )
}

function TargetRow({
  domain,
  target,
  editing,
  onToggleAchieved,
}: {
  domain: Domain
  target: DomainTarget
  editing: boolean
  onToggleAchieved: (standardId: StandardId) => void
}) {
  const s = target.standard
  const isDone = target.status === '됨'
  return (
    <li
      className="target"
      data-testid={`${domain}-target-${s.id}`}
      data-origin={s.origin}
      data-status={target.status}
    >
      <div className="target__top">
        <span className="target__text">{s.statement}</span>
        {/* INV-UI-38 — 능력 서술("됨")·상태로. "달성/미달성"·점수 금지 (C-6) */}
        <span className="gbadge" data-status={target.status}>
          {STATUS_LABEL[target.status]}
        </span>
      </div>

      {/*
        출처 + 겨냥하는 활동 (피드백 ③④).
        INV-UI-16 — `자체` 를 `공교육` 처럼 보이게 하지 않는다. provenanceLabel 이 구분한다.
      */}
      <div className="target__via">
        <span className="prov">{provenanceLabel(target.provenance)}</span>
        {target.activities.length > 0 ? (
          <>
            <span className="target__dot" aria-hidden="true">·</span>
            {target.activities.map((name) => (
              <span key={name} className="target__act">{name}</span>
            ))}
          </>
        ) : (
          !isDone && (
            <>
              <span className="target__dot" aria-hidden="true">·</span>
              <span className="target__actnone">연결된 활동 없음</span>
            </>
          )
        )}
      </div>

      {/*
        ⑥ — '됨' 은 성취 확인 모드에서만 바꾼다. 브라우즈 중 실수 토글을 막는다.
        INV-UI-39(개정) — 일상 완료(오늘)와 달리, 되돌릴 수 있는 신중한 선언이다.
      */}
      {editing && (
        <button
          type="button"
          className="target__mark"
          data-done={String(isDone)}
          onClick={() => onToggleAchieved(s.id)}
        >
          {isDone ? '됨 취소' : '됨으로 표시'}
        </button>
      )}
    </li>
  )
}

function OffsetWarningBox({ warning }: { warning: OffsetWarning }) {
  return (
    <div className="warnbox" role="status">
      <p className="warnbox__msg">{warning.message}</p>
      <ul className="warnbox__signals">
        {warning.signals.map((sig) => (
          <li key={sig}>{sig}</li>
        ))}
      </ul>
      {/*
        ⚠️ 여기에 "건너뛰기" · "다시 보지 않기" 버튼을 추가하지 말 것.
        그 순간 이 앱은 적기교육 도구가 아니라 선행 압박 도구가 된다 (INV-PACE-05).
      */}
    </div>
  )
}
