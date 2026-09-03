/**
 * 활동 연결 바텀시트 — UX 리디자인 §10.
 * 추천 활동(새로 생성) / 기존 활동에 연결 / 새 활동 직접. 단일 선택 + 하단 고정 CTA.
 */
import { useState } from 'react'
import { IconPlus, IconX } from './icons'

export type LinkChoice =
  | { readonly kind: 'recommend'; readonly name: string }
  | { readonly kind: 'existing'; readonly activityId: string }
  | { readonly kind: 'new' }

export interface LinkSheetProps {
  readonly domain: string
  readonly statement: string
  readonly standardId: string
  readonly recommend: string
  readonly existing: readonly { readonly id: string; readonly name: string; readonly sub: string }[]
  readonly onConfirm: (choice: LinkChoice) => void
  readonly onClose: () => void
}

export function LinkSheet({ domain, statement, recommend, existing, onConfirm, onClose }: LinkSheetProps) {
  const [sel, setSel] = useState<LinkChoice>({ kind: 'recommend', name: recommend })

  const isSel = (k: LinkChoice['kind'], id?: string) =>
    sel.kind === k && (k !== 'existing' || (sel as { activityId: string }).activityId === id)

  return (
    <div className="sheet-wrap" data-testid="link-sheet">
      <div className="sheet-bg" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label="활동 연결">
        <div className="grab" />
        <div className="sheet-head">
          <h3>활동 연결</h3>
          <button className="sheet-x" onClick={onClose} aria-label="닫기"><IconX /></button>
        </div>
        <div className="target">
          <span className="badge gov">{domain}</span>
          <span className="tg-name">{statement}</span>
        </div>
        <div className="sheet-body">
          <div className="opt-label">추천 활동</div>
          <button type="button" className={`opt${isSel('recommend') ? ' sel' : ''}`} onClick={() => setSel({ kind: 'recommend', name: recommend })}>
            <span className="opt-radio" />
            <span className="opt-main"><b>{recommend}</b><small>새 활동 · 자체 · 이 목표를 겨냥</small></span>
            <span className="opt-tag">추천</span>
          </button>

          {existing.length > 0 && <div className="opt-label">기존 활동에 연결</div>}
          {existing.map((a) => (
            <button key={a.id} type="button" className={`opt${isSel('existing', a.id) ? ' sel' : ''}`} onClick={() => setSel({ kind: 'existing', activityId: a.id })}>
              <span className="opt-radio" />
              <span className="opt-main"><b>{a.name}</b><small>{a.sub}</small></span>
            </button>
          ))}

          <div className="opt-label">직접 만들기</div>
          <button type="button" className={`opt new${isSel('new') ? ' sel' : ''}`} onClick={() => setSel({ kind: 'new' })}>
            <IconPlus w={17} /> 새 활동 직접 추가
          </button>
        </div>
        <div className="sheet-foot">
          <button className="btn-primary" onClick={() => onConfirm(sel)}>이 활동으로 연결하기</button>
        </div>
      </div>
    </div>
  )
}
