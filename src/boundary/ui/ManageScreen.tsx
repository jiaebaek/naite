/**
 * 관리 (drill-down) — UX 리디자인 §11.
 * 아이 정보 · 학원 · 활동 · 성취 기록(됨 처리) · 기타(온보딩 다시 보기).
 * 일상 루프 밖의 설정 화면. 활동·학원 등록과 '됨' 처리가 여기서 이뤄진다.
 */
import { useState } from 'react'
import type {
  AcademyInput,
  ActivityInput,
  Cadence,
  Domain,
  StandardId,
  Weekday,
} from '../../domain/types'
import { DOMAINS } from '../../domain/types'
import { IconBack, IconCheck, IconPlus } from './icons'

export interface AcademyRowVM {
  readonly id: string
  readonly name: string
  readonly sub: string
}
export interface ActivityRowVM {
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
  readonly academies: readonly AcademyRowVM[]
  readonly activities: readonly ActivityRowVM[]
  readonly achievement: readonly AchGroupVM[]
  readonly onBack: () => void
  readonly onToggleAchieved: (standardId: StandardId) => void
  readonly onOpenOnboarding: () => void
  readonly onCreateAcademy: (input: AcademyInput) => void
  readonly onDeactivateAcademy: (id: string) => void
  readonly onCreateActivity: (input: ActivityInput) => void
  readonly onDeactivateActivity: (id: string) => void
}

const WD: readonly { label: string; value: Weekday }[] = [
  { label: '월', value: 1 }, { label: '화', value: 2 }, { label: '수', value: 3 },
  { label: '목', value: 4 }, { label: '금', value: 5 }, { label: '토', value: 6 }, { label: '일', value: 0 },
]

export function ManageScreen(props: ManageScreenProps) {
  const {
    childLabel, academies, activities, achievement,
    onBack, onToggleAchieved, onOpenOnboarding,
    onCreateAcademy, onDeactivateAcademy, onCreateActivity, onDeactivateActivity,
  } = props

  const [addAcademy, setAddAcademy] = useState(false)
  const [addActivity, setAddActivity] = useState(false)

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
            <div className="mrow" key={a.id} data-testid={`academy-${a.id}`}>
              <div className="mmain"><div className="mn">{a.name}</div><div className="ms2">{a.sub}</div></div>
              <button className="btn-edit" onClick={() => onDeactivateAcademy(a.id)}>삭제</button>
            </div>
          ))}
          {addAcademy
            ? <AcademyForm onSubmit={(i) => { onCreateAcademy(i); setAddAcademy(false) }} onCancel={() => setAddAcademy(false)} />
            : <button className="mng-add" onClick={() => setAddAcademy(true)}><IconPlus /> 학원 추가</button>}
        </div>

        {/* 활동 */}
        <div className="mng-sec">
          <div className="eyebrow">활동</div>
          <h3 className="mng-title">챙기는 방법</h3>
          <p className="mng-desc">숙제·놀이 등 목표를 챙기는 활동. 학원 활동은 학원과 연결돼요.</p>
          {activities.map((a) => (
            <div className="mrow" key={a.id} data-testid={`activity-${a.id}`}>
              <div className="mmain"><div className="mn">{a.name}</div><div className="ms2">{a.sub}</div></div>
              <button className="btn-edit" onClick={() => onDeactivateActivity(a.id)}>삭제</button>
            </div>
          ))}
          {addActivity
            ? <ActivityForm onSubmit={(i) => { onCreateActivity(i); setAddActivity(false) }} onCancel={() => setAddActivity(false)} />
            : <button className="mng-add" onClick={() => setAddActivity(true)}><IconPlus /> 활동 추가</button>}
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

/* ── 학원 추가 폼 ─────────────────────────────────── */
function AcademyForm({ onSubmit, onCancel }: { onSubmit: (i: AcademyInput) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [days, setDays] = useState<readonly Weekday[]>([])
  const [time, setTime] = useState('')
  const [covers, setCovers] = useState<readonly Domain[]>([])
  const [err, setErr] = useState<string | null>(null)

  const toggleDay = (v: Weekday) => setDays((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]))
  const toggleCover = (d: Domain) => setCovers((c) => (c.includes(d) ? c.filter((x) => x !== d) : [...c, d]))

  const submit = () => {
    if (!name.trim()) { setErr('이름을 입력해 주세요'); return }
    onSubmit({
      name: name.trim(),
      weekdays: [...days].sort(),
      ...(time ? { time } : {}),
      ...(covers.length > 0 ? { coversDomains: covers } : {}),
    })
  }

  return (
    <div className="mng-form" data-testid="academy-form">
      <input className="fld" placeholder="학원 이름" value={name} onChange={(e) => { setName(e.target.value); setErr(null) }} />
      <div className="fld-label">가는 요일</div>
      <div className="daypick">
        {WD.map((w) => (
          <button key={w.value} type="button" className={`daybtn${days.includes(w.value) ? ' on' : ''}`} onClick={() => toggleDay(w.value)}>{w.label}</button>
        ))}
      </div>
      <input className="fld" placeholder="시간 (예: 15:00, 선택)" value={time} onChange={(e) => setTime(e.target.value)} />
      <div className="fld-label">등원이 챙기는 영역 (선택)</div>
      <div className="daypick wrap">
        {DOMAINS.map((d) => (
          <button key={d} type="button" className={`daybtn wide${covers.includes(d) ? ' on' : ''}`} onClick={() => toggleCover(d)}>{d}</button>
        ))}
      </div>
      {err && <p className="fld-err">{err}</p>}
      <div className="form-act">
        <button className="btn-sm fill" onClick={submit}>추가</button>
        <button className="btn-sm" onClick={onCancel}>취소</button>
      </div>
    </div>
  )
}

/* ── 활동 추가 폼 ─────────────────────────────────── */
function ActivityForm({ onSubmit, onCancel }: { onSubmit: (i: ActivityInput) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [domain, setDomain] = useState<Domain>('국어')
  const [kind, setKind] = useState<Cadence['kind']>('주N회')
  const [times, setTimes] = useState(1)
  const [days, setDays] = useState<readonly Weekday[]>([])
  const [owner, setOwner] = useState<'엄마' | '아빠'>('엄마')
  const [err, setErr] = useState<string | null>(null)

  const toggleDay = (v: Weekday) => setDays((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]))

  const cadenceOf = (): Cadence => {
    if (kind === '매일') return { kind: '매일' }
    if (kind === '비정기') return { kind: '비정기' }
    if (kind === '요일지정') return { kind: '요일지정', weekdays: [...days].sort() }
    return { kind: '주N회', times: Math.max(1, times) }
  }

  const submit = () => {
    if (!name.trim()) { setErr('이름을 입력해 주세요'); return }
    onSubmit({
      name: name.trim(),
      domain,
      track: '집',
      targetIds: [],
      cadence: cadenceOf(),
      owner,
    })
  }

  return (
    <div className="mng-form" data-testid="activity-form">
      <input className="fld" placeholder="활동 이름" value={name} onChange={(e) => { setName(e.target.value); setErr(null) }} />
      <div className="fld-label">영역</div>
      <select className="fld" value={domain} onChange={(e) => setDomain(e.target.value as Domain)}>
        {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      <div className="fld-label">얼마나 자주</div>
      <select className="fld" value={kind} onChange={(e) => setKind(e.target.value as Cadence['kind'])}>
        <option value="주N회">주 N회</option>
        <option value="매일">매일</option>
        <option value="요일지정">요일 지정</option>
        <option value="비정기">비정기</option>
      </select>
      {kind === '주N회' && (
        <input className="fld" type="number" min={1} max={7} value={times} onChange={(e) => setTimes(Number(e.target.value) || 1)} />
      )}
      {kind === '요일지정' && (
        <div className="daypick">
          {WD.map((w) => (
            <button key={w.value} type="button" className={`daybtn${days.includes(w.value) ? ' on' : ''}`} onClick={() => toggleDay(w.value)}>{w.label}</button>
          ))}
        </div>
      )}
      <div className="fld-label">누가</div>
      <div className="daypick">
        <button type="button" className={`daybtn wide${owner === '엄마' ? ' on' : ''}`} onClick={() => setOwner('엄마')}>엄마</button>
        <button type="button" className={`daybtn wide${owner === '아빠' ? ' on' : ''}`} onClick={() => setOwner('아빠')}>아빠</button>
      </div>
      {err && <p className="fld-err">{err}</p>}
      <div className="form-act">
        <button className="btn-sm fill" onClick={submit}>추가</button>
        <button className="btn-sm" onClick={onCancel}>취소</button>
      </div>
    </div>
  )
}
