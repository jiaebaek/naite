/**
 * 첫 실행 셋업 — UX 리디자인 §06-A ③. 온보딩 직후 2스텝.
 * S1 아이 정보(이름·생년월). S2 "무엇으로 챙기나요?" — 학원(등원)·집 활동을 자유롭게 더한다.
 * 넣는 순간 그 영역이 첫 화면에 챙김으로. 하나도 없으면 스킵 가능(관리에서 나중에).
 */
import { useState } from 'react'
import type { Domain, Weekday } from '../../domain/types'
import { DOMAINS } from '../../domain/types'
import { IconCheck, IconPlus, IconX } from './icons'

/** 셋업에서 더한 '챙기는 것' 하나. 학원=등원 커버, 집=집 활동. */
export interface SetupItem {
  readonly kind: '학원' | '집'
  readonly name: string
  readonly domains: readonly Domain[]
  /** 학원만 의미 있음(등원 요일) */
  readonly weekdays: readonly Weekday[]
}

export interface SetupResult {
  readonly name: string
  readonly birthYm: string
  readonly items: readonly SetupItem[]
}

export interface SetupFlowProps {
  readonly initialName: string
  readonly initialBirthYm: string
  readonly ageLabelOf: (birthYm: string) => string
  readonly onComplete: (r: SetupResult) => void
}

const WD: readonly { label: string; value: Weekday }[] = [
  { label: '월', value: 1 }, { label: '화', value: 2 }, { label: '수', value: 3 },
  { label: '목', value: 4 }, { label: '금', value: 5 }, { label: '토', value: 6 }, { label: '일', value: 0 },
]

export function SetupFlow({ initialName, initialBirthYm, ageLabelOf, onComplete }: SetupFlowProps) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState(initialName)
  const [birthYm, setBirthYm] = useState(initialBirthYm)

  const [items, setItems] = useState<readonly SetupItem[]>([])
  // 추가 폼
  const [fName, setFName] = useState('')
  const [fKind, setFKind] = useState<'학원' | '집'>('학원')
  const [fDomains, setFDomains] = useState<readonly Domain[]>([])
  const [fDays, setFDays] = useState<readonly Weekday[]>([])

  const toggleDay = (v: Weekday) => setFDays((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]))
  const toggleDomain = (d: Domain) => setFDomains((c) => (c.includes(d) ? c.filter((x) => x !== d) : [...c, d]))

  const draft = (): SetupItem | null =>
    fName.trim() && fDomains.length > 0
      ? { kind: fKind, name: fName.trim(), domains: [...fDomains], weekdays: [...fDays].sort() }
      : null

  const addItem = () => {
    const d = draft()
    if (!d) return
    setItems((prev) => [...prev, d])
    setFName(''); setFDomains([]); setFDays([]) // 다음 항목 위해 초기화 (종류는 유지)
  }
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))

  // 시작: 아직 추가 안 한 폼이 유효하면 함께 넣는다(마지막 항목에 '추가' 안 눌러도 됨)
  const start = () => {
    const d = draft()
    onComplete({ name: name.trim() || '첫째', birthYm, items: d ? [...items, d] : items })
  }
  const skip = () => onComplete({ name: name.trim() || '첫째', birthYm, items: [] })
  const next = () => (step === 0 ? setStep(1) : start())

  return (
    <div className="onboard" data-testid="setup">
      <button className="ob-skip" onClick={skip}>나중에</button>
      <div className="ob-stage">
        {/* S1. 아이 정보 */}
        <div className={`setup-step${step === 0 ? ' active' : ''}`}>
          <div className="setup-top">
            <div className="eyebrow">1 / 2 · 아이 정보</div>
            <h2 className="setup-h">누구의 나이테를<br />쌓을까요?</h2>
            <p className="setup-p">생년월만 있으면 지금 시기의 좌표를 준비해요.</p>
            <div className="field">
              <label htmlFor="suName">아이 이름 <span className="opt">(애칭도 좋아요)</span></label>
              <input className="inp" id="suName" placeholder="예: 첫째" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="suBirth">생년월</label>
              <input className="inp" id="suBirth" type="month" value={birthYm} onChange={(e) => setBirthYm(e.target.value)} />
            </div>
            <div className="setup-reward">
              <IconCheck w={16} />{ageLabelOf(birthYm)} 좌표를 준비했어요
            </div>
          </div>
        </div>

        {/* S2. 무엇으로 챙기나요 — 학원·집 활동 리스트 */}
        <div className={`setup-step${step === 1 ? ' active' : ''}`}>
          <div className="setup-top">
            <div className="eyebrow">2 / 2 · 무엇으로 챙기나요?</div>
            <h2 className="setup-h">챙기는 것을 더해요</h2>
            <p className="setup-p">학원이든 집에서 하는 거든, 넣으면 그 영역이 <b>첫 화면에 챙김으로</b> 채워져요.</p>

            {items.length > 0 && (
              <div className="setup-list" data-testid="setup-list">
                {items.map((it, i) => (
                  <div key={i} className="setup-item">
                    <span className={`si-tag ${it.kind === '학원' ? 'ac' : 'home'}`}>{it.kind}</span>
                    <span className="si-main"><b>{it.name}</b><small>{it.domains.join(' · ')}</small></span>
                    <button className="si-x" onClick={() => removeItem(i)} aria-label="빼기"><IconX /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="setup-add">
              <input className="inp" placeholder="예: 한글교실 / 엄마표 영어" value={fName} onChange={(e) => setFName(e.target.value)} />
              <div className="daypick">
                {(['학원', '집'] as const).map((k) => (
                  <button key={k} type="button" className={`daybtn wide${fKind === k ? ' on' : ''}`} onClick={() => setFKind(k)}>{k === '학원' ? '학원 다녀요' : '집에서 해요'}</button>
                ))}
              </div>
              {fKind === '학원' && (
                <div className="daychips" style={{ marginBottom: 12 }}>
                  {WD.map((w) => (
                    <button key={w.value} type="button" className={`daychip${fDays.includes(w.value) ? ' on' : ''}`} onClick={() => toggleDay(w.value)}>{w.label}</button>
                  ))}
                </div>
              )}
              <div className="fld-label">챙기는 영역</div>
              <div className="daypick wrap">
                {DOMAINS.map((d) => (
                  <button key={d} type="button" className={`daybtn wide${fDomains.includes(d) ? ' on' : ''}`} onClick={() => toggleDomain(d)}>{d}</button>
                ))}
              </div>
              <button className="btn-soft" onClick={addItem} disabled={!draft()} style={{ marginTop: 4 }}>
                <IconPlus w={16} /> 더하기
              </button>
            </div>

            <button className="share-link" style={{ justifyContent: 'flex-start' }} onClick={skip}>아직 없어요 · 나중에 추가할게요</button>
          </div>
        </div>
      </div>
      <div className="ob-foot">
        <div className="dots" aria-hidden="true">
          <span className={`dot-i${step === 0 ? ' on' : ''}`} />
          <span className={`dot-i${step === 1 ? ' on' : ''}`} />
        </div>
        <button className="btn-primary ob-next" onClick={next}>{step === 1 ? '나이테 시작하기' : '다음'}</button>
      </div>
    </div>
  )
}
