/**
 * 오늘 화면 (F1) — UX 리디자인 §07.
 * 위→아래: 날짜/나이 → 갭 배너(최우선) → 오늘 할 일(+등원) → 펫(강등).
 */
import type { Domain } from '../../domain/types'
import type { TaskVM } from './vm'
import { IconArrow, IconCheck, Sprout } from './icons'

export interface GapBanner {
  readonly gapCount: number
  readonly onCount: number
  readonly totalDomains: number
  readonly gapNames: readonly string[]
  readonly clear: boolean
  readonly segs: readonly ('on' | 'gap')[]
}

export interface TodayScreenProps {
  readonly dateLabel: string
  readonly banner: GapBanner
  readonly progress: { readonly done: number; readonly total: number }
  readonly schedule: readonly { readonly time?: string; readonly name: string }[]
  readonly groups: readonly { readonly domain: Domain; readonly tasks: readonly TaskVM[] }[]
  readonly onToggle: (activityId: string) => void
  readonly onGoArea: () => void
}

export function TodayScreen({ dateLabel, banner, progress, schedule, groups, onToggle, onGoArea }: TodayScreenProps) {
  const left = progress.total - progress.done
  const petTitle =
    progress.total === 0
      ? '오늘 예정된 활동이 없어요'
      : left <= 0
        ? '오늘 다 챙겼어요! 새싹에게 물을 주세요 💧'
        : progress.done === 0
          ? `오늘 ${progress.total}개 채우면 물을 줄 수 있어요`
          : `오늘 ${left}개 더 채우면 물을 줄 수 있어요`
  const petPct = progress.total > 0 ? (progress.done / progress.total) * 100 : 0

  return (
    <section className="view" data-testid="view-today">
      <div className="screen-pad">
        <p className="datestrip">{dateLabel}</p>

        {/* 갭 배너 */}
        <div className={`gapcard${banner.clear ? ' clear' : ''}`}>
          <div className="eyebrow">이번 시기 챙김</div>
          {banner.clear ? (
            <>
              <div className="gap-head">지금은 놓친 곳이 없어요</div>
              <p className="gap-sub">{banner.totalDomains}개 영역을 모두 챙기고 있어요. 잘하고 있어요.</p>
              <div className="coverbar" aria-hidden="true">
                {banner.segs.map((s, i) => <span key={i} className={`seg ${s}`} />)}
              </div>
            </>
          ) : (
            <>
              <div className="gap-head">지금 {banner.gapCount}곳이 비어있어요</div>
              <p className="gap-sub">{banner.totalDomains}개 영역 중 {banner.onCount}곳은 잘 챙기고 있어요. 나머지만 채우면 돼요.</p>
              <div className="coverbar" aria-hidden="true">
                {banner.segs.map((s, i) => <span key={i} className={`seg ${s}`} />)}
              </div>
              <div className="chiprow">
                {banner.gapNames.map((n) => (
                  <span key={n} className="chip"><span className="dot" />{n}</span>
                ))}
              </div>
              <button className="btn-primary" onClick={onGoArea}>
                비어있는 곳 채우러 가기 <IconArrow />
              </button>
            </>
          )}
        </div>

        {/* 오늘 할 일 */}
        <div className="sec">
          <div className="sec-head">
            <h2 className="sec-title">오늘 할 일</h2>
            <span className="sec-count" data-testid="today-count">{progress.done} / {progress.total}</span>
          </div>

          {schedule.length > 0 && (
            <div className="sched" data-testid="schedule">
              {schedule.map((s) => (
                <div key={s.name} className="sched-item">
                  {s.time && <div className="sched-time">{s.time}</div>}
                  <div className="sched-name">{s.name} 등원</div>
                </div>
              ))}
            </div>
          )}

          {groups.length === 0 ? (
            <p className="empty-msg">오늘은 예정된 활동이 없어요</p>
          ) : (
            groups.map((g) => (
              <div key={g.domain}>
                <div className="grp">{g.domain}</div>
                {g.tasks.map((t) => (
                  <button
                    key={t.activityId}
                    type="button"
                    className={`task${t.done ? ' done' : ''}`}
                    data-testid={`task-${t.activityId}`}
                    aria-pressed={t.done}
                    onClick={() => onToggle(t.activityId)}
                  >
                    <span className="cbox"><IconCheck /></span>
                    <span className="t-body">
                      <span className="t-top">
                        <span className="t-name">{t.name}</span>
                        <span className={`badge ${t.badgeCls}`}>{t.badgeLabel}</span>
                      </span>
                      {t.aim ? (
                        <span className="t-aim"><span className="arrow">겨냥</span> {t.aim}</span>
                      ) : (
                        <span className="t-aim none">겨냥 목표 없음</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        {/* 펫 (강등) */}
        <div className="pet">
          <div className="pet-icon"><Sprout /></div>
          <div className="pet-txt">
            <div className="pet-title">{petTitle}</div>
            <div className="pet-sub">할 일을 하면 새싹이 한 뼘씩 자라요</div>
            <div className="pet-meter"><div className="pet-fill" style={{ width: `${petPct}%` }} /></div>
          </div>
        </div>
      </div>
    </section>
  )
}
