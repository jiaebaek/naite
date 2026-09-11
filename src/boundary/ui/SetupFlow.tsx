/**
 * 첫 실행 셋업 — UX 리디자인 §06-A ③ (3스텝 · 원칙 8 회상보다 인식).
 * S1 아이 정보 · S2 다니는 학원(과목 칩) · S3 집에서 하는 것(활동 칩).
 * ⭐ T7: 칩 세트를 아이 현재 band(미취학/초1~2)로 분기한다(docs/11 §3). 칩은 활동유형 프리셋 type 을
 *    함께 넘겨, App 이 그 프리셋의 묶음(cluster)을 현재 band 로 걸러 겨냥 목표로 확정한다.
 */
import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Domain } from '../../domain/types'
import { DOMAINS } from '../../domain/types'
import { IconCheck } from './icons'

/** 프리셋 칩: 라벨 + 폴백 영역 + (선택) 활동유형 프리셋 type. presetType 없으면 자동 겨냥 없음(원칙3). */
interface Preset { readonly label: string; readonly domain: Domain; readonly presetType?: string }

// ── 미취학(nuri) 칩 (docs/11 §3-A) ──
const NURI_SUBJECTS: readonly Preset[] = [
  { label: '한글·독서', domain: '국어', presetType: '한글' }, { label: '놀이수학', domain: '수학', presetType: '사고력수학' },
  { label: '영어', domain: '영어', presetType: '영어' }, { label: '미술', domain: '예체능', presetType: '미술' },
  { label: '피아노', domain: '예체능', presetType: '피아노' }, { label: '발레·무용', domain: '예체능', presetType: '발레' },
  { label: '태권도', domain: '예체능', presetType: '태권도' }, { label: '축구·체육', domain: '예체능', presetType: '축구' },
  { label: '유아체육', domain: '예체능', presetType: '유아체육' }, { label: '수영', domain: '예체능', presetType: '수영' },
]
const NURI_HOME: readonly Preset[] = [
  { label: '그림책 읽기', domain: '국어', presetType: '독서' }, { label: '한글 놀이', domain: '국어', presetType: '한글' },
  { label: '숫자·보드게임', domain: '수학', presetType: '보드게임' }, { label: '엄마표 영어', domain: '영어', presetType: '영어' },
  { label: '영어 영상', domain: '영어', presetType: '영어' }, { label: '미술·만들기', domain: '예체능', presetType: '미술' },
  { label: '바깥놀이', domain: '예체능', presetType: '바깥놀이' },
]
// ── 초1~2(elem) 칩 (docs/11 §3-B) ──
const ELEM_SUBJECTS: readonly Preset[] = [
  { label: '영어학원', domain: '영어', presetType: '영어' }, { label: '수학학원', domain: '수학', presetType: '사고력수학' },
  { label: '국어·논술', domain: '국어', presetType: '논술' }, { label: '독서·글쓰기', domain: '국어', presetType: '독서' },
  { label: '태권도', domain: '예체능', presetType: '태권도' }, { label: '피아노', domain: '예체능', presetType: '피아노' },
  { label: '수영', domain: '예체능', presetType: '수영' }, { label: '미술', domain: '예체능', presetType: '미술' },
  { label: '발레·무용', domain: '예체능', presetType: '발레' }, { label: '축구·체육', domain: '예체능', presetType: '축구' },
  { label: '코딩·로봇', domain: '과학·탐구', presetType: '코딩·로봇' }, { label: '방과후교실', domain: '국어' },
]
const ELEM_HOME: readonly Preset[] = [
  { label: '책읽기', domain: '국어', presetType: '독서' }, { label: '일기·글쓰기', domain: '국어', presetType: '일기·글쓰기' },
  { label: '연산 문제집', domain: '수학', presetType: '연산' }, { label: '영어(원서·영상)', domain: '영어', presetType: '영어' },
  { label: '학습지', domain: '국어' }, { label: '보드게임', domain: '수학', presetType: '보드게임' },
]

/** 셋업에서 고른 항목(칩) — 라벨=이름, domain=폴백 영역, presetType=활동유형(있으면 겨냥 묶음 확정) */
export interface SetupPick { readonly name: string; readonly domain: Domain; readonly presetType?: string }
export interface SetupResult {
  readonly name: string
  readonly birthYm: string
  readonly academies: readonly SetupPick[]
  readonly homeActivities: readonly SetupPick[]
  /** 부모가 특히 챙기고 싶은 분야 1~2개 — 중요도 정렬의 기준 */
  readonly priorityDomains: readonly Domain[]
}

export interface SetupFlowProps {
  readonly initialName: string
  readonly initialBirthYm: string
  readonly ageLabelOf: (birthYm: string) => string
  /** 아이 생년월 → 현재 band (미취학/초1~2). 칩 세트 분기용. */
  readonly bandOf: (birthYm: string) => 'nuri' | 'elem'
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

export function SetupFlow({ initialName, initialBirthYm, ageLabelOf, bandOf, onComplete }: SetupFlowProps) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState(initialName)
  const [birthYm, setBirthYm] = useState(initialBirthYm)
  const [aca, setAca] = useState<ReadonlySet<string>>(new Set())
  const [home, setHome] = useState<ReadonlySet<string>>(new Set())
  const [priority, setPriority] = useState<readonly Domain[]>([])

  // 현재 band 로 칩 세트 분기 (생년월을 바꾸면 즉시 반영)
  const band = bandOf(birthYm)
  const subjects = band === 'elem' ? ELEM_SUBJECTS : NURI_SUBJECTS
  const homeItems = band === 'elem' ? ELEM_HOME : NURI_HOME

  // 부모 우선 분야 — 최대 2개 (한두개)
  const togglePriority = (d: Domain) => setPriority((prev) =>
    prev.includes(d) ? prev.filter((x) => x !== d) : prev.length < 2 ? [...prev, d] : prev)

  // 함수형 업데이트 — 빠른 연속 탭에도 이전 선택이 유지된다(스테일 클로저 방지)
  const makeToggle = (setSet: Dispatch<SetStateAction<ReadonlySet<string>>>) => (label: string) =>
    setSet((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label); else next.add(label)
      return next
    })
  const toggleAca = makeToggle(setAca)
  const toggleHome = makeToggle(setHome)

  const toPick = (p: Preset): SetupPick => ({ name: p.label, domain: p.domain, ...(p.presetType ? { presetType: p.presetType } : {}) })
  const finish = () => onComplete({
    name: name.trim() || '첫째',
    birthYm,
    academies: subjects.filter((s) => aca.has(s.label)).map(toPick),
    homeActivities: homeItems.filter((h) => home.has(h.label)).map(toPick),
    priorityDomains: [...priority],
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

        {/* S2 다니는 학원 */}
        <div className={`setup-step${step === 1 ? ' active' : ''}`}>
          <div className="setup-top">
            <div className="eyebrow">2 / 3 · 다니는 학원</div>
            <h2 className="setup-h">어떤 학원에<br />다녀요?</h2>
            <p className="setup-p">이름은 나중에요. <b>과목만 눌러</b> 추가하면 등원 알림·숙제 챙김이 자동으로 붙어요.</p>
            <PresetGrid presets={subjects} picked={aca} onToggle={toggleAca} />
            <Added head="다니는 학원" presets={subjects} picked={aca} />
            <button className="share-link" style={{ justifyContent: 'flex-start' }} onClick={() => setStep(2)}>다니는 학원 없어요 · 건너뛰기</button>
          </div>
        </div>

        {/* S3 집에서 하는 것 */}
        <div className={`setup-step${step === 2 ? ' active' : ''}`}>
          <div className="setup-top">
            <div className="eyebrow">3 / 3 · 집에서 하는 것</div>
            <h2 className="setup-h">집에서 챙기는<br />활동도 있나요?</h2>
            <p className="setup-p">엄마표·놀이처럼 <b>집에서 하는 것</b>을 눌러 추가해요. 없으면 건너뛰어도 괜찮아요.</p>
            <PresetGrid presets={homeItems} picked={home} onToggle={toggleHome} />
            <Added head="집에서 하는 활동" presets={homeItems} picked={home} />
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
