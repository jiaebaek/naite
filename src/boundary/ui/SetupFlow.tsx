/**
 * 첫 실행 셋업 — UX 리디자인 §06-A ③ (3스텝 · 원칙 8 회상보다 인식).
 * S1 아이 정보 · S2 다니는 학원(과목 칩) · S3 집에서 하는 것(활동 칩).
 * 빈칸 타이핑 없이 프리셋 칩만 탭 — 각 칩이 겨냥 영역을 자동 매핑. 세부(요일 등)는 관리에서.
 */
import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Domain } from '../../domain/types'
import { IconCheck } from './icons'

/** 프리셋 칩: 라벨 + 겨냥 영역(단일). */
interface Preset { readonly label: string; readonly domain: Domain }

const SUBJECTS: readonly Preset[] = [ // S2 · 다니는 학원(등원 커버)
  { label: '한글·독서', domain: '국어' }, { label: '수학·연산', domain: '수학' },
  { label: '영어', domain: '영어' }, { label: '미술', domain: '예체능' },
  { label: '피아노', domain: '예체능' }, { label: '발레·무용', domain: '예체능' },
  { label: '태권도', domain: '건강·안전' }, { label: '축구·체육', domain: '건강·안전' },
  { label: '과학·실험', domain: '과학·탐구' }, { label: '학습지(방문)', domain: '국어' },
]
const HOME: readonly Preset[] = [ // S3 · 집에서 하는 활동
  { label: '그림책 읽기', domain: '국어' }, { label: '한글 놀이', domain: '국어' },
  { label: '받아쓰기', domain: '국어' }, { label: '숫자·연산 놀이', domain: '수학' },
  { label: '보드게임', domain: '수학' }, { label: '엄마표 영어', domain: '영어' },
  { label: '영어 영상', domain: '영어' }, { label: '미술·만들기', domain: '예체능' },
  { label: '바깥 놀이', domain: '건강·안전' },
]

/** 셋업에서 고른 항목(칩) — 라벨=이름, domain=겨냥 영역 */
export interface SetupPick { readonly name: string; readonly domain: Domain }
export interface SetupResult {
  readonly name: string
  readonly birthYm: string
  readonly academies: readonly SetupPick[]
  readonly homeActivities: readonly SetupPick[]
}

export interface SetupFlowProps {
  readonly initialName: string
  readonly initialBirthYm: string
  readonly ageLabelOf: (birthYm: string) => string
  readonly onComplete: (r: SetupResult) => void
}

function PresetGrid({ presets, picked, onToggle }: {
  presets: readonly Preset[]; picked: ReadonlySet<string>; onToggle: (label: string) => void
}) {
  return (
    <div className="preset-grid">
      {presets.map((p) => (
        <button key={p.label} type="button" className={`pchip${picked.has(p.label) ? ' on' : ''}`} aria-pressed={picked.has(p.label)} onClick={() => onToggle(p.label)}>
          <svg className="pk" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M4 12l5 5L20 6" /></svg>{p.label}
        </button>
      ))}
    </div>
  )
}

function Added({ head, presets, picked }: { head: string; presets: readonly Preset[]; picked: ReadonlySet<string> }) {
  const chosen = presets.filter((p) => picked.has(p.label))
  if (chosen.length === 0) return null
  return (
    <div className="su-added">
      <div className="su-added-h">{head} {chosen.length}개 · 관련 목표가 바로 챙김돼요</div>
      {chosen.map((p) => (
        <div key={p.label} className="su-arow">
          <svg className="lf" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6}><path d="M5 12l5 5L20 6" /></svg>
          <span className="nm">{p.label}</span><span className="dm">{p.domain} 챙김</span>
        </div>
      ))}
    </div>
  )
}

export function SetupFlow({ initialName, initialBirthYm, ageLabelOf, onComplete }: SetupFlowProps) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState(initialName)
  const [birthYm, setBirthYm] = useState(initialBirthYm)
  const [aca, setAca] = useState<ReadonlySet<string>>(new Set())
  const [home, setHome] = useState<ReadonlySet<string>>(new Set())

  // 함수형 업데이트 — 빠른 연속 탭에도 이전 선택이 유지된다(스테일 클로저 방지)
  const makeToggle = (setSet: Dispatch<SetStateAction<ReadonlySet<string>>>) => (label: string) =>
    setSet((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label); else next.add(label)
      return next
    })
  const toggleAca = makeToggle(setAca)
  const toggleHome = makeToggle(setHome)

  const finish = () => onComplete({
    name: name.trim() || '첫째',
    birthYm,
    academies: SUBJECTS.filter((s) => aca.has(s.label)).map((s) => ({ name: s.label, domain: s.domain })),
    homeActivities: HOME.filter((h) => home.has(h.label)).map((h) => ({ name: h.label, domain: h.domain })),
  })
  const next = () => (step < 2 ? setStep(step + 1) : finish())

  return (
    <div className="onboard" data-testid="setup">
      <button className="ob-skip" onClick={finish}>나중에</button>
      <div className="ob-stage">
        {/* S1 아이 */}
        <div className={`setup-step${step === 0 ? ' active' : ''}`}>
          <div className="setup-top">
            <div className="eyebrow">1 / 3 · 아이 정보</div>
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
          </div>
        </div>

        {/* S2 다니는 학원 */}
        <div className={`setup-step${step === 1 ? ' active' : ''}`}>
          <div className="setup-top">
            <div className="eyebrow">2 / 3 · 다니는 학원</div>
            <h2 className="setup-h">어떤 학원에<br />다녀요?</h2>
            <p className="setup-p">이름은 나중에요. <b>과목만 눌러</b> 추가하면 등원 알림·숙제 챙김이 자동으로 붙어요.</p>
            <PresetGrid presets={SUBJECTS} picked={aca} onToggle={toggleAca} />
            <Added head="다니는 학원" presets={SUBJECTS} picked={aca} />
            <button className="share-link" style={{ justifyContent: 'flex-start' }} onClick={() => setStep(2)}>다니는 학원 없어요 · 건너뛰기</button>
          </div>
        </div>

        {/* S3 집에서 하는 것 */}
        <div className={`setup-step${step === 2 ? ' active' : ''}`}>
          <div className="setup-top">
            <div className="eyebrow">3 / 3 · 집에서 하는 것</div>
            <h2 className="setup-h">집에서 챙기는<br />활동도 있나요?</h2>
            <p className="setup-p">엄마표·놀이처럼 <b>집에서 하는 것</b>을 눌러 추가해요. 없으면 건너뛰어도 괜찮아요.</p>
            <PresetGrid presets={HOME} picked={home} onToggle={toggleHome} />
            <Added head="집에서 하는 활동" presets={HOME} picked={home} />
            <button className="share-link" style={{ justifyContent: 'flex-start' }} onClick={finish}>집에서 따로 없어요 · 건너뛰기</button>
          </div>
        </div>
      </div>
      <div className="ob-foot">
        <div className="dots" aria-hidden="true">
          {[0, 1, 2].map((n) => <span key={n} className={`dot-i${n === step ? ' on' : ''}`} />)}
        </div>
        <button className="btn-primary ob-next" onClick={next}>{step === 2 ? '나이테 시작하기' : '다음'}</button>
      </div>
    </div>
  )
}
