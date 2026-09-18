/**
 * 영역 화면 (F3) — UX 리디자인 §08 (안도 톤 · 2축 3상태 · T11 통찰-먼저 톤).
 * gap 우선 정렬. 상단 요약·pip 3톤(이룸/챙기는 중/비어있음). 선행 UI 없음(원칙 5).
 *
 * ⭐ T11(doc13 B2): 미입력 학습 영역은 "비어있음 경보(허니)"가 아니라 "알려주면 채워져요"(초대·중립).
 *   통찰-먼저에선 학습 미입력이 기본 상태 — 실패가 아니라 아직 안 알려준 것. 신뢰 칩으로 근거를 보인다.
 */
import { useState } from 'react'
import type { Domain } from '../../domain/types'
import type { DomainVM, MilestoneVM } from './vm'

export interface AreaScreenProps {
  readonly dateLabel: string
  readonly domains: readonly DomainVM[]
  readonly onOpenDetail: (domain: Domain) => void
  /** 생활·마음 관찰 체크 모듈 열기(§06-B). */
  readonly onObsCheck?: (() => void) | undefined
}

const pipOf = (m: MilestoneVM) => (m.status === '됨' ? 'on' : m.status === '챙기는중' ? 'prog' : 'gap')

function pips(d: DomainVM) {
  return (
    <div className="ring-row" aria-hidden="true">
      {d.milestones.map((m, i) => <span key={i} className={`pip ${pipOf(m)}`} />)}
    </div>
  )
}

/** 신뢰 칩 — 탭하면 "왜 이 목표들인가"(전문가 국가기준) 근거를 보인다(doc13 B2 · 신뢰=사람). */
function TrustChip() {
  const [open, setOpen] = useState(false)
  return (
    <div className="trust-wrap">
      <button className="trust-chip" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="tc-q" aria-hidden="true">?</span>전문가가 세운 기준으로 정리
      </button>
      {open && (
        <p className="trust-explain">
          누리과정·성취기준 — 아이 발달·교육 전문가들이 세운 국가 기준을 그대로 담았어요. 카더라가 아니라, 근거가 있어요.
        </p>
      )}
    </div>
  )
}

function Star({ d }: { d: DomainVM }) {
  return d.priority ? <span className="d-star" title="부모가 정한 우선 분야">중요</span> : null
}

function DomainCard({ d, onOpen, calm = false }: { d: DomainVM; onOpen: () => void; calm?: boolean }) {
  // 생활·마음(안심) 레인: 빈칸을 갭 알람으로 띄우지 않는다(SSOT §5). 부드러운 톤.
  if (calm && d.group !== 'full') {
    return (
      <div className="domain calm" data-testid={`domain-${d.domain}`}>
        <div className="d-top"><span className="d-name">{d.domain}<Star d={d} /></span><span className="pill">일상에서</span></div>
        {pips(d)}
        <div className="d-status">유치원·일상에서 챙겨지고 있어요{d.prog + d.done > 0 ? ` · 이미 ${d.prog + d.done}곳 확인` : ''}</div>
        <div className="d-actions"><button className="btn-sm" onClick={onOpen}>자세히</button></div>
      </div>
    )
  }
  // 정규 기준 없는 영역(영어)인데 아직 정한 목표가 없다 → '완료'가 아니라 '정해요'
  if (d.noPublic && d.total === 0) {
    return (
      <div className="domain nopublic" data-testid={`domain-${d.domain}`}>
        <div className="d-top"><span className="d-name">{d.domain}<Star d={d} /></span><span className="pill">우리 목표</span></div>
        <div className="d-status">정규 기준이 없는 영역이에요 · <b>우리 집 목표를 직접 정해볼까요?</b></div>
        <div className="d-actions"><button className="btn-sm fill" onClick={onOpen}>목표 정하기</button></div>
      </div>
    )
  }
  // ⭐ 미입력 학습 영역 = 초대(경보 아님). 점선·중립 pill·"알려주면 채워져요"·"급하지 않아요"(doc13 B2).
  if (d.group === 'empty') {
    return (
      <div className="domain invite" data-testid={`domain-${d.domain}`}>
        <div className="d-top"><span className="d-name">{d.domain}<Star d={d} /></span><span className="pill calm">알려주기</span></div>
        {pips(d)}
        <div className="d-status invite">알려주면 이 시기 목표 {d.gap}곳이 챙김으로 채워져요 · 급하지 않아요</div>
        <div className="d-actions">
          <button className="btn-sm fill" onClick={onOpen}>학원·집공부 알려주기</button>
          <button className="btn-sm" onClick={onOpen}>목표 {d.total}개 보기</button>
        </div>
      </div>
    )
  }
  if (d.group === 'partial') {
    return (
      <div className="domain" data-testid={`domain-${d.domain}`}>
        <div className="d-top"><span className="d-name">{d.domain}<Star d={d} /></span><span className="pill on">{d.on}곳 챙기는 중</span></div>
        {pips(d)}
        <div className="d-status">
          목표 {d.total}곳 · {d.done > 0 && <>이룸 {d.done} · </>}챙기는 중 {d.prog} · <b>알려주면 {d.gap}곳 더</b>
        </div>
        <div className="d-actions">
          <button className="btn-sm fill" onClick={onOpen}>남은 목표 알려주기</button>
          <button className="btn-sm" onClick={onOpen}>자세히</button>
        </div>
      </div>
    )
  }
  // full — 비어있는 곳 없음. 전부 이룸이면 '다 이뤘어요', 아니면 '다 챙기는 중'
  const allDone = d.total > 0 && d.done === d.total
  return (
    <div className="domain" data-testid={`domain-${d.domain}`}>
      <div className="d-top"><span className="d-name">{d.domain}<Star d={d} /></span><span className="pill full">{allDone ? '다 이뤘어요' : '다 챙기는 중'}</span></div>
      {pips(d)}
      <div className="d-status good">
        목표 {d.total}곳 모두 {allDone ? '이뤘어요' : '챙기는 중'}{d.total > 0 ? ' · ' : ''}<b>잘하고 있어요</b>
        {d.noPublic && <><br /><span style={{ color: 'var(--muted)', fontSize: 12 }}>정규 기준이 없어 선행 개념이 없어요</span></>}
      </div>
      <div className="d-actions"><button className="btn-sm" onClick={onOpen}>자세히</button></div>
    </div>
  )
}

export function AreaScreen({ dateLabel, domains, onOpenDetail, onObsCheck }: AreaScreenProps) {
  // 그룹 안에서 부모 우선 분야를 맨 위로 (중요도 = 부모가 온보딩에서 정함)
  const byPriority = (a: DomainVM, b: DomainVM) => Number(b.priority) - Number(a.priority)
  // ── 두 레인 분리 (SSOT §5) ──
  const learn = domains.filter((d) => d.lane === '학습')
  const life = domains.filter((d) => d.lane === '생활·마음').sort(byPriority)
  // 학습 레인: 정규 기준 없는 미설정 영역(영어)은 따로, 나머지는 상태별 gap-우선
  const toDefine = learn.filter((d) => d.noPublic && d.total === 0).sort(byPriority)
  const rest = learn.filter((d) => !(d.noPublic && d.total === 0))
  const empties = rest.filter((d) => d.group === 'empty').sort(byPriority)
  const partials = rest.filter((d) => d.group === 'partial').sort(byPriority)
  const fulls = rest.filter((d) => d.group === 'full').sort(byPriority)
  const onCount = partials.length + fulls.length
  const gapCount = empties.length
  const segOf = (d: DomainVM) => (d.group === 'empty' ? 'gap' : d.total > 0 && d.done === d.total ? 'on' : 'prog')

  return (
    <section className="view" data-testid="view-area">
      <div className="screen-pad">
        <p className="datestrip">{dateLabel}</p>

        <div className="overview">
          <div className="eyebrow">학습 — 이 나이에 챙길 영역</div>
          <div className="ov-num">
            {onCount === 0
              ? '아직 학원·집공부를 안 알려주셨어요'
              : <>{rest.length}개 영역 중 {onCount}곳 챙기고 있어요{gapCount > 0 && <> · <span className="ov-invite">알려주면 {gapCount}곳 더 채워져요</span></>}</>}
          </div>
          <div className="coverbar" aria-hidden="true">
            {rest.map((d) => <span key={d.domain} className={`seg ${segOf(d)}`} />)}
          </div>
          <div className="legend">
            <span><span className="lg-dot" style={{ background: 'var(--sage)' }} />이룸</span>
            <span><span className="lg-dot" style={{ background: 'color-mix(in srgb, var(--sage) 45%, transparent)' }} />챙기는 중</span>
            <span><span className="lg-dot" style={{ background: 'var(--honey-2)' }} />비어있음</span>
          </div>
          <TrustChip />
        </div>

        {empties.length > 0 && (
          <>
            <div className="dgrp-label">알려주면 여기가 채워져요</div>
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
        {toDefine.length > 0 && (
          <>
            <div className="dgrp-label">우리가 정하는 영역</div>
            {toDefine.map((d) => <DomainCard key={d.domain} d={d} onOpen={() => onOpenDetail(d.domain)} />)}
          </>
        )}

        {life.length > 0 && (
          <div className="lane-life" data-testid="lane-life">
            <div className="dgrp-label">생활·마음 · 일상에서 챙겨지고 있어요</div>
            {onObsCheck && (
              <button className="btn-obs" onClick={onObsCheck} data-testid="obs-entry">
                🌱 3분 우리 애 체크 — 생활·마음도 챙겨지는지 확인해요
              </button>
            )}
            {life.map((d) => <DomainCard key={d.domain} d={d} onOpen={() => onOpenDetail(d.domain)} calm />)}
          </div>
        )}
      </div>
    </section>
  )
}
