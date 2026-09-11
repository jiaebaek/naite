/**
 * 생활·마음 관찰 체크 모듈 — UX 리디자인 §06-B ("3분 우리 애 체크").
 * 성취기준을 부드러운 질문으로. 예/아직/모름 3택. "예"=이룸(부모 관찰). 평가·점수 아님(OOS-6).
 * 온보딩 밖 · 재방문 훅. 결과는 안도 톤("생활·마음도 이만큼 챙겨지고 있어요"), 학습 레인과 분리.
 */
import { useState } from 'react'
import { clusterById } from '../../domain/standards/clusters'
import { achievedClustersFrom } from '../../domain/standards/observationChecks'
import type { ObsCheck } from '../../domain/standards/observationChecks'
import { IconX } from './icons'

type Ans = 'yes' | 'not-yet' | 'unknown'
const OPTS: readonly { value: Ans; label: string }[] = [
  { value: 'yes', label: '예' }, { value: 'not-yet', label: '아직' }, { value: 'unknown', label: '모름' },
]

export interface ObservationCheckProps {
  readonly checks: readonly ObsCheck[]
  readonly onClose: () => void
  /** 이룸으로 볼 묶음 id 들(모든 질문 '예'). App 이 achieved 에 합친다. */
  readonly onComplete: (achievedClusterIds: readonly string[]) => void
}

export function ObservationCheck({ checks, onClose, onComplete }: ObservationCheckProps) {
  const [answers, setAnswers] = useState<Readonly<Record<string, Ans>>>({})
  const [done, setDone] = useState<readonly string[] | null>(null)
  const set = (id: string, a: Ans) => setAnswers((prev) => ({ ...prev, [id]: a }))

  const save = () => {
    const achieved = achievedClustersFrom(checks, answers)
    setDone(achieved)
    onComplete(achieved)
  }

  return (
    <div className="sheet-wrap" data-testid="obs-check">
      <div className="sheet-bg" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label="생활·마음 체크">
        <div className="grab" />
        <div className="sheet-head">
          <h3>우리 아이 요즘 체크</h3>
          <button className="sheet-x" onClick={onClose} aria-label="닫기"><IconX /></button>
        </div>

        {done === null ? (
          <>
            <p className="obs-intro">요즘 이런 것 하나요? <b>맞으면 예, 아니면 아직</b>이면 돼요. 못 하는 게 아니라 아직일 뿐이에요.</p>
            <div className="sheet-body">
              {checks.map((c) => (
                <div key={c.clusterId} className="obs-cl" data-testid={`obs-${c.clusterId}`}>
                  <div className="obs-cl-name">{clusterById(c.clusterId)?.label ?? c.clusterId}</div>
                  {c.questions.map((qq) => (
                    <div key={qq.id} className="obs-q">
                      <span className="obs-q-text">{qq.text}</span>
                      <div className="obs-opts" role="group" aria-label={qq.text}>
                        {OPTS.map((o) => (
                          <button
                            key={o.value}
                            type="button"
                            className={`obs-opt${answers[qq.id] === o.value ? ' on' : ''}`}
                            aria-pressed={answers[qq.id] === o.value}
                            onClick={() => set(qq.id, o.value)}
                          >{o.label}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="sheet-foot">
              <button className="btn-primary" onClick={save}>다 봤어요</button>
            </div>
          </>
        ) : (
          <>
            <div className="sheet-body">
              <div className="obs-result" data-testid="obs-result">
                <div className="obs-result-big">생활·마음도 이만큼<br />챙겨지고 있어요</div>
                <p>{done.length > 0
                  ? `${done.length}곳을 이미 잘 하고 있네요. 나머지는 천천히 — 못 하는 게 아니라 아직이에요.`
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
