/**
 * 돌봄·펫 (F-pet). docs/07-계약.md §9
 *
 * ⭐ 벌 없는 펫. 할 일을 하면 돌봄 토큰이 생기고(grantToken),
 *    그 토큰으로 펫을 돌본다(performCare). 돌봄이 쌓이면 자란다(petStage).
 *
 * ⚠️ 핵심: 안 돌봤다고 펫이 작아지거나 굶지 않는다.
 *    careCount 는 절대 줄지 않는다 (INV-PET-02). streak 철학과 같다 — 벌이 아니라 흐름.
 *    사용자 결정: "밥 못 줘서 굶는" 버전이 아니라, 완료가 돌봄 버튼을 열어주는 방식.
 */

import { DomainError } from './errors'

export interface CareState {
  /** 쓸 수 있는 돌봄 토큰 (완료로 벌고, 돌봄으로 쓴다) */
  readonly available: number
  /** 누적 돌봄 횟수. 펫 성장의 척도. 절대 줄지 않는다 */
  readonly careCount: number
}

export const INITIAL_CARE: CareState = { available: 0, careCount: 0 }

/** 할 일 완료 시 토큰 +1. (INV-PET-04 — available 를 줄이지 않는다) */
export function grantToken(care: CareState): CareState {
  return { ...care, available: care.available + 1 }
}

export function canCare(care: CareState): boolean {
  return care.available >= 1
}

/**
 * 펫을 한 번 돌본다 (먹이/쓰다듬기/놀아주기 — 셋 다 토큰 1, 돌봄 1).
 * @throws DomainError E-CARE-NO-TOKEN — 토큰이 없으면. 돌봄은 완료로만 얻는다.
 */
export function performCare(care: CareState): CareState {
  if (!canCare(care)) {
    throw new DomainError('E-CARE-NO-TOKEN', '먼저 할 일을 하면 돌볼 수 있어요')
  }
  return { available: care.available - 1, careCount: care.careCount + 1 }
}

export interface PetStage {
  readonly index: number
  readonly emoji: string
  readonly label: string
  /** 다음 단계에 필요한 누적 돌봄. 마지막 단계면 null */
  readonly nextAt: number | null
}

/**
 * 성장 사다리. 이모지라 외부 이미지 없이 바로 된다 (CSP OK).
 * 데이터라 동물을 바꾸고 싶으면 여기만 고치면 된다.
 */
const STAGES: readonly { emoji: string; label: string; at: number }[] = [
  { emoji: '🥚', label: '알', at: 0 },
  { emoji: '🐣', label: '갓 태어났어요', at: 3 },
  { emoji: '🐥', label: '아기새', at: 8 },
  { emoji: '🐤', label: '쑥쑥 자라요', at: 15 },
  { emoji: '🐔', label: '다 컸어요!', at: 25 },
]

/**
 * INV-PET-03 — careCount 에 대해 단조 비감소. 절대 후퇴하지 않는다.
 */
export function petStage(careCount: number): PetStage {
  const n = Math.max(0, careCount)

  let index = 0
  for (let i = 0; i < STAGES.length; i++) {
    if (n >= STAGES[i]!.at) index = i
  }

  const stage = STAGES[index]!
  const next = STAGES[index + 1]
  return {
    index,
    emoji: stage.emoji,
    label: stage.label,
    nextAt: next ? next.at : null,
  }
}
