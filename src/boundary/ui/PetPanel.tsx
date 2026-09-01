/**
 * 펫 (오늘 화면 상단). docs/08-UI계약.md §3-B
 *
 * ⚠️ 벌 없는 펫 (INV-UI-41). 안 돌봤다고 굶거나 슬퍼지지 않는다.
 *    성장은 도메인 petStage() 가 정한다 — UI 가 임의로 키우지 않는다 (INV-UI-44 / INV-UI-00).
 */

import { canCare, petStage } from '../../domain/pet'
import type { CareState } from '../../domain/pet'

export interface PetPanelProps {
  readonly care: CareState
  /** 돌봄 1회. 셋(먹이/쓰다듬기/놀아주기) 모두 같은 동작이다 (토큰 1, 돌봄 1). */
  readonly onCare: () => void
}

const ACTIONS = [
  { key: 'feed', emoji: '🍖', label: '먹이주기' },
  { key: 'pet', emoji: '✋', label: '쓰다듬기' },
  { key: 'play', emoji: '🎾', label: '놀아주기' },
] as const

export function PetPanel({ care, onCare }: PetPanelProps) {
  const stage = petStage(care.careCount)
  const usable = canCare(care)

  return (
    <section className="pet" data-testid="pet" aria-label="우리 펫">
      <div className="pet__top">
        <span
          className="pet__emoji"
          data-testid="pet-emoji"
          data-stage={stage.index}
          style={{ fontSize: `${1.8 + stage.index * 0.5}rem` }}
        >
          {stage.emoji}
        </span>
        <span className="pet__stage" data-testid="pet-stage" data-stage={stage.index}>
          {stage.label}
        </span>
      </div>

      {/* INV-UI-42 — 토큰이 있을 때만 활성. 없으면 굶는 게 아니라 "할 일 하면 돌볼 수 있어요" */}
      {usable ? (
        <p className="pet__tokens">돌볼 수 있어요 · {care.available}번</p>
      ) : (
        <p className="pet__tokens pet__tokens--empty">할 일을 하면 돌볼 수 있어요</p>
      )}

      <div className="pet__actions" role="group" aria-label="돌보기">
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            type="button"
            className="pet__btn"
            disabled={!usable}
            // INV-UI-45 — 탭 1회. 확인 다이얼로그 없음.
            onClick={onCare}
          >
            <span aria-hidden="true">{a.emoji}</span>
            {a.label}
          </button>
        ))}
      </div>
    </section>
  )
}
