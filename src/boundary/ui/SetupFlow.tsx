/**
 * 첫 실행 셋업 — UX 리디자인 §06-A (통찰-먼저 · T11 개정 2026-09).
 *
 * ⭐ 입력-먼저 → 통찰-먼저. 과목별 학습 입력은 온보딩에서 뺐다(→ §06-C LearnPicker, 통찰 화면에서 선택).
 *   S1 아이 정보(생년월 필수 + 이름 + 우선분야).
 *   S2 "유치원/어린이집(초1~2=학교) 다녀요?" 1탭 — 다니면 생활·마음이 대부분 저절로 챙겨진다(§05 등원커버).
 * 노동 0으로 첫 안도. band 가 지원 범위(미취학~초2) 밖이면 예외 안내(#6).
 */
import { useState } from 'react'
import type { Domain } from '../../domain/types'
import { DOMAINS } from '../../domain/types'
import { IconCheck } from './icons'

export interface SetupResult {
  readonly name: string
  readonly birthYm: string
  /** 유치원/어린이집(초1~2=학교) 등원 여부 → 생활·마음 자동커버(§05·SSOT §5). */
  readonly attendsInstitution: boolean
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

export function SetupFlow({ initialName, initialBirthYm, ageLabelOf, bandOf, onComplete }: SetupFlowProps) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState(initialName)
  const [birthYm, setBirthYm] = useState(initialBirthYm)
  const [attends, setAttends] = useState(true)
  const [priority, setPriority] = useState<readonly Domain[]>([])

  const band = bandOf(birthYm)
  // 초1~2 는 "학교", 그 외(미취학)는 "유치원·어린이집".
  const instLabel = band === 'elem' ? '학교' : '유치원·어린이집'

  const togglePriority = (d: Domain) => setPriority((prev) =>
    prev.includes(d) ? prev.filter((x) => x !== d) : prev.length < 2 ? [...prev, d] : prev)

  const finish = () => {
    onComplete({ name: name.trim() || '첫째', birthYm, attendsInstitution: attends, priorityDomains: [...priority] })
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

        {/* S2 기관 등원 (1탭) — 생활·마음 자동커버 */}
        <div className={`setup-step${step === 1 ? ' active' : ''}`}>
          <div className="setup-top">
            <div className="eyebrow">2 / 2 · 어디 다녀요?</div>
            <h2 className="setup-h">{instLabel}<br />다니고 있나요?</h2>
            {band === null ? (
              <p className="setup-p">이 나이는 아직 지원하지 않아요. <b>미취학(만 3세)~초2</b>까지 전문가가 세운 국가 기준을 담고 있어요. 나중에 다시 만나요.</p>
            ) : (
              <>
                <p className="setup-p">다니면 <b>생활·마음(사회성·건강·안전)</b>이 대부분 저절로 챙겨져요. 학원·집공부는 나중에 통찰 화면에서 더해도 돼요.</p>
                <div className="inst-pick" data-testid="inst-pick">
                  <button type="button" className={`inst-btn${attends ? ' on' : ''}`} aria-pressed={attends}
                    data-testid="inst-yes" onClick={() => setAttends(true)}>
                    <b>네, 다녀요</b><span className="opt">{instLabel} 등원</span>
                  </button>
                  <button type="button" className={`inst-btn${!attends ? ' on' : ''}`} aria-pressed={!attends}
                    data-testid="inst-no" onClick={() => setAttends(false)}>
                    <b>아직이요</b><span className="opt">집에서 지내요</span>
                  </button>
                </div>
                {attends && (
                  <div className="setup-reward" data-testid="inst-reward">
                    <IconCheck w={16} />생활·마음이 이미 챙겨지는 걸로 준비했어요
                  </div>
                )}
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
