/**
 * 활동유형 → 후보목표 프리셋 (SSOT §5 · 큐레이션 원본 docs/10-프리셋-활동목표-큐레이션.md).
 *
 * 학원/활동 등록 시 앱이 **주 후보목표를 제안**하고 부모가 확인·조정한다(신뢰 속성 ③).
 * ⚠️ 이 표는 전략 산출물(docs/10)을 **그대로 인코딩**한 것이다. 임의로 매핑을 추가/변경하지 말 것.
 *   - 3필터 통과 = primary(자동 제안). ①만(곁다리) = secondary(부모 opt-in).
 *   - 가드레일(부풀리기 금지): primary 는 **1영역·목표 ≤2** (presetGuardrailViolations 로 자동 검사).
 *   - reject = 학원 홍보문구(마케팅 언어). 근거로 쓰지 않는다(신뢰 속성 ④) — 경고·표시용.
 *   - 목표 id 원천 = child2021.ts (누리 nuri-*). 취학 전 기준이라 primary 는 nuri-*.
 *   - 영어: primary=[] (공교육 매핑 없음 · 초3 시작). 자체목표(customGoals)로만 연결.
 */
import type { Domain, Standard, StandardId } from '../types'

export interface ActivityPreset {
  readonly type: string
  readonly domain: Domain
  /** 자동 제안(3필터 통과). 가드레일 대상: 1영역·≤2. */
  readonly primary: readonly StandardId[]
  /** 곁다리(①주목적만). 기본 미선택, 부모 opt-in. */
  readonly secondary?: readonly StandardId[]
  /** 오버클레임(마케팅) 문구 — 근거로 쓰지 않음. 경고·표시용. */
  readonly reject?: readonly string[]
  /** 한글/영어/수학 등 분기 주의 */
  readonly note?: string
}

export const ACTIVITY_PRESETS: readonly ActivityPreset[] = [
  { type: '태권도', domain: '예체능', primary: ['nuri-phy-3', 'nuri-phy-4'], secondary: ['nuri-soc-9', 'nuri-soc-8'], reject: ['인성교육'] },
  { type: '유아체육', domain: '예체능', primary: ['nuri-phy-3', 'nuri-phy-4'], secondary: ['nuri-soc-5'], reject: ['두뇌', '집중력'] },
  { type: '축구', domain: '예체능', primary: ['nuri-phy-3', 'nuri-phy-4'], secondary: ['nuri-soc-5', 'nuri-soc-9'], reject: ['리더십', '사회성'] },
  { type: '수영', domain: '예체능', primary: ['nuri-phy-3', 'nuri-phy-4'], secondary: ['nuri-saf-1'], reject: ['심폐', '두뇌'] },
  { type: '발레', domain: '예체능', primary: ['nuri-art-5', 'nuri-phy-2'], secondary: ['nuri-art-4'], reject: ['자세교정', '집중력'] },
  { type: '미술', domain: '예체능', primary: ['nuri-art-6'], secondary: ['nuri-art-2', 'nuri-art-8'], reject: ['창의력', '소근육', '두뇌'] },
  { type: '피아노', domain: '예체능', primary: ['nuri-art-4'], secondary: ['nuri-art-8'], reject: ['두뇌', '집중력', '수학'] },
  { type: '한글', domain: '국어', primary: ['nuri-com-8', 'nuri-com-7'], secondary: ['nuri-com-9'], reject: ['해득', '문해력 완성'], note: '한글학원=글자 읽기 "관심"(챙기는중)만. 해득(이룸)은 부모 확인. 해득 자체는 초1 2국04-01.' },
  { type: '사고력수학', domain: '수학', primary: ['nuri-nat-8', 'nuri-nat-6'], secondary: ['nuri-nat-9'], reject: ['연산', '선행'], note: '취학 전 누리엔 연산 항목 없음. 연산형이라도 매핑은 수량·규칙 선.' },
  { type: '독서', domain: '국어', primary: ['nuri-com-10', 'nuri-com-1'], secondary: ['nuri-com-11', 'nuri-com-2'], reject: ['문해력', '논술'] },
  { type: '영어', domain: '영어', primary: [], reject: ['공교육 매핑'], note: '초3 시작. 취학 전·초1~2 공교육 기준 없음 — 자체목표(customGoals)로만 연결. nuri/std 자동 매핑 금지.' },
]

/**
 * 부풀리기 가드레일 (SSOT §5). 주 매핑은 **1영역·목표 ≤2**여야 한다.
 * 위반 사유 목록을 돌려준다(빈 배열 = 통과). 관련성으로 과잉매핑하면 여기서 잡힌다.
 */
export function presetGuardrailViolations(
  preset: ActivityPreset,
  standards: readonly Standard[],
): readonly string[] {
  const violations: string[] = []
  if (preset.primary.length > 2) {
    violations.push(`주 목표 ${preset.primary.length}개 — 최대 2개`)
  }
  const byId = new Map(standards.map((s) => [s.id, s]))
  const domains = new Set<Domain>()
  for (const id of preset.primary) {
    const s = byId.get(id)
    if (s === undefined) {
      violations.push(`존재하지 않는 목표 ${id}`)
      continue
    }
    domains.add(s.domain)
  }
  if (domains.size > 1) {
    violations.push(`${domains.size}개 영역에 걸침 — 1영역이어야 함`)
  }
  for (const d of domains) {
    if (d !== preset.domain) violations.push(`주 영역 불일치: ${d} ≠ ${preset.domain}`)
  }
  return violations
}
