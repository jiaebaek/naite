/**
 * 오늘 화면 (F1). docs/08-UI계약.md §2
 *
 * ⚠️ 제1원칙 (INV-UI-00): UI 는 판단하지 않는다.
 *    경고 여부는 `shouldWarnOnMiss()` 로만 결정한다.
 *    여기서 `nature === '필수'` 같은 비교를 하면 도메인 계약이 장식이 된다.
 */

import { useState } from 'react'
import { shouldWarnOnMiss } from '../../domain/nature'
import { DOMAINS } from '../../domain/types'
import type { ActivityId, Domain, IsoDate, Task } from '../../domain/types'
import { provenanceLabel } from './labels'

export interface TodayScreenProps {
  readonly date: IsoDate
  readonly tasks: readonly Task[]
  readonly onToggle: (activityId: ActivityId) => void
  /** 오늘 화면 상단 펫 (선택). 도메인과 무관하게 주입한다. */
  readonly pet?: React.ReactNode
  /** 오늘 등원하는 학원 일정. 체크 없이 정보로만 (INV-ACAD-03) */
  readonly schedule?: readonly { readonly name: string; readonly time?: string }[]
}

/** 'YYYY-MM-DD' → '11월 4일 수요일' */
function formatDate(date: IsoDate): string {
  const [y, m, d] = date.split('-').map(Number)
  const dow = ['일', '월', '화', '수', '목', '금', '토'][
    new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1)).getUTCDay()
  ]
  return `${m}월 ${d}일 ${dow}요일`
}

export function TodayScreen({ date, tasks, onToggle, pet, schedule }: TodayScreenProps) {
  // INV-UI-04 — 영역별 그룹핑. DOMAINS 순서를 따라 화면 순서를 고정한다.
  const byDomain = DOMAINS.map(
    (domain) => [domain, tasks.filter((t) => t.domain === domain)] as const,
    // INV-UI-05 — 할 일 없는 영역은 렌더하지 않는다
  ).filter(([, list]) => list.length > 0)

  return (
    <main className="page">
      <p className="page__date">{formatDate(date)}</p>

      {pet}

      {/* INV-ACAD-03 — 오늘 등원 학원. 체크 없이 일정으로만 */}
      {schedule && schedule.length > 0 && (
        <section className="schedule" data-testid="schedule" aria-label="오늘 학원">
          {schedule.map((s) => (
            <span key={s.name} className="schedule__item">
              📍 {s.name}
              {s.time && <span className="schedule__time"> {s.time}</span>}
            </span>
          ))}
        </section>
      )}

      {byDomain.length === 0 ? (
        <p className="empty">오늘은 예정된 활동이 없어요</p>
      ) : (
        byDomain.map(([domain, list]) => (
          <DomainGroup key={domain} domain={domain} tasks={list} onToggle={onToggle} />
        ))
      )}
    </main>
  )
}

function DomainGroup({
  domain,
  tasks,
  onToggle,
}: {
  domain: Domain
  tasks: readonly Task[]
  onToggle: (id: ActivityId) => void
}) {
  return (
    <section className="domain" aria-labelledby={`domain-${domain}`}>
      <h2 className="domain__title" id={`domain-${domain}`}>
        {domain}
      </h2>
      {tasks.map((t) => (
        <TaskRow key={t.activityId} task={t} onToggle={onToggle} />
      ))}
    </section>
  )
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (id: ActivityId) => void }) {
  // 다중 목표일 때만 펼침 (③④ — 오늘은 요약, 전체 매핑은 현황 탭)
  const [open, setOpen] = useState(false)

  // 주간 목표를 채웠으면 오늘 체크 여부와 무관하게 "이번 주 할 일"은 끝났다.
  // `met` 은 도메인이 계산한다 (INV-TASK-11) — 여기서 done >= times 를 비교하면 INV-UI-00 위반.
  const weekMet = task.weeklyProgress?.met ?? false

  // INV-UI-11 — 도메인이 내린 판단을 그대로 따른다.
  const warn = !task.done && !weekMet && shouldWarnOnMiss(task.nature)

  // 대표 목표 = 첫째 (도메인이 공교육 우선으로 정렬해 보냄). 나머지 개수.
  const rep = task.targets[0]
  const extra = task.targets.length - 1

  /*
   * INV-UI-36 — 주간 목표를 채워도 체크박스는 남긴다 (되돌릴 수 있어야 한다).
   * 체크박스+이름만 <label> 로 묶어 탭하면 완료 토글. 목표 요약 줄은 바깥에 둬
   * '펼치기' 탭과 '완료' 탭이 겹치지 않게 한다 (다중 목표 표시 결정).
   */
  return (
    <div
      className="task"
      data-testid={`task-${task.activityId}`}
      data-warn={String(warn)}
      data-done={String(task.done)}
      data-week-met={String(weekMet)}
    >
      <div className="task__row">
        <label className="task__check">
          <input
            className="task__box"
            type="checkbox"
            checked={task.done}
            // INV-UI-06 — 탭 1회로 기록. 확인 다이얼로그 없음.
            // INV-UI-07 — 추가 입력을 요구하지 않는다.
            onChange={() => onToggle(task.activityId)}
          />
          <span className="task__name">{task.name}</span>
        </label>
        <div className="task__meta">
          {/* INV-UI-29 — 색만으로 정보를 전달하지 않는다. 출처(공교육/자체)를 글자로. 피드백 ④ */}
          <span className="task__prov">
            {task.targets.length === 0 ? '자유' : provenanceLabel(rep!.provenance)}
          </span>
          {renderMeta(task, weekMet)}
        </div>
      </div>

      {/* 연결된 목표 — 피드백 ③ */}
      <div className="task__goal">
        {task.targets.length === 0 ? (
          <span className="task__goalnone">겨냥 목표 없음</span>
        ) : extra > 0 ? (
          <button
            type="button"
            className="task__goallink"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="task__arrow" aria-hidden="true">→</span> {rep!.statement}
            <span className="task__more">외 {extra}개</span>
            <span aria-hidden="true">{open ? ' ▴' : ' ▾'}</span>
          </button>
        ) : (
          <span className="task__goal1">
            <span className="task__arrow" aria-hidden="true">→</span> {rep!.statement}
          </span>
        )}
      </div>

      {open && extra > 0 && (
        <ul className="task__goals">
          {task.targets.map((t) => (
            <li key={t.standardId}>
              <span className="task__gs">{t.statement}</span>
              <span className="task__prov task__prov--sm">{provenanceLabel(t.provenance)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** 진행 · 완료 배지 · 연속 기록 */
function renderMeta(task: Task, weekMet: boolean) {
  return (
    <>
      {/*
        INV-UI-09 — 주N회는 주간 진행을 함께.
        INV-UI-35 — 채웠으면 숫자 대신 완료 배지. 다 했으면 숫자는 볼 일이 없다.
      */}
      {task.weeklyProgress &&
        (weekMet ? (
          <span className="task__weekdone">
            <span aria-hidden="true">✓</span> 이번 주 완료
          </span>
        ) : (
          <span className="task__progress">
            {task.weeklyProgress.done}/{task.weeklyProgress.times}
          </span>
        ))}

      {/* INV-UI-34 — 매일 활동은 이월되지 않는다. 대신 이어온 기록을 보여준다 */}
      {task.streak !== undefined && <span className="task__streak">{task.streak}일째</span>}
    </>
  )
}
