/**
 * 활동유형 → 후보목표 프리셋 (SSOT §5 · 큐레이션 원본 docs/10-프리셋-활동목표-큐레이션.md).
 *
 * 학원/활동 등록 시 앱이 **주 후보목표를 미리 체크된 제안**으로 띄우고 부모가 원터치 확인·조정한다(신뢰 속성 ③).
 * ⚠️ 이 표는 전략 산출물(docs/10)을 **그대로 인코딩**한 것이다. 임의로 매핑을 추가/변경하지 말 것.
 *   - 3필터 통과 = primary(자동 제안). ①만(곁다리) = secondary(부모 opt-in).
 *   - band: 취학 전 = `primary`(nuri-*) · 초1~2 = `primaryElem`(std-*). 엔진은 아이 현재 band 것만 적용·카운트.
 *     MVP는 취학 전(nuri-*)만 큐레이션(ICP가 만 5세). 초1~2 `primaryElem` 은 확장 과제 — 지금은 비움.
 *   - 가드레일(부풀리기 금지): primary·primaryElem 은 **각 band별 1영역·목표 ≤2** (presetGuardrailViolations).
 *   - why = 왜 이 활동이 이 목표를 겨냥하나(짧은 한 줄). 연결 시트 노출(신뢰 ②).
 *     목표 자체의 공교육 근거 배지는 Standard.provenance 가 제공 → 프리셋엔 sourceRef 불필요.
 *   - reject = 학원 홍보문구(마케팅 언어). 근거로 쓰지 않는다(신뢰 속성 ④) — 경고·표시용.
 *   - 목표 id 원천 = child2021.ts (누리 nuri-*). 취학 전 기준이라 primary 는 nuri-*.
 *   - 영어: primary=[] (공교육 매핑 없음 · 초3 시작). 자체목표(customGoals)로만 연결.
 */
import type { Domain, Standard, StandardId } from '../types'

export interface ActivityPreset {
  readonly type: string
  readonly domain: Domain
  /** 취학 전(nuri-*) 자동 제안(3필터 통과). 가드레일 대상: 1영역·≤2. */
  readonly primary: readonly StandardId[]
  /** 초1~2(std-*) 자동 제안. 현재 대부분 미큐레이션(확장 과제) — 있으면 band 가드레일 대상. */
  readonly primaryElem?: readonly StandardId[]
  /** 곁다리(①주목적만). 기본 미선택, 부모 opt-in. */
  readonly secondary?: readonly StandardId[]
  /** 왜 이 활동이 이 목표를 겨냥하나(짧은 한 줄). 연결 시트 노출(신뢰 ②). */
  readonly why: string
  /** 오버클레임(마케팅) 문구 — 근거로 쓰지 않음. 경고·표시용. */
  readonly reject?: readonly string[]
  /** 한글/영어/수학 등 분기 주의 */
  readonly note?: string
}

export const ACTIVITY_PRESETS: readonly ActivityPreset[] = [
  { type: '태권도', domain: '예체능', primary: ['nuri-phy-3', 'nuri-phy-4'], secondary: ['nuri-soc-9', 'nuri-soc-8'], why: '이동·제자리·도구를 쓰는 신체활동에 자발적으로 참여한다', reject: ['인성교육'] },
  { type: '유아체육', domain: '예체능', primary: ['nuri-phy-3', 'nuri-phy-4'], secondary: ['nuri-soc-5'], why: '이동·제자리·도구를 쓰는 신체활동에 자발적으로 참여한다', reject: ['두뇌', '집중력'] },
  { type: '축구', domain: '예체능', primary: ['nuri-phy-3', 'nuri-phy-4'], secondary: ['nuri-soc-5', 'nuri-soc-9'], why: '이동·제자리·도구를 쓰는 신체활동에 자발적으로 참여한다', reject: ['리더십', '사회성'] },
  { type: '수영', domain: '예체능', primary: ['nuri-phy-3', 'nuri-phy-4'], secondary: ['nuri-saf-1'], why: '물에서의 이동운동에 자발적으로 참여한다', reject: ['심폐', '두뇌'] },
  { type: '발레', domain: '예체능', primary: ['nuri-art-5', 'nuri-phy-2'], secondary: ['nuri-art-4'], why: '움직임과 춤으로 표현하고 움직임을 조절한다', reject: ['자세교정', '집중력'] },
  { type: '미술', domain: '예체능', primary: ['nuri-art-6'], secondary: ['nuri-art-2', 'nuri-art-8'], why: '다양한 미술 재료와 도구로 생각과 느낌을 표현한다', reject: ['창의력', '소근육', '두뇌'] },
  { type: '피아노', domain: '예체능', primary: ['nuri-art-4'], secondary: ['nuri-art-8'], why: '악기로 간단한 소리와 리듬을 만든다', reject: ['두뇌', '집중력', '수학'] },
  { type: '한글', domain: '국어', primary: ['nuri-com-8', 'nuri-com-7'], secondary: ['nuri-com-9'], why: '글자 읽기에 관심을 가지고 말과 글의 관계에 관심을 가진다', reject: ['해득', '문해력 완성'], note: '한글학원=글자 읽기 "관심"(챙기는중)만. 해득(이룸)은 부모 확인. 해득 자체는 초1 2국04-01.' },
  { type: '사고력수학', domain: '수학', primary: ['nuri-nat-8', 'nuri-nat-6'], secondary: ['nuri-nat-9'], why: '규칙을 찾고 위치·방향·모양을 탐구한다', reject: ['연산', '선행'], note: '취학 전 누리엔 연산 항목 없음. 연산형이라도 매핑은 수량·규칙 선.' },
  { type: '독서', domain: '국어', primary: ['nuri-com-10', 'nuri-com-1'], secondary: ['nuri-com-11', 'nuri-com-2'], why: '책에 관심을 갖고 이야기를 들으며 상상한다', reject: ['문해력', '논술'] },
  { type: '영어', domain: '영어', primary: [], why: '공교육 기준이 없어 자체목표(customGoals)로만 연결한다', reject: ['공교육 매핑'], note: '초3 시작. 취학 전·초1~2 공교육 기준 없음 — 자체목표(customGoals)로만 연결. nuri/std 자동 매핑 금지.' },
]

/** 활동유형(type)으로 프리셋을 찾는다. 없으면 undefined(→ 자동 제안 안 함, 원칙3). */
export function presetByType(type: string): ActivityPreset | undefined {
  return ACTIVITY_PRESETS.find((p) => p.type === type)
}

/**
 * 이 프리셋이 **아이 현재 band**에서 제안하는 목표 id (미리 체크될 primary).
 *   - primary(nuri-*) ∪ primaryElem(std-*) 중 `currentGoalIds`(현재 시기 목표)에 드는 것만.
 *   - band 가 맞지 않거나(std 아이에 nuri primary 등) 큐레이션이 없으면 빈 배열 → 제안 안 함(원칙3).
 *   - 결과는 프리셋 band별 가드레일(≤2·1영역)을 이미 통과한 것에서 나온다(과소청구).
 */
export function suggestedTargets(
  preset: ActivityPreset,
  currentGoalIds: ReadonlySet<StandardId>,
): readonly StandardId[] {
  return [...preset.primary, ...(preset.primaryElem ?? [])].filter((id) => currentGoalIds.has(id))
}

/**
 * 한 band(primary 또는 primaryElem) 배열의 부풀리기 위반을 모은다.
 * 규칙: 목표 ≤2 · 단일 영역 · 그 영역 = preset.domain · 존재하는 목표.
 */
function bandViolations(
  band: string,
  ids: readonly StandardId[],
  presetDomain: Domain,
  byId: ReadonlyMap<StandardId, Standard>,
): readonly string[] {
  const violations: string[] = []
  if (ids.length > 2) violations.push(`${band} 목표 ${ids.length}개 — 최대 2개`)
  const domains = new Set<Domain>()
  for (const id of ids) {
    const s = byId.get(id)
    if (s === undefined) {
      violations.push(`존재하지 않는 목표 ${id}`)
      continue
    }
    domains.add(s.domain)
  }
  if (domains.size > 1) violations.push(`${band} 이 ${domains.size}개 영역에 걸침 — 1영역이어야 함`)
  for (const d of domains) {
    if (d !== presetDomain) violations.push(`${band} 주 영역 불일치: ${d} ≠ ${presetDomain}`)
  }
  return violations
}

/**
 * 부풀리기 가드레일 (SSOT §5). 자동 제안(primary·primaryElem)은 **각 band별 1영역·목표 ≤2**여야 한다.
 * 위반 사유 목록을 돌려준다(빈 배열 = 통과). 관련성으로 과잉매핑하면 여기서 잡힌다.
 */
export function presetGuardrailViolations(
  preset: ActivityPreset,
  standards: readonly Standard[],
): readonly string[] {
  const byId = new Map(standards.map((s) => [s.id, s]))
  return [
    ...bandViolations('primary', preset.primary, preset.domain, byId),
    ...bandViolations('primaryElem', preset.primaryElem ?? [], preset.domain, byId),
  ]
}
