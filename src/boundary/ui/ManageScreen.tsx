/**
 * 관리 (drill-down) — UX 리디자인 §12.
 * 아이 정보 · 학원 · 활동 · 성취 됨-처리 · 기타. 추가/편집은 바텀시트 폼(ManageSheet)으로 연다.
 */
import type { Domain, StandardId } from '../../domain/types'
import { IconBack, IconCheck, IconPlus } from './icons'

export interface EntityRowVM {
  readonly id: string
  readonly name: string
  readonly sub: string
}
export interface AchGoalVM {
  readonly standardId: StandardId
  readonly statement: string
  readonly done: boolean
  readonly coveredByActivity: boolean
}
export interface AchGroupVM {
  readonly domain: Domain
  readonly goals: readonly AchGoalVM[]
}

export interface ManageScreenProps {
  readonly childLabel: string
  readonly academies: readonly EntityRowVM[]
  readonly activities: readonly EntityRowVM[]
  readonly achievement: readonly AchGroupVM[]
  readonly onBack: () => void
  readonly onToggleAchieved: (standardId: StandardId) => void
  readonly onOpenOnboarding: () => void
  readonly onAddAcademy: () => void
  readonly onEditAcademy: (id: string) => void
  readonly onAddActivity: () => void
  readonly onEditActivity: (id: string) => void
}

function Row({ vm, onEdit, testid }: { vm: EntityRowVM; onEdit: () => void; testid: string }) {
  return (
    <div className="mrow" data-testid={testid}>
      <div className="mmain"><div className="mn">{vm.name}</div><div className="ms2">{vm.sub}</div></div>
      <button className="btn-edit" onClick={onEdit}>편집</button>
    </div>
  )
}

export function ManageScreen(props: ManageScreenProps) {
  const {
    childLabel, academies, activities, achievement,
    onBack, onToggleAchieved, onOpenOnboarding,
    onAddAcademy, onEditAcademy, onAddActivity, onEditActivity,
  } = props

  return (
    <section className="view" data-testid="view-manage">
      <div className="screen-pad">
        <div className="detbar">
          <button className="back" onClick={onBack} aria-label="닫기"><IconBack /></button>
          <span className="dt-name">관리</span>
        </div>

        {/* 아이 정보 */}
        <div className="mng-sec">
          <div className="eyebrow">아이 정보</div>
          <h3 className="mng-title">시기의 기준</h3>
          <p className="mng-desc">생년월을 기준으로 “지금 나이에 챙길 목표”가 정해져요.</p>
          <div className="mrow">
            <div className="mmain"><div className="mn">첫째</div><div className="ms2">{childLabel}</div></div>
          </div>
        </div>

        {/* 학원 */}
        <div className="mng-sec">
          <div className="eyebrow">학원</div>
          <h3 className="mng-title">다니는 곳</h3>
          <p className="mng-desc">학원 일정은 ‘오늘’ 화면에 등원 알림으로 떠요.</p>
          {academies.map((a) => (
            <Row key={a.id} vm={a} testid={`academy-${a.id}`} onEdit={() => onEditAcademy(a.id)} />
          ))}
          <button className="mng-add" onClick={onAddAcademy}><IconPlus /> 학원 추가</button>
        </div>

        {/* 활동 */}
        <div className="mng-sec">
          <div className="eyebrow">활동</div>
          <h3 className="mng-title">챙기는 방법</h3>
          <p className="mng-desc">숙제·놀이 등 목표를 챙기는 활동. 학원 활동은 학원과 연결돼요.</p>
          {activities.map((a) => (
            <Row key={a.id} vm={a} testid={`activity-${a.id}`} onEdit={() => onEditActivity(a.id)} />
          ))}
          <button className="mng-add" onClick={onAddActivity}><IconPlus /> 활동 추가</button>
        </div>

        {/* 성취 기록 */}
        <div className="mng-sec">
          <div className="eyebrow">성취 기록</div>
          <h3 className="mng-title">이미 할 수 있는 것</h3>
          <p className="mng-desc">‘됨’으로 표시하면 그 목표는 <b>챙김</b>으로 처리돼, 오늘·영역에서 비어있음으로 뜨지 않아요. 활동으로 챙기는 목표는 여기서 자동으로 빠져요.</p>
          <div className="mng-dl-wrap">
            {achievement.map((g) => (
              <div key={g.domain}>
                <div className="mng-dl">{g.domain}</div>
                {g.goals.map((goal) => (
                  <div className="mrow mile" key={goal.standardId} data-testid={`goal-${goal.standardId}`}>
                    <div className="mmain"><div className="mn">{goal.statement}</div></div>
                    {goal.coveredByActivity && !goal.done ? (
                      <span className="mtag"><IconCheck w={14} />활동으로 챙김</span>
                    ) : (
                      <button
                        className={`mtoggle${goal.done ? ' on' : ''}`}
                        aria-pressed={goal.done}
                        onClick={() => onToggleAchieved(goal.standardId)}
                      >
                        {goal.done ? '됨' : '됨으로'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* 기타 */}
        <div className="mng-sec">
          <div className="eyebrow">기타</div>
          <div className="mrow">
            <div className="mmain"><div className="mn">온보딩 다시 보기</div><div className="ms2">이 앱을 소개하는 3장</div></div>
            <button className="btn-edit" onClick={onOpenOnboarding}>보기</button>
          </div>
        </div>
      </div>
    </section>
  )
}
