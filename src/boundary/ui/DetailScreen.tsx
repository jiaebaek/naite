/**
 * 영역 상세 (drill-down) — UX 리디자인 §09 (2축 3상태).
 * 비어있음 → 챙기는 중 → 이룸 3그룹. 이룸(됨)은 활동 연결과 무관하게 언제나 토글 가능.
 */
import type { DomainVM, MilestoneVM } from './vm'
import { IconBack } from './icons'

export interface DetailScreenProps {
  readonly vm: DomainVM
  readonly onBack: () => void
  readonly onOpenLink: (m: MilestoneVM) => void
  /** 이뤘어요/이룸 해제 — MilestoneMark 토글 (활동과 독립) */
  readonly onToggleAchieved: (standardId: string) => void
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

export function DetailScreen({ vm, onBack, onOpenLink, onToggleAchieved }: DetailScreenProps) {
  const empty = vm.milestones.filter((m) => m.status === '활동필요')
  const prog = vm.milestones.filter((m) => m.status === '챙기는중')
  const done = vm.milestones.filter((m) => m.status === '됨')
  const pill = vm.group === 'empty' ? '비어있음' : vm.group === 'full' ? '완료' : '채우는 중'
  const pipClass = (m: MilestoneVM) => (m.status === '됨' ? 'on' : m.status === '챙기는중' ? 'prog' : 'gap')

  return (
    <section className="view" data-testid="view-detail">
      <div className="screen-pad">
        <div className="detbar">
          <button className="back" onClick={onBack} aria-label="영역으로"><IconBack /></button>
          <span className="dt-name">{vm.domain}</span>
          <span className={`pill ${vm.group === 'empty' ? 'empty' : vm.group === 'full' ? 'full' : 'on'}`} style={{ marginLeft: 'auto' }}>{pill}</span>
        </div>

        <div className="det-summary">
          <div className="eyebrow">이 시기 챙길 목표</div>
          <div className="det-cover">
            목표 {vm.total}곳 · 이룸 {vm.done} · 챙기는 중 {vm.prog} · {vm.gap > 0
              ? <b>비어있음 {vm.gap}곳</b>
              : <b style={{ color: 'var(--pine)' }}>비어있음 없음</b>}
          </div>
          <div className="ring-row" aria-hidden="true">
            {vm.milestones.map((m, i) => <span key={i} className={`pip ${pipClass(m)}`} />)}
          </div>
        </div>

        {empty.length > 0 && (
          <>
            <div className="mlabel">채우면 좋아요 · <span className="cnt">{empty.length}곳</span></div>
            {empty.map((m) => (
              <div key={m.standardId} className="ms empty" data-testid={`ms-${m.standardId}`}>
                <div className="ms-top"><span className="ms-name">{m.statement}</span><span className={`badge ${m.badgeCls}`}>{m.badgeLabel}</span></div>
                <div className="ms-meta"><InfoDot />아직 챙기는 활동이 없어요</div>
                {m.recommend && <div className="suggest"><span className="lb">추천 활동</span> <b>{m.recommend}</b></div>}
                <div className="ms-act">
                  <button className="btn-sm fill" onClick={() => onOpenLink(m)}>활동 연결</button>
                  <button className="btn-sm" onClick={() => onToggleAchieved(m.standardId)}>이뤘어요</button>
                </div>
              </div>
            ))}
          </>
        )}

        {prog.length > 0 && (
          <>
            <div className="mlabel">챙기는 중 · <span className="cnt">{prog.length}곳</span></div>
            {prog.map((m) => (
              <div key={m.standardId} className="ms prog" data-testid={`ms-${m.standardId}`}>
                <div className="ms-top"><span className="ms-name">{m.statement}</span><span className={`badge ${m.badgeCls}`}>{m.badgeLabel}</span></div>
                <div className="ms-meta"><Circle />{m.coveredBy ? `${m.coveredBy}로 챙기는 중` : '챙기는 중'}</div>
                <div className="ms-act">
                  <button className="btn-sm" onClick={() => onToggleAchieved(m.standardId)}>이뤘어요</button>
                </div>
              </div>
            ))}
          </>
        )}

        {done.length > 0 && (
          <>
            <div className="mlabel good">이룸 · <span className="cnt">{done.length}곳</span></div>
            {done.map((m) => (
              <div key={m.standardId} className="ms done" data-testid={`ms-${m.standardId}`}>
                <div className="ms-top"><span className="ms-name">{m.statement}</span><span className={`badge ${m.badgeCls}`}>{m.badgeLabel}</span></div>
                <div className="ms-meta"><CheckSm />이뤘어요</div>
                <div className="ms-sub">{m.coveredBy ? '활동으로 이룸' : '직접 확인함'}</div>
                <div className="ms-act">
                  <button className="btn-sm" onClick={() => onToggleAchieved(m.standardId)}>이룸 해제</button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  )
}
