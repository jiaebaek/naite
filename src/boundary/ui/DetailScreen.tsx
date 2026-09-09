/**
 * 영역 상세 (drill-down) — UX 리디자인 §09 + B′(원문 목표 승격).
 *
 * 화면 목표 = 공교육 **원문** 그대로. 이를 **내용범주(교육과정 구조)** 별 아코디언으로 묶는다.
 *   - 순서·의역 없이 원문 그대로 → 신뢰(외부 배포 대비).
 *   - 범주 안에서 챙기는 중·이룸을 먼저, 비어있음은 뒤로(원칙 6 안도-우선).
 *   - 챙김이 하나라도 있는 범주는 펼치고, 빈 범주는 접어 요약만 보인다(넌지시).
 * 이룸(됨)은 활동 연결과 무관하게 언제나 토글 가능. 선행 UI 없음(원칙 5).
 */
import { useState } from 'react'
import type { DomainVM, MilestoneVM, RecommendVM } from './vm'
import { IconBack } from './icons'

export interface DetailScreenProps {
  readonly vm: DomainVM
  readonly onBack: () => void
  readonly onOpenLink: (m: MilestoneVM) => void
  /** 이뤘어요/이룸 해제 — MilestoneMark 토글 (활동과 독립) */
  readonly onToggleAchieved: (standardId: string) => void
  /** 공교육 기준 없는 영역(영어 등)에 부모가 목표를 직접 추가 — noPublic 영역에서만 제공 */
  readonly onAddGoal?: (() => void) | undefined
  /** 부모가 만든 자체 목표 삭제 */
  readonly onRemoveGoal?: ((standardId: string) => void) | undefined
}

function InfoDot() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
      <circle cx="12" cy="12" r="9" /><path d="M12 8v5" />
    </svg>
  )
}
function Circle() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  )
}
function CheckSm() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6}>
      <path d="M5 12l5 5L20 6" />
    </svg>
  )
}
function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={`chev${open ? ' open' : ''}`} width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/** 범주 안 정렬: 챙기는 중 → 이룸 → 비어있음(뒤로). 안도-우선. */
const rank = (m: MilestoneVM) => (m.status === '챙기는중' ? 0 : m.status === '됨' ? 1 : 2)
const pipClass = (m: MilestoneVM) => (m.status === '됨' ? 'on' : m.status === '챙기는중' ? 'prog' : 'gap')

/**
 * 추천 활동 박스(§10-A) — 세로 스택. 출처 표기는 성격별로 다르게:
 *   공교육(gov) = 짧고 신뢰 신호라 알약 배지 유지 / 자체(own) = 길어서 작은 회색 텍스트(덜 답답).
 */
function Suggest({ r }: { r: RecommendVM }) {
  const meta = `${r.effortMin}분 · ${r.placeLabel}`
  return (
    <div className="suggest">
      <span className="lb">추천 활동</span>
      <b>{r.title}</b>
      <span className="sg-meta">
        {r.badgeCls === 'gov'
          ? <><span className="badge gov">{r.sourceLabel}</span>{meta}</>
          : `${r.sourceLabel} · ${meta}`}
      </span>
    </div>
  )
}

/** 원문 목표 한 장 — 상태별 액션. */
function GoalCard({ m, onOpenLink, onToggleAchieved, onRemoveGoal }: {
  m: MilestoneVM; onOpenLink: (m: MilestoneVM) => void; onToggleAchieved: (id: string) => void
  onRemoveGoal?: ((id: string) => void) | undefined
}) {
  const removeBtn = m.removable && onRemoveGoal
    ? <button className="btn-sm ghost" onClick={() => onRemoveGoal(m.standardId)}>삭제</button>
    : null
  if (m.status === '활동필요') {
    return (
      <div className="ms empty" data-testid={`ms-${m.standardId}`}>
        <div className="ms-top"><span className="ms-name">{m.statement}</span><span className={`badge ${m.badgeCls}`}>{m.badgeLabel}</span></div>
        <div className="ms-meta"><InfoDot />아직 챙기는 활동이 없어요</div>
        {m.recommend && <Suggest r={m.recommend} />}
        <div className="ms-act">
          <button className="btn-sm fill" onClick={() => onOpenLink(m)}>활동 연결</button>
          <button className="btn-sm" onClick={() => onToggleAchieved(m.standardId)}>이뤘어요</button>
          {removeBtn}
        </div>
      </div>
    )
  }
  if (m.status === '챙기는중') {
    return (
      <div className="ms prog" data-testid={`ms-${m.standardId}`}>
        <div className="ms-top"><span className="ms-name">{m.statement}</span><span className={`badge ${m.badgeCls}`}>{m.badgeLabel}</span></div>
        <div className="ms-meta"><Circle />{m.coveredBy ? `${m.coveredBy}로 챙기는 중` : '챙기는 중'}</div>
        <div className="ms-act">
          <button className="btn-sm" onClick={() => onToggleAchieved(m.standardId)}>이뤘어요</button>
          {removeBtn}
        </div>
      </div>
    )
  }
  return (
    <div className="ms done" data-testid={`ms-${m.standardId}`}>
      <div className="ms-top"><span className="ms-name">{m.statement}</span><span className={`badge ${m.badgeCls}`}>{m.badgeLabel}</span></div>
      <div className="ms-meta"><CheckSm />이뤘어요</div>
      <div className="ms-sub">{m.coveredBy ? '활동으로 이룸' : '직접 확인함'}</div>
      <div className="ms-act">
        <button className="btn-sm" onClick={() => onToggleAchieved(m.standardId)}>이룸 해제</button>
        {removeBtn}
      </div>
    </div>
  )
}

/** 내용범주 순서를 원문 데이터 순서대로 보존해 묶는다. */
const catOf = (m: MilestoneVM) => m.category ?? '목표'
function groupByCategory(milestones: readonly MilestoneVM[]): { label: string; items: MilestoneVM[] }[] {
  const labels = milestones.reduce<readonly string[]>(
    (acc, m) => (acc.includes(catOf(m)) ? acc : [...acc, catOf(m)]),
    [],
  )
  return labels.map((label) => ({
    label,
    items: milestones.filter((m) => catOf(m) === label).slice().sort((a, b) => rank(a) - rank(b)),
  }))
}

export function DetailScreen({ vm, onBack, onOpenLink, onToggleAchieved, onAddGoal, onRemoveGoal }: DetailScreenProps) {
  const groups = groupByCategory(vm.milestones)
  // 챙김(챙기는중·됨)이 하나라도 있는 범주는 펼친다. 하나도 없으면 첫 범주만.
  const [open, setOpen] = useState<ReadonlySet<string>>(() => {
    const tended = groups.filter((g) => g.items.some((m) => m.status !== '활동필요')).map((g) => g.label)
    return new Set(tended.length > 0 ? tended : groups.slice(0, 1).map((g) => g.label))
  })
  const toggle = (label: string) => setOpen((prev) => {
    const next = new Set(prev)
    if (next.has(label)) next.delete(label); else next.add(label)
    return next
  })

  const pill = vm.group === 'empty' ? '비어있음' : vm.group === 'full' ? '완료' : '채우는 중'

  return (
    <section className="view" data-testid="view-detail">
      <div className="screen-pad">
        <div className="detbar">
          <button className="back" onClick={onBack} aria-label="영역으로"><IconBack /></button>
          <span className="dt-name">{vm.domain}</span>
          <span className={`pill ${vm.group === 'empty' ? 'empty' : vm.group === 'full' ? 'full' : 'on'}`} style={{ marginLeft: 'auto' }}>{pill}</span>
        </div>

        <div className="det-summary">
          <div className="eyebrow">이 시기 챙길 목표 · 공교육 원문 그대로</div>
          <div className="det-cover">
            목표 {vm.total}곳 · 이룸 {vm.done} · 챙기는 중 {vm.prog} · {vm.gap > 0
              ? <b>비어있음 {vm.gap}곳</b>
              : <b style={{ color: 'var(--pine)' }}>비어있음 없음</b>}
          </div>
          <div className="ring-row" aria-hidden="true">
            {vm.milestones.map((m, i) => <span key={i} className={`pip ${pipClass(m)}`} />)}
          </div>
          {vm.noPublic && <div className="ms-sub" style={{ marginTop: 8 }}>공교육 기준이 없는 영역이라 선행 개념이 없어요 · 우리 목표로 챙겨요</div>}
        </div>

        {onAddGoal && (
          <button className="btn-add-goal" onClick={onAddGoal} data-testid="add-goal">
            <span aria-hidden="true">+</span> 우리 목표 추가
          </button>
        )}

        {vm.total === 0 && vm.noPublic && (
          <div className="empty-goals">
            아직 정한 목표가 없어요. <b>우리 집 영어 목표를 직접 정해</b>볼까요?
          </div>
        )}

        {groups.map((g) => {
          // 범주가 하나뿐이면 늘 펼친다 — 접을 다른 범주가 없고, 방금 추가한 목표를 숨기지 않는다
          const isOpen = groups.length === 1 || open.has(g.label)
          const prog = g.items.filter((m) => m.status === '챙기는중').length
          const done = g.items.filter((m) => m.status === '됨').length
          const gap = g.items.filter((m) => m.status === '활동필요').length
          const summary = gap === 0
            ? (done === g.items.length ? '다 이뤘어요' : '다 챙기는 중')
            : `챙기는 중 ${prog + done} · 비어있음 ${gap}`
          return (
            <div key={g.label} className={`catbox${gap === 0 ? ' good' : ''}`} data-testid={`cat-${g.label}`}>
              <button className="cat-head" aria-expanded={isOpen} onClick={() => toggle(g.label)}>
                <span className="cat-name">{g.label}</span>
                <span className="ring-row sm" aria-hidden="true">
                  {g.items.map((m, i) => <span key={i} className={`pip ${pipClass(m)}`} />)}
                </span>
                <span className="cat-sum">{g.items.length}곳 · {summary}</span>
                <Chevron open={isOpen} />
              </button>
              {isOpen && (
                <div className="cat-body">
                  {g.items.map((m) => (
                    <GoalCard key={m.standardId} m={m} onOpenLink={onOpenLink} onToggleAchieved={onToggleAchieved} onRemoveGoal={onRemoveGoal} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
