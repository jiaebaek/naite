/**
 * 지난 날 기록 바텀시트 — UX 리디자인 보강 §B (backfill).
 * 스트립의 날짜를 눌러 그 날 활동 체크시트를 연다. 토글 = 그 날짜 Record 추가/삭제.
 * 활동 연결 시트(§10)와 동일 패턴. 못 채운 날을 실패로 규정하지 않는다.
 */
import type { TaskVM } from './vm'
import { IconCheck, IconX } from './icons'

export interface DaySheetProps {
  readonly dateLabel: string
  readonly isToday: boolean
  readonly tasks: readonly TaskVM[]
  readonly onToggle: (activityId: string) => void
  readonly onClose: () => void
}

export function DaySheet({ dateLabel, isToday, tasks, onToggle, onClose }: DaySheetProps) {
  return (
    <div className="sheet-wrap" data-testid="day-sheet">
      <div className="sheet-bg" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label="지난 날 기록">
        <div className="grab" />
        <div className="sheet-head">
          <h3>{dateLabel}{isToday && ' · 오늘'}</h3>
          <button className="sheet-x" onClick={onClose} aria-label="닫기"><IconX /></button>
        </div>
        <p className="sheet-note">한 걸 눌러서 체크해요. 지난 날도 채울 수 있어요.</p>
        <div className="sheet-body">
          {tasks.length === 0 ? (
            <p className="empty-msg">이 날 예정된 활동이 없어요</p>
          ) : (
            tasks.map((t) => (
              <button
                key={t.activityId}
                type="button"
                className={`task${t.done ? ' done' : ''}`}
                data-testid={`day-task-${t.activityId}`}
                aria-pressed={t.done}
                onClick={() => onToggle(t.activityId)}
              >
                <span className="cbox"><IconCheck /></span>
                <span className="t-body">
                  <span className="t-top">
                    <span className="t-name">{t.name}</span>
                    <span className={`badge ${t.badgeCls}`}>{t.badgeLabel}</span>
                  </span>
                  <span className="t-aim"><span className="grp-tag">{t.domain}</span>{t.aim ? ` · ${t.aim}` : ''}</span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
