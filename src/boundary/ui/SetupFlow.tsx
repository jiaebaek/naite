/**
 * 첫 실행 셋업 — UX 리디자인 §06-A ③. 온보딩 직후 2스텝(아이 정보 · 내 학원).
 * 목적: (1) 시기·나이 기준(생년월) (2) 실제 학원을 첫 흐름에 등록 → 첫 세션 안도가 실데이터로.
 * 짧게. 학원은 하나만 넣거나 스킵 가능. 폼은 §12 학원 폼과 같은 어휘.
 */
import { useState } from 'react'
import type { Weekday } from '../../domain/types'
import { IconCheck } from './icons'

export interface SetupResult {
  readonly name: string
  readonly birthYm: string
  /** 하나의 학원(선택). 없으면 null */
  readonly academy: { readonly name: string; readonly weekdays: readonly Weekday[] } | null
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
  const [acName, setAcName] = useState('')
  const [days, setDays] = useState<readonly Weekday[]>([])

  const toggleDay = (v: Weekday) => setDays((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]))
  const finish = (withAcademy: boolean) => onComplete({
    name: name.trim() || '첫째',
    birthYm,
    academy: withAcademy && acName.trim() ? { name: acName.trim(), weekdays: [...days].sort() } : null,
  })
  const next = () => (step === 0 ? setStep(1) : finish(true))

  return (
    <div className="onboard" data-testid="setup">
      <button className="ob-skip" onClick={() => finish(false)}>나중에</button>
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

        {/* S2. 내 학원 */}
        <div className={`setup-step${step === 1 ? ' active' : ''}`}>
          <div className="setup-top">
            <div className="eyebrow">2 / 2 · 어디 다녀요?</div>
            <h2 className="setup-h">다니는 곳을<br />하나만 알려주세요</h2>
            <p className="setup-p">넣는 순간, 그 활동이 챙기는 목표가 <b>첫 화면에 바로</b> 채워져요. 여러 개여도 하나면 충분해요.</p>
            <div className="field">
              <label htmlFor="suAcademy">학원 / 활동 이름</label>
              <input className="inp" id="suAcademy" placeholder="예: 한글교실" value={acName} onChange={(e) => setAcName(e.target.value)} />
            </div>
            <div className="field">
              <label>가는 요일</label>
              <div className="daychips">
                {WD.map((w) => (
                  <button key={w.value} type="button" className={`daychip${days.includes(w.value) ? ' on' : ''}`} onClick={() => toggleDay(w.value)}>{w.label}</button>
                ))}
              </div>
            </div>
            <button className="share-link" style={{ justifyContent: 'flex-start' }} onClick={() => finish(false)}>아직 없어요 · 나중에 추가할게요</button>
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
