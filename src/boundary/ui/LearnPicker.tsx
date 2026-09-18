/**
 * 선택적 학습 정교화 (§06-C · T11) — 통찰 화면에서 "학원 추가하면 더 정확해져요"로 진입.
 *
 * 온보딩 게이트 아님(§06-A 는 생년월+기관 1탭으로 끝). 여기서 과목(국·영·수·과·예체능)별 한 카드:
 *   다니는 학원?(칩) → **학원별** 숙제 토글 → 기타 학원 직접 입력 → 집에서 하는 것?(칩).
 * 고른 것을 프리셋 묶음(T7) 커버로 반영한다. 안 해도 첫 안도는 이미 기관 등원으로 채워져 있다.
 *   ⭐ 온보딩에서 분리된 옛 §06-A S2. 톤 = "어디 다녀요?"(현재 기록), 추천 목록 아님(SSOT §9).
 */
import { useState } from 'react'
import type { Domain } from '../../domain/types'
import { presetByType } from '../../domain/standards/activityPresets'

/** 학습 레인 과목 순서. 생활·마음은 별도 관찰 체크(§06-B). */
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

/** 고른 항목 — 라벨=이름, domain=폴백 영역, presetType=활동유형, coverMode=숙제 여부(학원만) */
export interface SetupPick {
  readonly name: string
  readonly domain: Domain
  readonly presetType?: string
  readonly coverMode?: '등원형' | '숙제형'
}
export interface LearnPicks {
  readonly academies: readonly SetupPick[]
  readonly homeActivities: readonly SetupPick[]
}

export interface LearnPickerProps {
  readonly band: 'nuri' | 'elem'
  readonly onClose: () => void
  readonly onComplete: (picks: LearnPicks) => void
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

export function LearnPicker({ band, onClose, onComplete }: LearnPickerProps) {
  const chips = band === 'elem' ? ELEM_CHIPS : NURI_CHIPS
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set())
  const [custom, setCustom] = useState<Readonly<Record<string, readonly string[]>>>({})
  const [draft, setDraft] = useState<Readonly<Record<string, string>>>({})
  const [hw, setHw] = useState<Readonly<Record<string, boolean>>>({})

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
    onComplete({ academies: [...presetAca, ...customAca], homeActivities })
  }

  /** 학원 하나의 숙제 토글 행. */
  const HwToggle = ({ label, keyId, presetType }: { label: string; keyId: string; presetType?: string | undefined }) => (
    <label className="hw-toggle">
      <input type="checkbox" checked={hwOf(keyId, presetType)} onChange={(e) => setHwKey(keyId, e.target.checked)} />
      <b>{label}</b> 집에서 하는 숙제가 있어요 <span className="opt">({hwOf(keyId, presetType) ? '숙제 체크로 챙김' : '다니면서 챙김'})</span>
    </label>
  )

  return (
    <div className="onboard" data-testid="learn-picker">
      <button className="ob-skip" onClick={onClose}>나중에</button>
      <div className="ob-stage">
        <div className="setup-step active">
          <div className="setup-top">
            <div className="eyebrow">학원·집공부 추가</div>
            <h2 className="setup-h">지금 하는 것만<br />알려주세요</h2>
            <p className="setup-p"><b>지금 하는 것만 빠르게</b> 눌러요. 안 하는 과목은 그냥 넘겨도 돼요 — 더 정확해질 뿐, 안 해도 괜찮아요.</p>
            {SUBJECTS.map((domain) => {
              const acaChips = chips.filter((c) => c.domain === domain && c.kind === '학원')
              const homeChips = chips.filter((c) => c.domain === domain && c.kind === '집')
              const customList = custom[domain] ?? []
              return (
                <div key={domain} className="subj-card" data-testid={`subj-${domain}`}>
                  <div className="subj-head">{domain}</div>
                  <div className="subj-q">다니는 학원 있어요?</div>
                  {acaChips.length > 0 && <Chips chips={acaChips} picked={picked} onToggle={toggle} />}
                  {acaChips.filter((c) => picked.has(c.label)).map((c) => (
                    <HwToggle key={c.label} label={c.label} keyId={c.label} presetType={c.presetType} />
                  ))}
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
          </div>
        </div>
      </div>
      <div className="ob-foot">
        <button className="btn-primary ob-next" onClick={finish}>추가 완료</button>
      </div>
    </div>
  )
}
