/**
 * 활동유형 → 후보 **묶음(cluster)** 프리셋 (T7 · 큐레이션 원본 docs/11 §4).
 *
 * 학원/활동 등록 시 앱이 **주 후보 묶음을 미리 체크된 제안**으로 띄우고 부모가 원터치 확인·조정한다(신뢰 ③).
 * ⚠️ docs/11 §4 표를 **그대로 인코딩**한 것. 임의로 매핑을 추가/변경하지 말 것.
 *   - band: 취학 전 = `primary`(cl-nuri-*) · 초1~2 = `primaryElem`(cl-el-*). 아이 현재 band 것만 적용.
 *   - 가드레일(부풀리기 금지): 각 band **≤2묶음·단일 영역**(= preset.domain). presetGuardrailViolations.
 *   - 활동은 이 묶음 id 를 targetIds 로 겨냥한다(커버리지 단위 = 묶음, 모델 A).
 *   - 영어 = 매핑 없음(초3 시작 · 자체목표 customGoals 로만 연결). 매칭 없으면 자동 제안 안 함(원칙3).
 *   - why = 왜 이 활동이 이 묶음을 겨냥하나(짧은 한 줄). 연결 시트 노출(신뢰 ②).
 */
import { CLUSTERS } from './clusters'
import type { Domain } from '../types'

export interface ActivityPreset {
  readonly type: string
  readonly domain: Domain
  /** 취학 전(nuri) 자동 제안 묶음 id. 가드레일: ≤2·1영역. */
  readonly primary: readonly string[]
  /** 초1~2(elem) 자동 제안 묶음 id. */
  readonly primaryElem?: readonly string[]
  /** 왜 이 활동이 이 묶음을 겨냥하나(짧은 한 줄). 연결 시트 노출(신뢰 ②). */
  readonly why: string
  /** 오버클레임(마케팅) 문구 — 근거로 쓰지 않음. 경고·표시용. */
  readonly reject?: readonly string[]
  /** 한글/영어/수학 등 분기 주의 */
  readonly note?: string
}

export const ACTIVITY_PRESETS: readonly ActivityPreset[] = [
  { type: '한글', domain: '국어', primary: ['cl-nuri-ko-literacy'], primaryElem: ['cl-el-ko-hangul', 'cl-el-ko-read'], why: '글자·읽기(취학 전=관심 / 초1~2=해득·읽기)', reject: ['해득', '문해력 완성'], note: '취학전은 "관심"만. 초1~2는 해득·읽기를 실제 겨냥하되 매핑은 챙기는중만(이룸=부모 확인).' },
  { type: '독서', domain: '국어', primary: ['cl-nuri-ko-book'], primaryElem: ['cl-el-ko-read', 'cl-el-ko-lit'], why: '책·이야기 즐기기, 읽기·문학', reject: ['문해력', '논술'] },
  { type: '논술', domain: '국어', primary: [], primaryElem: ['cl-el-ko-read', 'cl-el-ko-write'], why: '읽고 쓰기(초1~2)', note: '초1~2만.' },
  { type: '사고력수학', domain: '수학', primary: ['cl-nuri-ma-explore'], primaryElem: ['cl-el-ma-pattern', 'cl-el-ma-shape'], why: '규칙·도형·공간(취학 전 누리엔 연산 없음)', reject: ['연산', '선행'], note: '연산형이면 cl-el-ma-num.' },
  { type: '연산', domain: '수학', primary: [], primaryElem: ['cl-el-ma-num'], why: '수와 연산(초1~2 문제집)', note: '초1~2만.' },
  { type: '영어', domain: '영어', primary: [], primaryElem: [], why: '공교육 기준 없음(초3 시작) — 자체목표(customGoals)로만 연결', reject: ['공교육 매핑'], note: 'nuri/std 자동 매핑 금지.' },
  { type: '미술', domain: '예체능', primary: ['cl-nuri-pe-art'], primaryElem: ['cl-el-pe-art'], why: '예술 경험·표현', reject: ['창의력', '소근육', '두뇌'] },
  { type: '피아노', domain: '예체능', primary: ['cl-nuri-pe-art'], primaryElem: ['cl-el-pe-art'], why: '악기로 소리·리듬, 문화예술 향유', reject: ['두뇌', '집중력', '수학'] },
  { type: '발레', domain: '예체능', primary: ['cl-nuri-pe-art'], primaryElem: ['cl-el-pe-art'], why: '움직임·춤으로 표현', reject: ['자세교정', '집중력'] },
  { type: '태권도', domain: '예체능', primary: ['cl-nuri-pe-body'], primaryElem: ['cl-el-pe-body'], why: '몸을 쓰는 신체활동·놀이', reject: ['인성교육'] },
  { type: '유아체육', domain: '예체능', primary: ['cl-nuri-pe-body'], primaryElem: ['cl-el-pe-body'], why: '몸을 쓰는 신체활동·놀이', reject: ['두뇌', '집중력'] },
  { type: '축구', domain: '예체능', primary: ['cl-nuri-pe-body'], primaryElem: ['cl-el-pe-body'], why: '몸을 쓰는 신체활동·놀이', reject: ['리더십', '사회성'] },
  { type: '수영', domain: '예체능', primary: ['cl-nuri-pe-body'], primaryElem: ['cl-el-pe-body'], why: '몸을 쓰는 신체활동·놀이', reject: ['심폐', '두뇌'] },
  { type: '코딩·로봇', domain: '과학·탐구', primary: [], primaryElem: ['cl-el-sci-things'], why: '사물·도구·조사 탐구(초1~2)', note: '초1~2만.' },
  { type: '보드게임', domain: '수학', primary: ['cl-nuri-ma-explore'], primaryElem: ['cl-el-ma-pattern'], why: '규칙·수·공간 놀이' },
  { type: '일기·글쓰기', domain: '국어', primary: [], primaryElem: ['cl-el-ko-write'], why: '쓰기(초1~2)', note: '초1~2만.' },
  { type: '바깥놀이', domain: '예체능', primary: ['cl-nuri-pe-body'], primaryElem: [], why: '몸을 쓰는 신체활동·놀이', note: '자연관찰은 부수(과학·탐구)로 가능.' },
]

/** 활동유형(type)으로 프리셋을 찾는다. 없으면 undefined(→ 자동 제안 안 함, 원칙3). */
export function presetByType(type: string): ActivityPreset | undefined {
  return ACTIVITY_PRESETS.find((p) => p.type === type)
}

/**
 * 이 프리셋이 **아이 현재 band**에서 제안하는 묶음 id (미리 체크될 primary).
 *   - primary(nuri) ∪ primaryElem(elem) 중 `currentClusterIds`(현재 시기 묶음)에 드는 것만.
 *   - band 가 맞지 않거나 큐레이션이 없으면 빈 배열 → 제안 안 함(원칙3).
 */
export function suggestedTargets(
  preset: ActivityPreset,
  currentClusterIds: ReadonlySet<string>,
): readonly string[] {
  return [...preset.primary, ...(preset.primaryElem ?? [])].filter((id) => currentClusterIds.has(id))
}

const CLUSTER_BY_ID = new Map(CLUSTERS.map((c) => [c.id, c]))

/** 한 band 묶음 배열의 부풀리기 위반: ≤2묶음 · 단일 영역 · 그 영역=preset.domain · 존재하는 묶음. */
function bandViolations(band: string, ids: readonly string[], presetDomain: Domain): readonly string[] {
  const violations: string[] = []
  if (ids.length > 2) violations.push(`${band} 묶음 ${ids.length}개 — 최대 2개`)
  const domains = new Set<Domain>()
  for (const id of ids) {
    const c = CLUSTER_BY_ID.get(id)
    if (c === undefined) {
      violations.push(`존재하지 않는 묶음 ${id}`)
      continue
    }
    domains.add(c.domain)
  }
  if (domains.size > 1) violations.push(`${band} 이 ${domains.size}개 영역에 걸침 — 1영역이어야 함`)
  for (const d of domains) {
    if (d !== presetDomain) violations.push(`${band} 주 영역 불일치: ${d} ≠ ${presetDomain}`)
  }
  return violations
}

/**
 * 부풀리기 가드레일 (SSOT §5). 자동 제안(primary·primaryElem)은 **각 band별 ≤2묶음·1영역**여야 한다.
 * 위반 사유 목록을 돌려준다(빈 배열 = 통과).
 */
export function presetGuardrailViolations(preset: ActivityPreset): readonly string[] {
  return [
    ...bandViolations('primary', preset.primary, preset.domain),
    ...bandViolations('primaryElem', preset.primaryElem ?? [], preset.domain),
  ]
}
