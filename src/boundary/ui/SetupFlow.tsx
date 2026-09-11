/**
 * 첫 실행 셋업 — UX 리디자인 §06-A (두 입력 모드 · SSOT §5).
 * S1 아이 정보 · S2 **과목별 학습 입력**(국어→영어→수학→과학→예체능, 각 한 카드).
 *   각 카드: 다니는 학원?(칩) → 숙제 있어요?(토글) → 집에서 하는 것?(칩). 과목마다 스킵 가능.
 *   ⭐ 온보딩은 '학습 레인'만 받는다. 생활·마음(사회·인성·건강·안전)은 별도 '관찰 체크' 모듈(§06-B).
 *   칩은 band(미취학/초1~2)로 갈리고, 활동유형 프리셋 type 을 함께 넘겨 App 이 묶음을 확정한다.
 */
import { useState } from 'react'
import type { Domain } from '../../domain/types'
import { DOMAINS } from '../../domain/types'
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
  { label: '방과후교실', domain: '국어', kind: '학원' },
  { label: '책읽기', domain: '국어', kind: '집', presetType: '독서' },
  { label: '일기·글쓰기', domain: '국어', kind: '집', presetType: '일기·글쓰기' },
  { label: '연산 문제집', domain: '수학', kind: '집', presetType: '연산' },
  { label: '영어(원서·영상)', domain: '영어', kind: '집', presetType: '영어' },
  { label: '학습지', domain: '국어', kind: '집' },
  { label: '보드게임', domain: '수학', kind: '집', presetType: '보드게임' },
]

/** 셋업에서 고른 항목 — 라벨=이름, domain=폴백 영역, presetType=활동유형, coverMode=숙제 토글 결과(학원만) */
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
  readonly bandOf: (birthYm: string) => 'nuri' | 'elem'
  readonly onComplete: (r: SetupResult) => void
}

/** 과목 기본 숙제 여부 — 예체능=등원형(off) / 국·영·수·과=숙제형(on). */
const defaultHomework = (domain: Domain): boolean => domain !== '예체능'

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
  const [homework, setHomework] = useState<Readonly<Record<string, boolean>>>({})
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
  const hwOf = (domain: Domain): boolean => homework[domain] ?? defaultHomework(domain)
  const setHw = (domain: Domain, on: boolean) => setHomework((prev) => ({ ...prev, [domain]: on }))

  const finish = () => {
    const chosen = chips.filter((c) => picked.has(c.label))
    const base = (c: Chip): SetupPick => ({ name: c.label, domain: c.domain, ...(c.presetType ? { presetType: c.presetType } : {}) })
    const academies = chosen.filter((c) => c.kind === '학원').map((c) => ({ ...base(c), coverMode: hwOf(c.domain) ? ('숙제형' as const) : ('등원형' as const) }))
    const homeActivities = chosen.filter((c) => c.kind === '집').map(base)
    onComplete({ name: name.trim() || '첫째', birthYm, academies, homeActivities, priorityDomains: [...priority] })
  }
  const next = () => (step < 1 ? setStep(1) : finish())

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
            <div className="setup-reward"><IconCheck w={16} />{ageLabelOf(birthYm)} 좌표를 준비했어요</div>
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
            <p className="setup-p"><b>지금 하는 것만 빠르게</b> 눌러요. 안 하는 과목은 그냥 넘겨도 괜찮아요. 생활·마음은 나중에 따로 봐요.</p>
            {SUBJECTS.map((domain) => {
              const acaChips = chips.filter((c) => c.domain === domain && c.kind === '학원')
              const homeChips = chips.filter((c) => c.domain === domain && c.kind === '집')
              if (acaChips.length === 0 && homeChips.length === 0) return null
              const anyAca = acaChips.some((c) => picked.has(c.label))
              return (
                <div key={domain} className="subj-card" data-testid={`subj-${domain}`}>
                  <div className="subj-head">{domain}</div>
                  {acaChips.length > 0 && (
                    <>
                      <div className="subj-q">다니는 학원 있어요?</div>
                      <Chips chips={acaChips} picked={picked} onToggle={toggle} />
                      {anyAca && (
                        <label className="hw-toggle">
                          <input type="checkbox" checked={hwOf(domain)} onChange={(e) => setHw(domain, e.target.checked)} />
                          집에서 하는 숙제가 있어요 <span className="opt">({hwOf(domain) ? '숙제 체크로 챙김' : '다니면서 챙김'})</span>
                        </label>
                      )}
                    </>
                  )}
                  {homeChips.length > 0 && (
                    <>
                      <div className="subj-q">집에서 하는 건요?</div>
                      <Chips chips={homeChips} picked={picked} onToggle={toggle} />
                    </>
                  )}
                </div>
              )
            })}
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
