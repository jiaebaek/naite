/**
 * 오늘 화면 (F1) = 통찰-먼저 메인 — UX 리디자인 §07 (개정 2026-09 · T11 · doc13 D3).
 *
 * 한눈에 안심이 최우선. 위→아래:
 *   ① 안심 히어로(나이테 링 + "대부분 잘 되고 있어요" + 안도 서브 + 전문가 권위 배지)
 *   ② 2레인 요약 바(학습 / 생활·마음) — 학습 미입력은 가짜 %가 아니라 "아직 안 알려주셨어요"(정직 가드)
 *   ③ 넛지 1개(급하지 않은 톤) → ④ 오늘 할 일·등원 → ⑤ 펫(하단 슬림)
 * "갭 먼저"는 폐기 — 갭이 아니라 안도가 문을 연다(원칙6). 목업: docs/ux/mockup-메인-통찰먼저.html
 */
import type { Domain } from '../../domain/types'
import type { TaskVM } from './vm'
import { IconCheck, Sprout } from './icons'

/** 한 레인의 묶음 요약. */
export interface LaneSummary {
  readonly total: number
  /** 챙김(챙기는 중 + 이룸) 묶음 수 */
  readonly on: number
  /** 부모/기관이 실제로 챙기는 커버가 있나 — 없으면 가짜 %로 안 채운다(정직 가드) */
  readonly hasInput: boolean
}

/** 딱 하나 더 볼 곳 (급하지 않은 넛지). */
export interface Nudge {
  readonly domain: string
  readonly title: string
  readonly effortMin?: number
}

/** 통찰 메인이 렌더하는 요약 VM (App 이 계산). */
export interface InsightVM {
  /** 지원 범위(만 3세~초2) 밖 — 거짓 안도 대신 예외 안내 */
  readonly outOfRange: boolean
  readonly ringPct: number
  readonly onClusters: number
  readonly totalClusters: number
  readonly learn: LaneSummary
  readonly life: LaneSummary
  readonly nudge: Nudge | null
}

export interface TodayScreenProps {
  readonly dateLabel: string
  readonly insight: InsightVM
  readonly progress: { readonly done: number; readonly total: number }
  readonly schedule: readonly { readonly time?: string; readonly name: string }[]
  readonly groups: readonly { readonly domain: Domain; readonly tasks: readonly TaskVM[] }[]
  readonly onToggle: (activityId: string) => void
  /** 영역 탭으로 (넛지·자세히) */
  readonly onGoArea: () => void
  /** 안도 공유 카드 열기(§07-A) */
  readonly onShare: () => void
  /** 선택적 학습 정교화(§06-C) 열기 — "학원 추가하면 더 정확해져요" */
  readonly onAddLearn?: (() => void) | undefined
}

/** 나이테 링(부분 참) + 중앙 카운트. */
function Ring({ onC, totalC, pct }: { onC: number; totalC: number; pct: number }) {
  const r = 34
  const C = 2 * Math.PI * r
  const dash = Math.max(0, Math.min(1, pct / 100)) * C
  return (
    <svg width={104} height={104} viewBox="0 0 112 112" className="ih-ring" aria-hidden="true">
      <circle cx="56" cy="56" r={r} fill="none" stroke="var(--line-strong)" strokeWidth={11} />
      <circle cx="56" cy="56" r={r} fill="none" stroke="var(--sage)" strokeWidth={11} strokeLinecap="round"
        strokeDasharray={`${dash} ${C - dash}`} transform="rotate(-90 56 56)" />
      <text x="56" y="52" textAnchor="middle" fontSize="22" fontWeight="500" fill="var(--ink)">{onC}</text>
      <text x="56" y="70" textAnchor="middle" fontSize="11" fill="var(--muted)">/ {totalC}곳</text>
    </svg>
  )
}

/** 레인 한 줄 — 라벨 + 힌트 + 바(미입력이면 흐린 바 + 초대 문구). */
function LaneBar({ label, hint, s, inviteText }: { label: string; hint: string; s: LaneSummary; inviteText: string }) {
  const pct = s.total > 0 ? Math.round((s.on / s.total) * 100) : 0
  const faint = !s.hasInput
  return (
    <div className="lane2">
      <div className="lane2-row">
        <b>{label}</b>
        <span className={faint ? 'invite' : ''}>{faint ? inviteText : hint}</span>
      </div>
      <div className={`bar${faint ? ' faint' : ''}`} aria-hidden="true">
        <i style={{ width: `${faint ? 0 : pct}%` }} />
      </div>
    </div>
  )
}

export function TodayScreen({ dateLabel, insight, progress, schedule, groups, onToggle, onGoArea, onShare, onAddLearn }: TodayScreenProps) {
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

  const { learn, life } = insight
  const heroLine = insight.onClusters > 0 ? <>이 시기 챙길 것,<br />대부분 잘 되고 있어요</> : <>지금 나이에 챙길 것을<br />준비했어요</>
  const heroSub = life.on > 0 ? '유치원·일상에서 대부분 챙겨지고 있어요' : '오늘 하나씩, 천천히 채워가요'

  return (
    <section className="view" data-testid="view-today">
      <div className="screen-pad">
        <p className="datestrip">{dateLabel}</p>

        {insight.outOfRange ? (
          <div className="gapcard">
            <div className="eyebrow">이번 시기 현황</div>
            <div className="gap-head">아직 이 나이는 준비 중이에요</div>
            <p className="gap-sub">나이테는 지금 <b>미취학(만 3세)~초등 2학년</b>까지 전문가가 세운 국가 기준을 담고 있어요. 그 위 학년은 기준 데이터를 확보하는 대로 열어갈게요.</p>
          </div>
        ) : (
          <>
            {/* ① 안심 히어로 */}
            <div className="insight-hero" data-testid="insight-hero">
              <Ring onC={insight.onClusters} totalC={insight.totalClusters} pct={insight.ringPct} />
              <div className="ih-line serif">{heroLine}</div>
              <div className="ih-sub">{heroSub}</div>
              <div className="ih-auth">🏅 아이 발달·교육 전문가들이 세운 기준으로 정리</div>
            </div>

            {/* ② 2레인 요약 바 */}
            <div className="lanes2" data-testid="lanes2">
              <LaneBar label="학습 · 국·영·수·과" hint="우리 학원·집이 챙겨요" s={learn}
                inviteText="아직 학원·집공부를 안 알려주셨어요" />
              <LaneBar label="생활·마음" hint="유치원·일상에서" s={life}
                inviteText="유치원·학교를 알려주면 채워져요" />
            </div>

            {/* ③ 넛지 1개 — 급하지 않은 톤 */}
            {insight.nudge && (
              <button className="nudge1" data-testid="nudge" onClick={onGoArea}>
                <span className="n-t">딱 하나 더 본다면 · {insight.nudge.domain}</span>
                <span className="n-d">{insight.nudge.title}{insight.nudge.effortMin ? ` · ${insight.nudge.effortMin}분` : ''}</span>
                <span className="n-m">급하지 않아요. 이 시기에 자연스럽게 하면 좋은 것.</span>
              </button>
            )}

            {onAddLearn && (
              <button className="add-learn" onClick={onAddLearn} data-testid="add-learn">
                우리 애 학원 추가하면 더 정확해져요
              </button>
            )}

            <button className="share-link" onClick={onShare}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M12 15V3M8 7l4-4 4 4" />
              </svg>
              우리 아이 좌표 공유하기
            </button>
          </>
        )}

        {/* ④ 오늘 할 일 */}
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

        {/* ⑤ 펫 (강등) */}
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
