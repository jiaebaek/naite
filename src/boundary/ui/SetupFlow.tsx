/**
 * 첫 실행 셋업 — UX 리디자인 §06-A (두 입력 모드 · SSOT §5).
 * S1 아이 정보 · S2 **과목별 학습 입력**(국어→영어→수학→과학→예체능, 각 한 카드).
 *   각 카드: 다니는 학원?(칩) → **학원별** 숙제 토글 → 기타 학원 직접 입력 → 집에서 하는 것?(칩).
 *   ⭐ 온보딩은 '학습 레인'만. 생활·마음은 별도 관찰 체크 모듈(§06-B).
 *   ⭐ 숙제 토글은 **학원마다 따로**(피드백 #4). 프리셋에 없는 학원은 **기타 직접 입력**(#2·#3).
 *   band 가 지원 범위(미취학~초2) 밖이면 예외 안내(#6).
 */
import { useState } from 'react'
import type { Domain } from '../../domain/types'
import { DOMAINS } from '../../domain/types'
import { presetByType } from '../../domain/standards/activityPresets'
import { IconCheck } from './icons'

/** 온보딩(학습 레인) 과목 순서. 생활·마음은 온보딩에 없다(§06-B 별도 모듈). */
const SUBJECTS: readonly Domain[] = ['국어', '영어', '수학', '과학·탐구', '예체능']

interface Chip { readonly label: string; readonly domain: Domain; readonly kind: '학원' | '집'; readonly presetType?: string }

// ── 미취학(nuri) 칩 (docs/11 §3-A) ──
const NURI_CHIPS: readonly Chip[] = [
  { label: '한글·독서', domain: '국어', kind: '학원', presetType: '한글' },
  { label: '놀이수학', domain: '수학', kind: '학원', presetType: '사고력수학' },
  { label: '영어', domain: '영어', kind: '학원', presetType: '영어' },
  { label: '미술', domain: '예체능', kind: '학원', presetType: '미술' },
  { label: '피아노', domain: '예체능', kind: '학원', presetType: '피아노' },
  { label: '발레·무용', domain: '예체능', kind: '학원', presetType: '발레' },
  { label: '태권도', domain: '예체능', kind: '학원', presetType: '태권도' },
  { label: '축구·체육', domain: '예체능', kind: '학원', presetType: '축구' },
  { label: '유아체육', domain: '예체능', kind: '학원', presetType: '유아체육' },
  { label: '수영', domain: '예체능', kind: '학원', presetType: '수영' },
  { label: '그림책 읽기', domain: '국어', kind: '집', presetType: '독서' },
  { label: '한글 놀이', domain: '국어', kind: '집', presetType: '한글' },
  { label: '숫자·보드게임', domain: '수학', kind: '집', presetType: '보드게임' },
  { label: '엄마표 영어', domain: '영어', kind: '집', presetType: '영어' },
  { label: '영어 영상', domain: '영어', kind: '집', presetType: '영어' },
  { label: '미술·만들기', domain: '예체능', kind: '집', presetType: '미술' },
  { label: '바깥놀이', domain: '예체능', kind: '집', presetType: '바깥놀이' },
]
// ── 초1~2(elem) 칩 (docs/11 §3-B) ──
const ELEM_CHIPS: readonly Chip[] = [
  { label: '영어학원', domain: '영어', kind: '학원', presetType: '영어' },
  { label: '수학학원', domain: '수학', kind: '학원', presetType: '사고력수학' },
  { label: '국어·논술', domain: '국어', kind: '학원', presetType: '논술' },
  { label: '독서·글쓰기', domain: '국어', kind: '학원', presetType: '독서' },
  { label: '태권도', domain: '예체능', kind: '학원', presetType: '태권도' },
  { label: '피아노', domain: '예체능', kind: '학원', presetType: '피아노' },
  { label: '수영', domain: '예체능', kind: '학원', presetType: '수영' },
  { label: '미술', domain: '예체능', kind: '학원', presetType: '미술' },
  { label: '발레·무용', domain: '예체능', kind: '학원', presetType: '발레' },
  { label: '축구·체육', domain: '예체능', kind: '학원', presetType: '축구' },
  { label: '코딩·로봇', domain: '과학·탐구', kind: '학원', presetType: '코딩·로봇' },
  { label: '책읽기', domain: '국어', kind: '집', presetType: '독서' },
  { label: '일기·글쓰기', domain: '국어', kind: '집', presetType: '일기·글쓰기' },
  { label: '연산 문제집', domain: '수학', kind: '집', presetType: '연산' },
  { label: '영어(원서·영상)', domain: '영어', kind: '집', presetType: '영어' },
  { label: '학습지', domain: '국어', kind: '집' },
  { label: '보드게임', domain: '수학', kind: '집', presetType: '보드게임' },
]

/** 셋업에서 고른 항목 — 라벨=이름, domain=폴백 영역, presetType=활동유형, coverMode=숙제 여부(학원만) */
export interface SetupPick {
  readonly name: string
  readonly domain: Domain
  readonly presetType?: string
  readonly coverMode?: '등원형' | '숙제형'
}
export interface SetupResult {
  readonly name: string
  readonly birthYm: string
  readonly academies: readonly SetupPick[]
  readonly homeActivities: readonly SetupPick[]
  readonly priorityDomains: readonly Domain[]
}

export interface SetupFlowProps {
  readonly initialName: string
  readonly initialBirthYm: string
  readonly ageLabelOf: (birthYm: string) => string
  /** 아이 생년월 → 현재 band. 지원 범위(미취학~초2) 밖이면 null. */
  readonly bandOf: (birthYm: string) => 'nuri' | 'elem' | null
  readonly onComplete: (r: SetupResult) => void
}

/** 학원 칩/기타의 숙제 기본값 — 프리셋 coverMode 가 등원형이면 off, 그 외(숙제형·기타)는 on. */
const defaultHw = (presetType?: string): boolean =>
  presetType ? presetByType(presetType)?.coverMode !== '등원형' : true

function Chips({ chips, picked, onToggle }: { chips: readonly Chip[]; picked: ReadonlySet<string>; onToggle: (label: string) => void }) {
  return (
    <div className="preset-grid">
      {chips.map((c) => (
        <button key={c.label} type="button" className={`pchip${picked.has(c.label) ? ' on' : ''}`} aria-pressed={picked.has(c.label)} onClick={() => onToggle(c.label)}>
          <svg className="pk" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M4 12l5 5L20 6" /></svg>{c.label}
        </button>
      ))}
    </div>
  )
}

export function SetupFlow({ initialName, initialBirthYm, ageLabelOf, bandOf, onComplete }: SetupFlowProps) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState(initialName)
  const [birthYm, setBirthYm] = useState(initialBirthYm)
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set())
  const [custom, setCustom] = useState<Readonly<Record<string, readonly string[]>>>({})
  const [draft, setDraft] = useState<Readonly<Record<string, string>>>({})
  const [hw, setHw] = useState<Readonly<Record<string, boolean>>>({})
  const [priority, setPriority] = useState<readonly Domain[]>([])

  const band = bandOf(birthYm)
  const chips = band === 'elem' ? ELEM_CHIPS : NURI_CHIPS

  const togglePriority = (d: Domain) => setPriority((prev) =>
    prev.includes(d) ? prev.filter((x) => x !== d) : prev.length < 2 ? [...prev, d] : prev)

  const toggle = (label: string) => setPicked((prev) => {
    const next = new Set(prev)
    if (next.has(label)) next.delete(label); else next.add(label)
    return next
  })
  const hwOf = (key: string, presetType?: string): boolean => hw[key] ?? defaultHw(presetType)
  const setHwKey = (key: string, on: boolean) => setHw((prev) => ({ ...prev, [key]: on }))
  const addCustom = (domain: Domain) => {
    const nm = (draft[domain] ?? '').trim()
    if (!nm) return
    setCustom((prev) => ({ ...prev, [domain]: [...(prev[domain] ?? []), nm] }))
    setDraft((prev) => ({ ...prev, [domain]: '' }))
  }

  const finish = () => {
    const chosen = chips.filter((c) => picked.has(c.label))
    const presetAca = chosen.filter((c) => c.kind === '학원').map((c): SetupPick => ({
      name: c.label, domain: c.domain, ...(c.presetType ? { presetType: c.presetType } : {}),
      coverMode: hwOf(c.label, c.presetType) ? '숙제형' : '등원형',
    }))
    const customAca = SUBJECTS.flatMap((d) => (custom[d] ?? []).map((nm): SetupPick => ({
      name: nm, domain: d, coverMode: hwOf(`기타:${d}:${nm}`) ? '숙제형' : '등원형',
    })))
    const homeActivities = chosen.filter((c) => c.kind === '집').map((c): SetupPick => ({
      name: c.label, domain: c.domain, ...(c.presetType ? { presetType: c.presetType } : {}),
    }))
    onComplete({ name: name.trim() || '첫째', birthYm, academies: [...presetAca, ...customAca], homeActivities, priorityDomains: [...priority] })
  }
  const next = () => (step < 1 ? setStep(1) : finish())

  /** 학원 하나의 숙제 토글 행. */
  const HwToggle = ({ label, keyId, presetType }: { label: string; keyId: string; presetType?: string | undefined }) => (
    <label className="hw-toggle">
      <input type="checkbox" checked={hwOf(keyId, presetType)} onChange={(e) => setHwKey(keyId, e.target.checked)} />
      <b>{label}</b> 집에서 하는 숙제가 있어요 <span className="opt">({hwOf(keyId, presetType) ? '숙제 체크로 챙김' : '다니면서 챙김'})</span>
    </label>
  )

  return (
    <div className="onboard" data-testid="setup">
      <button className="ob-skip" onClick={finish}>나중에</button>
      <div className="ob-stage">
        {/* S1 아이 */}
        <div className={`setup-step${step === 0 ? ' active' : ''}`}>
          <div className="setup-top">
            <div className="eyebrow">1 / 2 · 아이 정보</div>
            <h2 className="setup-h">누구의 나이테를<br />쌓을까요?</h2>
            <p className="setup-p">생년월만 있으면 지금 시기의 좌표를 준비해요.</p>
            <div className="field">
              <label htmlFor="suName">아이 이름 <span className="opt">(선택 · 애칭도 좋아요)</span></label>
              <input className="inp" id="suName" placeholder="예: 첫째" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="suBirth">생년월</label>
              <input className="inp" id="suBirth" type="month" value={birthYm} onChange={(e) => setBirthYm(e.target.value)} />
            </div>
            {band === null
              ? <div className="setup-reward warn" data-testid="range-warn">아직 <b>미취학(만 3세)~초2</b>만 지원해요 · 그 위 학년은 준비 중이에요</div>
              : <div className="setup-reward"><IconCheck w={16} />{ageLabelOf(birthYm)} 좌표를 준비했어요</div>}
            <div className="field" style={{ marginTop: 18 }}>
              <label>특별히 챙기고 싶은 분야 <span className="opt">(선택 · 최대 2개, 이 분야를 맨 위로)</span></label>
              <div className="daypick wrap">
                {DOMAINS.map((d) => {
                  const on = priority.includes(d)
                  return (
                    <button key={d} type="button" className={`daybtn wide${on ? ' on' : ''}`} aria-pressed={on}
                      disabled={!on && priority.length >= 2} onClick={() => togglePriority(d)}>{d}</button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* S2 과목별 학습 */}
        <div className={`setup-step${step === 1 ? ' active' : ''}`}>
          <div className="setup-top">
            <div className="eyebrow">2 / 2 · 지금 하는 학습</div>
            <h2 className="setup-h">과목별로<br />지금 하는 것만</h2>
            {band === null ? (
              <p className="setup-p">이 나이는 아직 지원하지 않아요. <b>미취학(만 3세)~초2</b>까지 전문가가 세운 국가 기준을 담고 있어요. 나중에 다시 만나요.</p>
            ) : (
              <>
                <p className="setup-p"><b>지금 하는 것만 빠르게</b> 눌러요. 안 하는 과목은 그냥 넘겨도 괜찮아요. 생활·마음은 나중에 따로 봐요.</p>
                {SUBJECTS.map((domain) => {
                  const acaChips = chips.filter((c) => c.domain === domain && c.kind === '학원')
                  const homeChips = chips.filter((c) => c.domain === domain && c.kind === '집')
                  const customList = custom[domain] ?? []
                  return (
                    <div key={domain} className="subj-card" data-testid={`subj-${domain}`}>
                      <div className="subj-head">{domain}</div>
                      <div className="subj-q">다니는 학원 있어요?</div>
                      {acaChips.length > 0 && <Chips chips={acaChips} picked={picked} onToggle={toggle} />}
                      {/* 고른 학원마다 따로 숙제 토글(#4) */}
                      {acaChips.filter((c) => picked.has(c.label)).map((c) => (
                        <HwToggle key={c.label} label={c.label} keyId={c.label} presetType={c.presetType} />
                      ))}
                      {/* 기타 직접 입력(#2·#3) — 프리셋에 없는 학원 */}
                      {customList.map((nm) => (
                        <HwToggle key={`기타:${domain}:${nm}`} label={nm} keyId={`기타:${domain}:${nm}`} />
                      ))}
                      <div className="subj-etc">
                        <input className="fld" placeholder="기타 학원 직접 입력 (예: 방과후교실)" value={draft[domain] ?? ''}
                          onChange={(e) => setDraft((prev) => ({ ...prev, [domain]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(domain) } }} />
                        <button type="button" className="btn-sm" onClick={() => addCustom(domain)}>추가</button>
                      </div>
                      {homeChips.length > 0 && (
                        <>
                          <div className="subj-q">집에서 하는 건요?</div>
                          <Chips chips={homeChips} picked={picked} onToggle={toggle} />
                        </>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="ob-foot">
        <div className="dots" aria-hidden="true">
          {[0, 1].map((n) => <span key={n} className={`dot-i${n === step ? ' on' : ''}`} />)}
        </div>
        <button className="btn-primary ob-next" onClick={next}>{step === 1 ? '나이테 시작하기' : '다음'}</button>
      </div>
    </div>
  )
}
