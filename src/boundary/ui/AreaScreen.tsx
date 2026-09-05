/**
 * 영역 화면 (F3) — UX 리디자인 §08 (안도 톤 · 2축 3상태).
 * gap 우선 정렬. 상단 요약·pip 3톤(이룸/챙기는 중/비어있음). 선행 UI 없음(원칙 5).
 */
import type { Domain } from '../../domain/types'
import type { DomainVM, MilestoneVM } from './vm'

export interface AreaScreenProps {
  readonly dateLabel: string
  readonly domains: readonly DomainVM[]
  readonly onOpenDetail: (domain: Domain) => void
}

const pipOf = (m: MilestoneVM) => (m.status === '됨' ? 'on' : m.status === '챙기는중' ? 'prog' : 'gap')

function pips(d: DomainVM) {
  return (
    <div className="ring-row" aria-hidden="true">
      {d.milestones.map((m, i) => <span key={i} className={`pip ${pipOf(m)}`} />)}
    </div>
  )
}

function DomainCard({ d, onOpen }: { d: DomainVM; onOpen: () => void }) {
  if (d.group === 'empty') {
    return (
      <div className="domain empty" data-testid={`domain-${d.domain}`}>
        <div className="d-top"><span className="d-name">{d.domain}</span><span className="pill empty">비어있음</span></div>
        {pips(d)}
        <div className="d-status">지금 시기 목표 <b>{d.gap}곳이 {d.total > 1 ? '모두 ' : ''}비어있어요</b> · 활동이 아직 없어요</div>
        <div className="d-actions">
          <button className="btn-sm fill" onClick={onOpen}>활동 추가</button>
          <button className="btn-sm" onClick={onOpen}>목표 {d.total}개 보기</button>
        </div>
      </div>
    )
  }
  if (d.group === 'partial') {
    return (
      <div className="domain" data-testid={`domain-${d.domain}`}>
        <div className="d-top"><span className="d-name">{d.domain}</span><span className="pill on">{d.on}곳 챙기는 중</span></div>
        {pips(d)}
        <div className="d-status">
          목표 {d.total}곳 · {d.done > 0 && <>이룸 {d.done} · </>}챙기는 중 {d.prog} · <b>비어있음 {d.gap}</b>
        </div>
        <div className="d-actions">
          <button className="btn-sm fill" onClick={onOpen}>비어있는 목표 채우기</button>
          <button className="btn-sm" onClick={onOpen}>자세히</button>
        </div>
      </div>
    )
  }
  // full — 비어있는 곳 없음. 전부 이룸이면 '다 이뤘어요', 아니면 '다 챙기는 중'
  const allDone = d.total > 0 && d.done === d.total
  return (
    <div className="domain" data-testid={`domain-${d.domain}`}>
      <div className="d-top"><span className="d-name">{d.domain}</span><span className="pill full">{allDone ? '다 이뤘어요' : '다 챙기는 중'}</span></div>
      {pips(d)}
      <div className="d-status good">
        목표 {d.total}곳 모두 {allDone ? '이뤘어요' : '챙기는 중'}{d.total > 0 ? ' · ' : ''}<b>잘하고 있어요</b>
        {d.noPublic && <><br /><span style={{ color: 'var(--muted)', fontSize: 12 }}>공교육 기준이 없어 선행 개념이 없어요</span></>}
      </div>
      <div className="d-actions"><button className="btn-sm" onClick={onOpen}>자세히</button></div>
    </div>
  )
}

export function AreaScreen({ dateLabel, domains, onOpenDetail }: AreaScreenProps) {
  const empties = domains.filter((d) => d.group === 'empty')
  const partials = domains.filter((d) => d.group === 'partial')
  const fulls = domains.filter((d) => d.group === 'full')
  const onCount = partials.length + fulls.length
  const gapCount = empties.length
  const segOf = (d: DomainVM) => (d.group === 'empty' ? 'gap' : d.total > 0 && d.done === d.total ? 'on' : 'prog')

  return (
    <section className="view" data-testid="view-area">
      <div className="screen-pad">
        <p className="datestrip">{dateLabel}</p>

        <div className="overview">
          <div className="eyebrow">이 나이에 챙길 영역</div>
          <div className="ov-num">{domains.length}개 영역 중 {onCount}곳 챙기고 있어요 · <b>비어있는 곳 {gapCount}</b></div>
          <div className="coverbar" aria-hidden="true">
            {domains.map((d) => <span key={d.domain} className={`seg ${segOf(d)}`} />)}
          </div>
          <div className="legend">
            <span><span className="lg-dot" style={{ background: 'var(--sage)' }} />이룸</span>
            <span><span className="lg-dot" style={{ background: 'color-mix(in srgb, var(--sage) 45%, transparent)' }} />챙기는 중</span>
            <span><span className="lg-dot" style={{ background: 'var(--honey-2)' }} />비어있음</span>
          </div>
        </div>

        {empties.length > 0 && (
          <>
            <div className="dgrp-label">먼저 챙기면 좋아요</div>
            {empties.map((d) => <DomainCard key={d.domain} d={d} onOpen={() => onOpenDetail(d.domain)} />)}
          </>
        )}
        {partials.length > 0 && (
          <>
            <div className="dgrp-label">채우는 중</div>
            {partials.map((d) => <DomainCard key={d.domain} d={d} onOpen={() => onOpenDetail(d.domain)} />)}
          </>
        )}
        {fulls.length > 0 && (
          <>
            <div className="dgrp-label">비어있는 곳 없어요</div>
            {fulls.map((d) => <DomainCard key={d.domain} d={d} onOpen={() => onOpenDetail(d.domain)} />)}
          </>
        )}
      </div>
    </section>
  )
}
