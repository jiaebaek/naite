/**
 * 기록 화면 (F4). docs/08-UI계약.md §6
 *
 * 피드백 ⑦ "어제 한 활동을 기록할 수 없다" · ⑧ "기록을 리포트처럼 보고 싶다".
 *
 * ⚠️ 긍정 프레이밍만 (C-6). 지난 날을 채울 수 있게 하되, 못 채운 날을 결핍으로
 *    강조하지 않는다. "한 것"을 센다. 소급 기록은 펫 토큰을 주지 않는다(오늘의 리듬 전용).
 */

import type { WeeklyReportRow } from '../../domain/report'
import type { ActivityId, IsoDate, Task } from '../../domain/types'

export interface WeekDay {
  readonly date: IsoDate
  readonly dayNum: number
  readonly dow: string
  readonly isToday: boolean
  readonly isFuture: boolean
  readonly doneCount: number
}

export interface LogScreenProps {
  readonly weekDays: readonly WeekDay[]
  readonly selectedDate: IsoDate
  readonly selectedLabel: string
  readonly selectedIsToday: boolean
  readonly onSelectDay: (date: IsoDate) => void
  /** 선택한 날에 할 수 있(었)던 활동들 (deriveTodayTasks) */
  readonly dayTasks: readonly Task[]
  /** 선택한 날 기록 토글 (소급 포함, 토큰 없음) */
  readonly onToggleDay: (activityId: ActivityId) => void
  readonly report: readonly WeeklyReportRow[]
}

export function LogScreen({
  weekDays,
  selectedDate,
  selectedLabel,
  selectedIsToday,
  onSelectDay,
  dayTasks,
  onToggleDay,
  report,
}: LogScreenProps) {
  return (
    <main className="page">
      <p className="log__lede">해온 것들을 한 겹씩 쌓아요</p>
      <p className="log__sub">지난 날도 눌러서 기록할 수 있어요. 못 채운 날은 그냥 비어 있을 뿐이에요.</p>

      {/* 주간 스트립 — 지난 날 선택해 기록 (⑦) */}
      <div className="week" role="group" aria-label="이번 주">
        {weekDays.map((d) => (
          <button
            key={d.date}
            type="button"
            className="week__day"
            aria-pressed={d.date === selectedDate}
            data-selected={String(d.date === selectedDate)}
            data-today={String(d.isToday)}
            data-future={String(d.isFuture)}
            disabled={d.isFuture}
            onClick={() => onSelectDay(d.date)}
          >
            <span className="week__dow">{d.dow}</span>
            <span className="week__num">{d.dayNum}</span>
            <span className="week__dot" aria-hidden="true" data-has={String(d.doneCount > 0)} />
          </button>
        ))}
      </div>

      {/* 선택한 날 기록 */}
      <section className="logday" aria-label={`${selectedLabel} 기록`}>
        <h2 className="logday__title">{selectedLabel}</h2>
        {!selectedIsToday && (
          <p className="logday__hint">이 날 한 것을 지금 체크해도 기록돼요.</p>
        )}
        {dayTasks.length === 0 ? (
          <p className="empty">이 날은 예정된 활동이 없어요</p>
        ) : (
          <ul className="logday__list">
            {dayTasks.map((t) => (
              <li key={t.activityId} className="logrow" data-testid={`logrow-${t.activityId}`}>
                <label className="logrow__check">
                  <input
                    type="checkbox"
                    className="task__box"
                    checked={t.done}
                    onChange={() => onToggleDay(t.activityId)}
                  />
                  <span className="logrow__name" data-done={String(t.done)}>{t.name}</span>
                </label>
                <span className="logrow__domain">{t.domain}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 주간 리포트 (⑧) — 한 것을 센다, 긍정 프레이밍 */}
      <h2 className="log__section">이번 주 기록</h2>
      {report.length === 0 ? (
        <p className="empty">아직 등록된 활동이 없어요</p>
      ) : (
        <ul className="report">
          {report.map((r) => (
            <li key={r.activityId} className="report__row" data-testid={`report-${r.activityId}`}>
              <div className="report__head">
                <span className="report__name">{r.name}</span>
                <span className="report__domain">{r.domain}</span>
                {r.done > 0 ? (
                  <span className="report__done">이번 주 {r.done}일</span>
                ) : (
                  <span className="report__none">이번 주 기록 없음</span>
                )}
                {r.streak !== undefined && r.streak > 0 && (
                  <span className="report__streak">🔥 {r.streak}일째</span>
                )}
              </div>
              {/* 막대 그래프 — 이번 주 '한 날' 빈도(요일 7칸 기준). 점수·목표대비 아님 (C-6) */}
              <div className="report__bar" aria-hidden="true">
                <span
                  className="report__bar-fill"
                  data-empty={String(r.done === 0)}
                  style={{ width: `${Math.min(r.done / 7, 1) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
