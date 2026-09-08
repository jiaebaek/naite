/**
 * 우리 목표 정하기 바텀시트 — 공교육 기준이 없는 영역(영어 등)의 목표를 **부모가 직접 입력**.
 *
 * 초판엔 영어 목표가 코드에 박혀 있었지만 그건 개발자가 넣은 예시였다. 이제 부모가 정한다.
 * 원칙 8(회상보다 인식): 흔한 목표는 칩으로 제시하되, 자기 목표는 자유 입력도 된다.
 */
import { useState } from 'react'
import { IconX, IconPlus } from './icons'

/** 영역별 흔한 자체 목표 제안 (탭하면 입력칸을 채운다). */
const SUGGEST: Readonly<Record<string, readonly string[]>> = {
  영어: ['영어 그림책 읽기', '영어 영상 보기', '영어 노래·챈트 부르기', '파닉스 놀이', '영어로 말해보기', '알파벳 익히기'],
}

export interface GoalSheetProps {
  readonly domain: string
  readonly onAdd: (statement: string) => void
  readonly onClose: () => void
}

export function GoalSheet({ domain, onAdd, onClose }: GoalSheetProps) {
  const [text, setText] = useState('')
  const suggestions = SUGGEST[domain] ?? []
  const trimmed = text.trim()

  return (
    <div className="sheet-wrap" data-testid="goal-sheet">
      <div className="sheet-bg" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label="우리 목표 정하기">
        <div className="grab" />
        <div className="sheet-head">
          <h3>우리 목표 정하기</h3>
          <button className="sheet-x" onClick={onClose} aria-label="닫기"><IconX /></button>
        </div>
        <div className="target">
          <span className="badge own">{domain}</span>
          <span className="tg-name">공교육 기준이 없는 영역이라, 우리 집 목표를 직접 정해요.</span>
        </div>
        <div className="sheet-body">
          {suggestions.length > 0 && (
            <>
              <div className="opt-label">이런 목표는 어때요 <span style={{ fontWeight: 400, color: 'var(--muted)' }}>· 눌러서 담기</span></div>
              <div className="preset-grid">
                {suggestions.map((s) => (
                  <button key={s} type="button" className={`pchip${trimmed === s ? ' on' : ''}`} aria-pressed={trimmed === s} onClick={() => setText(s)}>
                    <svg className="pk" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M4 12l5 5L20 6" /></svg>{s}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="opt-label">직접 쓰기</div>
          <input
            className="inp"
            placeholder="예: 영어 그림책 하루 한 권"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="목표 문장"
          />
        </div>
        <div className="sheet-foot">
          <button className="btn-primary" disabled={trimmed.length === 0} onClick={() => onAdd(trimmed)}>
            <IconPlus w={17} /> 이 목표 추가하기
          </button>
        </div>
      </div>
    </div>
  )
}
