/**
 * 성장 좌표 관찰 체크 (§10) — **영역별.** 그 영역 GrowthPoint 의 관찰행동을 예/아직/모름으로.
 *
 * "예"=그 order 를 좌표 근거로(좌표 해상도↑). "아직"=넛지 없이. "모름"=미표시.
 *   - ⚠️ 평가·점수·"테스트" 아님(OOS-6). "요즘 이런 모습 하나요?" 톤. "못 하는 게 아니라 아직."
 *   - 영역별로 나눠 짧게(반복 훅). 결과는 안도 톤 + 좌표 반영.
 */
import { useState } from 'react'
import type { GrowthPoint } from '../../domain/standards/growthPoints'
import type { ObsAnswer } from '../../domain/growth'
import { behaviorKey } from '../../domain/growth'
import { IconX } from './icons'

const OPTS: readonly { value: ObsAnswer; label: string }[] = [
  { value: 'yes', label: '예' }, { value: 'not-yet', label: '아직' }, { value: 'unknown', label: '모름' },
]

export interface GrowthCheckProps {
  readonly domain: string
  readonly points: readonly GrowthPoint[]
  /** 기존 답변(다른 영역 포함) — 합쳐서 돌려준다. */
  readonly initial: Readonly<Record<string, ObsAnswer>>
  readonly onComplete: (answers: Record<string, ObsAnswer>) => void
  readonly onClose: () => void
}

export function GrowthCheck({ domain, points, initial, onComplete, onClose }: GrowthCheckProps) {
  const [answers, setAnswers] = useState<Record<string, ObsAnswer>>({ ...initial })
  const [done, setDone] = useState(false)
  const set = (k: string, a: ObsAnswer) => setAnswers((prev) => ({ ...prev, [k]: a }))
  const save = () => { onComplete(answers); setDone(true) }
  const yesCount = points.reduce(
    (n, gp) => n + gp.behaviors.filter((b) => answers[behaviorKey(gp.id, b.order)] === 'yes').length, 0,
  )

  return (
    <div className="sheet-wrap" data-testid="growth-check">
      <div className="sheet-bg" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label={`${domain} 관찰 체크`}>
        <div className="grab" />
        <div className="sheet-head">
          <h3>{domain} — 우리 애 요즘 체크</h3>
          <button className="sheet-x" onClick={onClose} aria-label="닫기"><IconX /></button>
        </div>

        {!done ? (
          <>
            <p className="obs-intro">요즘 이런 모습 보이나요? <b>맞으면 예, 아니면 아직</b>이면 돼요. 못 하는 게 아니라 아직일 뿐이에요.</p>
            <div className="sheet-body">
              {points.map((gp) => (
                <div key={gp.id} className="obs-cl" data-testid={`gc-${gp.id}`}>
                  <div className="obs-cl-name">{gp.name}</div>
                  {gp.behaviors.map((b) => {
                    const k = behaviorKey(gp.id, b.order)
                    return (
                      <div key={k} className="obs-q">
                        <span className="obs-q-text">{b.parentText}</span>
                        <div className="obs-opts" role="group" aria-label={b.parentText}>
                          {OPTS.map((o) => (
                            <button
                              key={o.value}
                              type="button"
                              className={`obs-opt${answers[k] === o.value ? ' on' : ''}`}
                              aria-pressed={answers[k] === o.value}
                              onClick={() => set(k, o.value)}
                            >{o.label}</button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            <p className="obs-reward">✓ 답하면 이 영역 좌표에 바로 반영돼요 — 상세가 더 정확해져요</p>
            <div className="sheet-foot">
              <button className="btn-primary" onClick={save}>다 봤어요</button>
            </div>
          </>
        ) : (
          <>
            <div className="sheet-body">
              <div className="obs-result" data-testid="gc-result">
                <div className="obs-result-big">{domain}, 이런 모습이<br />보이고 있어요</div>
                <p>{yesCount > 0
                  ? '방금 답한 모습이 좌표에 반영됐어요. 나머지는 천천히 — 못 하는 게 아니라 아직이에요.'
                  : '지금은 천천히 지켜봐도 괜찮아요. 일상에서 자연히 자라는 것들이에요.'}</p>
              </div>
            </div>
            <div className="sheet-foot">
              <button className="btn-primary" onClick={onClose}>좋아요</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
