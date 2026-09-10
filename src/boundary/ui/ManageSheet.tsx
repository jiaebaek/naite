/**
 * 학원·활동 추가/편집 바텀시트 — UX 리디자인 §12 '학원·활동 폼(추가/편집 공용)'.
 * 활동 연결·지난 날 시트와 동일 패턴(그랩·백드롭·하단 고정 CTA). 추가/편집 한 컴포넌트 겸용.
 * 편집에서만 삭제(위험색) 노출 — §05 에서 red 를 쓰는 유일한 자리.
 */
import { useState } from 'react'
import type {
  Academy,
  AcademyInput,
  Activity,
  ActivityInput,
  Domain,
  Weekday,
} from '../../domain/types'
import { DOMAINS } from '../../domain/types'
import { presetByType, suggestedTargets } from '../../domain/standards/activityPresets'
import { IconX } from './icons'

export interface TargetOption {
  readonly id: string
  readonly statement: string
  readonly domain: Domain
}

/** App 이 여는 시트 대상 — 추가(entity 없음) / 편집(entity 있음) */
export type ManageSheetTarget =
  | { readonly kind: 'academy'; readonly academy?: Academy }
  | { readonly kind: 'activity'; readonly activity?: Activity }

export interface ManageSheetProps {
  readonly target: ManageSheetTarget
  readonly academies: readonly { readonly id: string; readonly name: string }[]
  readonly targets: readonly TargetOption[]
  readonly onSaveAcademy: (input: AcademyInput, editing: Academy | null) => void
  readonly onSaveActivity: (input: ActivityInput, editing: Activity | null) => void
  readonly onDelete: () => void
  readonly onClose: () => void
}

const WD: readonly { label: string; value: Weekday }[] = [
  { label: '월', value: 1 }, { label: '화', value: 2 }, { label: '수', value: 3 },
  { label: '목', value: 4 }, { label: '금', value: 5 }, { label: '토', value: 6 }, { label: '일', value: 0 },
]

/**
 * 활동 폼 유형 프리셋(원칙 8) — 누르면 이름·소속·주간목표·겨냥 목표를 자동 추천.
 * presetType 이 있으면 겨냥 목표 = 그 활동유형 프리셋의 primary(현재 band)만 미리 체크한다.
 *   영역 전체를 겨냥하지 않는다(오버클레임·신뢰① 위반) — docs/10 보수적 매핑.
 */
const ACT_PRESETS: readonly { label: string; name: string; where: '학원' | '자체'; domain: Domain; times: number; presetType?: string }[] = [
  { label: '한글·독서', name: '한글 학원 숙제', where: '학원', domain: '국어', times: 3, presetType: '한글' },
  { label: '수학·연산', name: '수학 학습', where: '학원', domain: '수학', times: 2, presetType: '사고력수학' },
  { label: '영어', name: '엄마표 영어', where: '자체', domain: '영어', times: 3, presetType: '영어' },
  { label: '미술', name: '미술', where: '학원', domain: '예체능', times: 1, presetType: '미술' },
  { label: '피아노', name: '피아노', where: '학원', domain: '예체능', times: 2, presetType: '피아노' },
  { label: '태권도', name: '태권도', where: '학원', domain: '예체능', times: 2, presetType: '태권도' },
  { label: '과학·실험', name: '과학 실험', where: '학원', domain: '과학·탐구', times: 1 },
  { label: '학습지', name: '학습지', where: '자체', domain: '국어', times: 3 },
]

function Frame({ title, onClose, children, foot }: {
  title: string; onClose: () => void; children: React.ReactNode; foot: React.ReactNode
}) {
  return (
    <div className="sheet-wrap" data-testid="manage-sheet">
      <div className="sheet-bg" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label={title}>
        <div className="grab" />
        <div className="sheet-head">
          <h3>{title}</h3>
          <button className="sheet-x" onClick={onClose} aria-label="닫기"><IconX /></button>
        </div>
        <div className="sheet-body">{children}</div>
        <div className="sheet-foot">{foot}</div>
      </div>
    </div>
  )
}

export function ManageSheet(props: ManageSheetProps) {
  return props.target.kind === 'academy'
    ? <AcademyBody {...props} editing={props.target.academy ?? null} />
    : <ActivityBody {...props} editing={props.target.activity ?? null} />
}

/* ── 학원 폼 ─────────────────────────────────── */
function AcademyBody({ editing, onSaveAcademy, onDelete, onClose }: ManageSheetProps & { editing: Academy | null }) {
  const [name, setName] = useState(editing?.name ?? '')
  const [days, setDays] = useState<readonly Weekday[]>(editing?.weekdays ?? [])
  const [time, setTime] = useState(editing?.time ?? '')
  const [contact, setContact] = useState(editing?.contact ?? '')
  const [err, setErr] = useState<string | null>(null)

  const toggleDay = (v: Weekday) => setDays((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]))
  const submit = () => {
    if (!name.trim()) { setErr('이름을 입력해 주세요'); return }
    onSaveAcademy({
      name: name.trim(),
      weekdays: [...days].sort(),
      ...(time ? { time } : {}),
      ...(contact.trim() ? { contact: contact.trim() } : {}),
    }, editing)
  }

  return (
    <Frame title={editing ? '학원 편집' : '학원 추가'} onClose={onClose}
      foot={<>
        <button className="btn-primary" onClick={submit}>{editing ? '저장' : '추가'}</button>
        {editing && <button className="sheet-del" onClick={onDelete}>이 학원 삭제</button>}
      </>}>
      <label className="fld-label">이름</label>
      <input className="fld" placeholder="학원 이름" value={name} onChange={(e) => { setName(e.target.value); setErr(null) }} />
      <div className="fld-label">등원 요일</div>
      <div className="daypick">
        {WD.map((w) => (
          <button key={w.value} type="button" className={`daybtn${days.includes(w.value) ? ' on' : ''}`} onClick={() => toggleDay(w.value)}>{w.label}</button>
        ))}
      </div>
      <label className="fld-label">등원 시간</label>
      <input className="fld" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      <label className="fld-label">연락처 (선택)</label>
      <input className="fld" type="tel" placeholder="010-0000-0000" value={contact} onChange={(e) => setContact(e.target.value)} />
      {err && <p className="fld-err">{err}</p>}
    </Frame>
  )
}

/* ── 활동 폼 ─────────────────────────────────── */
type Where = '학원' | '자체' | '자유'
const whereOf = (a: Activity | null): Where =>
  !a ? '자체' : a.academyId ? '학원' : a.targetIds.length > 0 ? '자체' : '자유'

function ActivityBody({ editing, academies, targets, onSaveActivity, onDelete, onClose }: ManageSheetProps & { editing: Activity | null }) {
  const [name, setName] = useState(editing?.name ?? '')
  const [where, setWhere] = useState<Where>(whereOf(editing))
  const [academyId, setAcademyId] = useState(editing?.academyId ?? academies[0]?.id ?? '')
  const [domain, setDomain] = useState<Domain>(editing?.domain ?? '국어')
  const [times, setTimes] = useState(editing && editing.cadence.kind === '주N회' ? editing.cadence.times : 1)
  const [picked, setPicked] = useState<readonly string[]>(editing?.targetIds ?? [])
  const [err, setErr] = useState<string | null>(null)

  const domainTargets = targets.filter((t) => t.domain === domain)
  const togglePick = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const changeDomain = (d: Domain) => { setDomain(d); setPicked([]) } // 영역 바꾸면 겨냥 목표 초기화(계약: 같은 영역만)
  // 원칙 8 — 유형 프리셋: 이름·소속·주간목표·겨냥 목표를 자동 추천 → 손질만.
  // 겨냥 목표는 영역 전체가 아니라 그 활동유형 프리셋의 primary(현재 band)만 미리 체크(과소청구·docs/10).
  const applyPreset = (p: typeof ACT_PRESETS[number]) => {
    const preset = p.presetType ? presetByType(p.presetType) : undefined
    const dom = preset?.domain ?? p.domain
    setName(p.name); setWhere(p.where); setDomain(dom); setTimes(p.times)
    const ids = new Set(targets.map((t) => t.id))
    setPicked(preset ? [...suggestedTargets(preset, ids)] : [])
    setErr(null)
  }

  const submit = () => {
    if (!name.trim()) { setErr('이름을 입력해 주세요'); return }
    if (where === '학원' && !academyId) { setErr('소속 학원을 선택해 주세요'); return }
    onSaveActivity({
      name: name.trim(),
      domain,
      track: where === '학원' ? '학원' : '집',
      targetIds: where === '자유' ? [] : picked,
      cadence: where === '자유' ? { kind: '비정기' } : { kind: '주N회', times },
      owner: editing?.owner ?? '엄마',
      ...(where === '학원' ? { academyId } : {}),
    }, editing)
  }

  return (
    <Frame title={editing ? '활동 편집' : '활동 추가'} onClose={onClose}
      foot={<>
        <button className="btn-primary" onClick={submit}>{editing ? '저장' : '추가'}</button>
        {editing && <button className="sheet-del" onClick={onDelete}>이 활동 삭제</button>}
      </>}>
      {!editing && (
        <>
          <div className="fld-label">유형에서 시작 <span className="fld-hint">누르면 자동으로 채워요</span></div>
          <div className="preset-grid" style={{ marginBottom: 14 }}>
            {ACT_PRESETS.map((p) => (
              <button key={p.label} type="button" className="pchip" onClick={() => applyPreset(p)}>{p.label}</button>
            ))}
          </div>
        </>
      )}
      <label className="fld-label">이름</label>
      <input className="fld" placeholder="활동 이름" value={name} onChange={(e) => { setName(e.target.value); setErr(null) }} />

      <div className="fld-label">어디서 하나요</div>
      <div className="daypick">
        {(['학원', '자체', '자유'] as const).map((w) => (
          <button key={w} type="button" className={`daybtn wide${where === w ? ' on' : ''}`} onClick={() => setWhere(w)}>{w}</button>
        ))}
      </div>

      {where === '학원' && (
        <>
          <label className="fld-label">소속 학원</label>
          <select className="fld" value={academyId} onChange={(e) => setAcademyId(e.target.value)}>
            {academies.length === 0 && <option value="">학원을 먼저 추가하세요</option>}
            {academies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </>
      )}

      <div className="fld-label">영역</div>
      <div className="daypick wrap">
        {DOMAINS.map((d) => (
          <button key={d} type="button" className={`daybtn wide${domain === d ? ' on' : ''}`} onClick={() => changeDomain(d)}>{d}</button>
        ))}
      </div>

      {where !== '자유' && (
        <>
          <div className="fld-label">주간 목표 횟수</div>
          <div className="stepper" data-testid="weekly-stepper">
            <button type="button" aria-label="줄이기" onClick={() => setTimes((n) => Math.max(1, n - 1))}>−</button>
            <span className="val">주 {times}회</span>
            <button type="button" aria-label="늘리기" onClick={() => setTimes((n) => Math.min(7, n + 1))}>+</button>
          </div>

          <div className="fld-label">겨냥 목표 <span className="fld-hint">이 시기 {domain} 목표</span></div>
          <div className="tgt-list">
            {domainTargets.length === 0
              ? <p className="fld-hint" style={{ padding: '4px 2px' }}>이 시기 {domain} 목표가 없어요</p>
              : domainTargets.map((t) => (
                <button key={t.id} type="button" className={`tgt${picked.includes(t.id) ? ' on' : ''}`} onClick={() => togglePick(t.id)}>
                  <span className="tgt-box" />
                  <span className="tgt-txt">{t.statement}</span>
                </button>
              ))}
          </div>
        </>
      )}

      {err && <p className="fld-err">{err}</p>}
    </Frame>
  )
}
