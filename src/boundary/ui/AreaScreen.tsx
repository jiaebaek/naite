/**
 * 영역 화면 (F3) — UX 리디자인 §8 lean (백로그 B · 2026-09).
 *
 * ⭐ progressive disclosure: 잘한 건 **접힌 한 줄**, 살펴볼 것 **1~2개만** 카드. 대시보드처럼 안 빽빽하게.
 *   - 상단 = 안심 한 줄(말로). 커버리지 바·숫자·pip·3그룹 정렬 제거(상세로 내림 · §9).
 *   - 미입력 학습 = 경보 아니라 **초대**(점선·"알려주면 채워져요"·"급하지 않아요").
 *   - 생활·마음 레인·"3분 체크"는 그대로(이미 안심 톤). **표시만 바꿈 — 계산(커버리지)은 불변.**
 *   목업: docs/ux/mockup-영역탭-단순화.html. 성장 좌표(§9)는 카드/줄 탭 → 영역 상세에서.
 */
import { useState } from 'react'
import type { Domain } from '../../domain/types'
import type { DomainVM, MilestoneVM } from './vm'

export interface AreaScreenProps {
  readonly dateLabel: string
  readonly domains: readonly DomainVM[]
  readonly onOpenDetail: (domain: Domain) => void
  /** 생활·마음 관찰 체크 모듈 열기(§10). */
  readonly onObsCheck?: (() => void) | undefined
}

const pipOf = (m: MilestoneVM) => (m.status === '됨' ? 'on' : m.status === '챙기는중' ? 'prog' : 'gap')
const Star = ({ d }: { d: DomainVM }) => (d.priority ? <span className="d-star" title="부모가 정한 우선 분야">중요</span> : null)

/** 잘 챙기는 영역의 상태를 '말로'(숫자 없이). */
function wellStatus(d: DomainVM): string {
  const allDone = d.total > 0 && d.done === d.total
  if (d.group === 'full') return allDone ? '다 이뤘어요' : '잘 되고 있어요'
  return d.gap === 1 ? '하나 남음' : `${d.gap}곳 남음`
}

/** 잘 챙기는 영역 = 접힌 한 줄(탭하면 펼쳐 조망). 카드로 안 깔린다. */
function WellFold({ wells, onOpen }: { wells: readonly DomainVM[]; onOpen: (d: Domain) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="wellfold">
      <button className="wellfold-head" onClick={() => setOpen((v) => !v)} aria-expanded={open} data-testid="well-fold">
        <span className="wf-t">✓ {wells.map((w) => w.domain).join(' · ')} — 잘 되고 있어요</span>
        <span className="wf-c" aria-hidden="true">{open ? '⌄' : '›'}</span>
      </button>
      {open && (
        <div className="wellfold-body">
          {wells.map((d) => (
            <button key={d.domain} className="well-row" data-testid={`domain-${d.domain}`} onClick={() => onOpen(d.domain)}>
              <span className="wr-nm">{d.domain}<Star d={d} /></span>
              <span className="wr-st">{wellStatus(d)} ›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** 살펴볼 곳 = 점선 초대 카드(경보 아님). 미입력 학습 / 정규기준 없는 영역(영어). */
function InviteCard({ d, onOpen }: { d: DomainVM; onOpen: (d: Domain) => void }) {
  const isDefine = d.noPublic && d.total === 0
  return (
    <button className="invite-card" data-testid={`domain-${d.domain}`} onClick={() => onOpen(d.domain)}>
      <div className="ic-top"><b>{d.domain}<Star d={d} /></b><span className="ic-tag">{isDefine ? '목표 정하기' : '알려주기'}</span></div>
      <div className="ic-d">{isDefine
        ? '정규 기준이 없는 영역이에요. 우리 집 목표를 정해요.'
        : <>알려주면 이 시기 목표 {d.gap}곳이 채워져요. <span className="ic-m">급하지 않아요.</span></>}</div>
    </button>
  )
}

/** '그 밖에 N곳'도 접어 둔다(살펴볼 것은 1~2개만 먼저). */
function RestFold({ rest, onOpen }: { rest: readonly DomainVM[]; onOpen: (d: Domain) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="wellfold">
      <button className="wellfold-head" onClick={() => setOpen((v) => !v)} aria-expanded={open} data-testid="rest-fold">
        <span className="wf-t">그 밖에 {rest.length}곳 — 알려주면 채워져요</span>
        <span className="wf-c" aria-hidden="true">{open ? '⌄' : '›'}</span>
      </button>
      {open && <div className="wellfold-body">{rest.map((d) => <InviteCard key={d.domain} d={d} onOpen={onOpen} />)}</div>}
    </div>
  )
}

/** 생활·마음(안심) 레인 카드 — 갭 알람 없이 부드럽게(유지). */
function LifeCard({ d, onOpen }: { d: DomainVM; onOpen: () => void }) {
  const allDone = d.group === 'full' && d.total > 0 && d.done === d.total
  return (
    <div className="domain calm" data-testid={`domain-${d.domain}`}>
      <div className="d-top"><span className="d-name">{d.domain}<Star d={d} /></span><span className="pill">일상에서</span></div>
      <div className="ring-row" aria-hidden="true">{d.milestones.map((m, i) => <span key={i} className={`pip ${pipOf(m)}`} />)}</div>
      <div className="d-status">{allDone ? '일상에서 잘 챙겨지고 있어요' : '유치원·일상에서 챙겨지고 있어요'}{d.prog + d.done > 0 ? ` · 이미 ${d.prog + d.done}곳 확인` : ''}</div>
      <div className="d-actions"><button className="btn-sm" onClick={onOpen}>자세히</button></div>
    </div>
  )
}

export function AreaScreen({ dateLabel, domains, onOpenDetail, onObsCheck }: AreaScreenProps) {
  const byPriority = (a: DomainVM, b: DomainVM) => Number(b.priority) - Number(a.priority)
  const learn = domains.filter((d) => d.lane === '학습')
  const life = domains.filter((d) => d.lane === '생활·마음').sort(byPriority)
  // 정규 기준 없는 미설정 영역(영어) = '목표 정하기' 초대. 나머지 학습은 잘함/살펴볼로.
  const define = learn.filter((d) => d.noPublic && d.total === 0).sort(byPriority)
  const rest = learn.filter((d) => !(d.noPublic && d.total === 0))
  const wells = rest.filter((d) => d.group !== 'empty').sort(byPriority) // 채우는 중 + 다 챙김
  const empties = rest.filter((d) => d.group === 'empty').sort(byPriority)
  const emptyVisible = empties.slice(0, 2)
  const emptyRest = empties.slice(2)
  const lookCount = empties.length + define.length

  const relief = wells.length === 0 && lookCount > 0
    ? '학습, 지금부터 채워가요'
    : lookCount === 0
      ? '학습, 다 챙기고 있어요'
      : '학습, 대부분 잘 되고 있어요'
  const reliefSub = wells.length === 0 && lookCount > 0
    ? '유치원·일상은 이미 챙겨지고 있어요'
    : '전문가가 세운 기준으로 봤을 때'

  return (
    <section className="view" data-testid="view-area">
      <div className="screen-pad">
        <p className="datestrip">{dateLabel}</p>

        <div className="relief" data-testid="learn-relief">
          <div className="relief-line serif">{relief}</div>
          <div className="relief-sub">{reliefSub}</div>
        </div>

        {wells.length > 0 && <WellFold wells={wells} onOpen={onOpenDetail} />}

        {lookCount > 0 && (
          <>
            <div className="look-label">살펴볼 곳 {lookCount === 1 ? '하나' : `${lookCount}곳`}</div>
            {emptyVisible.map((d) => <InviteCard key={d.domain} d={d} onOpen={onOpenDetail} />)}
            {define.map((d) => <InviteCard key={d.domain} d={d} onOpen={onOpenDetail} />)}
            {emptyRest.length > 0 && <RestFold rest={emptyRest} onOpen={onOpenDetail} />}
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
            {life.map((d) => <LifeCard key={d.domain} d={d} onOpen={() => onOpenDetail(d.domain)} />)}
          </div>
        )}
      </div>
    </section>
  )
}
