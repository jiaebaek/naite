/**
 * 영역 상세 (drill-down) — UX 리디자인 §09.
 * 비어있는 목표를 위로. 각 목표에 추천 활동 + [활동 연결]/[이미 해요].
 */
import type { DomainVM, MilestoneVM } from './vm'
import { IconBack } from './icons'

export interface DetailScreenProps {
  readonly vm: DomainVM
  readonly onBack: () => void
  readonly onOpenLink: (m: MilestoneVM) => void
  readonly onMarkDone: (standardId: string) => void
}

function InfoDot() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
      <circle cx="12" cy="12" r="9" /><path d="M12 8v5" />
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

export function DetailScreen({ vm, onBack, onOpenLink, onMarkDone }: DetailScreenProps) {
  const empty = vm.milestones.filter((m) => m.status === '활동필요')
  const on = vm.milestones.filter((m) => m.status !== '활동필요')
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
          <div className="eyebrow">이 시기 챙길 목표</div>
          <div className="det-cover">
            {vm.gap > 0
              ? <>목표 {vm.total}곳 중 {vm.on}곳 챙김 · <b>{vm.gap}곳 비어있어요</b></>
              : <>목표 {vm.total}곳 모두 챙기는 중 · <b style={{ color: 'var(--pine)' }}>다 챙겼어요</b></>}
          </div>
          <div className="ring-row" aria-hidden="true">
            {vm.milestones.map((m, i) => <span key={i} className={`pip ${m.status === '활동필요' ? 'gap' : 'on'}`} />)}
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
                  <button className="btn-sm" onClick={() => onMarkDone(m.standardId)}>이미 해요</button>
                </div>
              </div>
            ))}
          </>
        )}

        {on.length > 0 && (
          <>
            <div className="mlabel good">챙기는 중 · <span className="cnt">{on.length}곳</span></div>
            {on.map((m) => (
              <div key={m.standardId} className="ms on" data-testid={`ms-${m.standardId}`}>
                <div className="ms-top"><span className="ms-name">{m.statement}</span><span className={`badge ${m.badgeCls}`}>{m.badgeLabel}</span></div>
                <div className="ms-meta">
                  <CheckSm />
                  {m.status === '됨' ? '이미 하고 있어요' : m.coveredBy ? `${m.coveredBy}로 챙기는 중` : '챙기는 중'}
                </div>
                {m.status === '됨' && <div className="ms-sub">부모가 확인함</div>}
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  )
}
