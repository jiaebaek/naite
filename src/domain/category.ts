/**
 * 공교육 원문 목표의 **내용범주(교육과정 구조)**. B′ — 화면 목표를 원문으로 보여줄 때
 * 목표를 "내용범주별"로 묶기 위한 순수 라벨 함수.
 *
 * ⚠️ 우리가 지어낸 분류가 아니라 교육과정 구조 그대로다. 신뢰의 핵심이므로 임의 라벨 금지.
 *   - 누리과정        → source.code 에 '영역 · 내용범주' 원문이 이미 들어있다(그대로 반환).
 *   - 초1~2 국어·수학 → 교과 + 성취기준 코드의 영역 번호(2022 개정 영역명, 확정된 것만).
 *   - 초1~2 통합교과  → 교과명(바른/슬기로운/즐거운 생활). 하위 영역명은 만들지 않는다.
 *   - 자체(영어 등)   → '우리 목표' (공교육 근거 없음).
 */
import type { Standard } from './types'

/** 2022 개정 국어과 영역명 (성취기준 코드 2국NN) */
const 국어영역: Readonly<Record<string, string>> = {
  '01': '듣기·말하기', '02': '읽기', '03': '쓰기', '04': '문법', '05': '문학', '06': '매체',
}
/** 2022 개정 수학과 영역명 (성취기준 코드 2수NN) */
const 수학영역: Readonly<Record<string, string>> = {
  '01': '수와 연산', '02': '변화와 관계', '03': '도형과 측정', '04': '자료와 가능성',
}

export function categoryOf(std: Standard): string {
  // 누리과정: 내용범주 원문이 source.code 에 그대로 있다 ('영역 · 내용범주')
  if (std.origin === '공교육' && std.source?.code?.includes(' · ')) return std.source.code

  // 초1~2 성취기준: 코드로 교과·영역을 판별 (예: 2국01-01 → 국어 · 듣기·말하기)
  const m = /^2([국수바슬즐])(\d\d)/.exec(std.source?.code ?? '')
  if (m) {
    const subj = m[1]
    const area = m[2]!
    if (subj === '국') return `국어 · ${국어영역[area] ?? '국어'}`
    if (subj === '수') return `수학 · ${수학영역[area] ?? '수학'}`
    if (subj === '바') return '바른 생활'
    if (subj === '슬') return '슬기로운 생활'
    if (subj === '즐') return '즐거운 생활'
  }

  if (std.origin === '자체') return '우리 목표'
  return std.domain
}
