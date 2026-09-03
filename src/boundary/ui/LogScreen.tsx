/**
 * 기록 탭 (F4) — UX 리디자인 §12 + 보강 Addendum 01.
 * 나이테 링(지금 시기 채움률) + 이번 주 스트립(지난 날 backfill) + 활동별 주간 목표 달성.
 * 한 것만 센다(C-6). 주간 미완은 갭이 아니라 진행 중 — 허니(갭색) 쓰지 않는다.
 */
import type { Domain } from '../../domain/types'
import { IconCheck, NaiteRingBig } from './icons'

export interface WeekDayVM {
  readonly date: string
  readonly dow: string
  readonly dayNum: number
  readonly isToday: boolean
  readonly isFuture: boolean
  readonly doneCount: number
}

export interface RecordRowVM {
  readonly activityId: string
  readonly name: string
  readonly domain: Domain
  /** 이번 주 완료한 날 수 */
  readonly count: number
  /** 주간 목표 횟수. 0이면 자유 활동(목표 없음) */
  readonly target: number
  /** 주간 목표 달성 여부 — 도메인 판정 */
  readonly met: boolean
}

export interface LogScreenProps {
  /** 지금 시기 채움률 0~1 (바깥 겹) */
  readonly pct: number
  /** 이번 주 하나라도 챙긴 날 수 */
  readonly weekDoneDays: number
  readonly weekDays: readonly WeekDayVM[]
  readonly rows: readonly RecordRowVM[]
  /** 지난/오늘 날짜를 눌러 그 날 기록을 채운다 (backfill 시트) */
  readonly onDayClick: (date: string) => void
}

/** 목표 대비 달성 pip 행. 완료=세이지, 미완=중립 회색(허니 아님). */
function Pips({ count, target }: { count: number; target: number }) {
  const filled = Math.min(count, target)
  return (
    <div className="rec-pips" aria-hidden="true">
      {Array.from({ length: target }, (_, i) => <i key={i} className={i < filled ? 'on' : ''} />)}
    </div>
  )
}

/** 활동별 상태 표기 (§보강 A 상태 규칙). */
function RecStatus({ row }: { row: RecordRowVM }) {
  if (row.met) {
    return <span className="rec-done"><IconCheck w={13} />완료</span>
  }
  if (row.count === 0) {
    return <span className="rec-cnt zero">이번 주 없음</span>
  }
  if (row.target > 0) {
    return <span className="rec-cnt">{row.count}/{row.target}회</span>
  }
  return <span className="rec-cnt">{row.count}회</span>
}

export function LogScreen({ pct, weekDoneDays, weekDays, rows, onDayClick }: LogScreenProps) {
  const pctLabel = Math.round(Math.max(0, Math.min(1, pct)) * 100)
  return (
    <section className="view" data-testid="view-log">
      <div className="screen-pad">
        <div className="rec-hero">
          <h2 className="rec-title">한 겹씩 쌓이는 중</h2>
          <p className="rec-sub">해온 것들이 나이테처럼 쌓여요. 앞서가지 않아도, 매년 한 겹씩.</p>
          <NaiteRingBig pct={pct} />
          <p className="rc-caption">바깥 겹 = 지금 시기 ({pctLabel}% 채움) · 안쪽 = 지난 시기</p>
        </div>

        <div className="sec">
          <div className="sec-head">
            <h2 className="sec-title" style={{ fontSize: 16 }}>이번 주</h2>
            <span className="sec-count" data-testid="week-done">{weekDoneDays}일 챙김</span>
          </div>
          <div className="week">
            {weekDays.map((d) => (
              <button
                key={d.date}
                type="button"
                className={`wd${d.doneCount > 0 ? ' fill' : ''}${d.isToday ? ' today' : ''}`}
                data-testid={`wd-${d.date}`}
                disabled={d.isFuture}
                aria-label={`${d.dow} ${d.dayNum}일${d.doneCount > 0 ? ` · ${d.doneCount}개 챙김` : ''}`}
                onClick={() => onDayClick(d.date)}
              >
                <span className="wd-lbl">{d.dow}</span>
                <span className="wd-dot">{d.doneCount > 0 ? d.doneCount : '·'}</span>
              </button>
            ))}
          </div>
          <p className="week-note">지난 날을 눌러 채울 수 있어요 · 못 채운 날은 그냥 비어 있을 뿐이에요.</p>
        </div>

        <div className="rec-list">
          <div className="eyebrow" style={{ marginBottom: 6 }}>활동별 이번 주</div>
          {rows.length === 0 ? (
            <p className="empty-msg">아직 등록된 활동이 없어요</p>
          ) : (
            rows.map((r) => (
              <div key={r.activityId} className="rec-item" data-testid={`rec-${r.activityId}`}>
                <div className="rec-main">
                  <div className="rec-nm">{r.name}<span>{r.domain}</span></div>
                  {r.target > 0 && <Pips count={r.count} target={r.target} />}
                </div>
                <RecStatus row={r} />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
