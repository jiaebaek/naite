/**
 * 교육과정 묶음(cluster) — 부모가 보는 목표 단위. (T7 · 큐레이션 원본 docs/11)
 *
 * 개별 성취기준(취학전 59 / 초1~2 100)은 너무 많고·복잡하고·이룸 판정이 어렵다.
 * 그래서 부모 화면 단위를 **내용범주·성취영역 묶음**으로 올린다. 묶음은 그 위의 그룹핑일 뿐,
 * 공교육 근거(개별 성취기준)는 그대로 유지된다 — 개별 std 는 묶음의 **근거 상세**.
 *
 *  - 커버리지·매핑·이룸 모두 **묶음 단위**(docs/11 §5).
 *  - member = child2021.ts 의 런타임 id (`nuri-*` / `std-*`). 묶음은 한 영역(domain) 안에서만 묶인다.
 *  - band: 취학 전 = `nuri` · 초1~2 = `elem`. 엔진은 아이 현재 band 묶음만 적용·카운트.
 *  - ⚠️ 임의로 묶음을 만들거나 member 를 바꾸지 말 것 — docs/11 §2 표 그대로 인코딩.
 */
import { STANDARDS_2021 } from './child2021'
import type { Domain, Standard, StandardId, YearMonth } from '../types'

export type Band = 'nuri' | 'elem'

export interface Cluster {
  readonly id: string
  readonly domain: Domain
  readonly band: Band
  /** 부모 화면에 보이는 묶음 이름 */
  readonly label: string
  /** 이 묶음에 속한 개별 성취기준(근거 상세). child2021 런타임 id. */
  readonly memberIds: readonly StandardId[]
}

const ALL_IDS = STANDARDS_2021.map((s) => s.id)
/** 접두어로 시작하는 모든 std id (예: 'std-2국01-' → 국어 듣기·말하기 성취기준 전부). */
const byPrefix = (prefix: string): readonly StandardId[] => ALL_IDS.filter((id) => id.startsWith(prefix))
/** 코드(접미)들을 런타임 std id 로. */
const els = (...codes: string[]): readonly StandardId[] => codes.map((c) => `std-${c}`)
const nrs = (...codes: string[]): readonly StandardId[] => codes.map((c) => `nuri-${c}`)

// ── 취학 전 (band=nuri · 내용범주 기준) — 14묶음 (docs/11 §2-A) ──
const NURI_CLUSTERS: readonly Cluster[] = [
  { id: 'cl-nuri-ko-listen', domain: '국어', band: 'nuri', label: '듣기·말하기', memberIds: nrs('com-1', 'com-2', 'com-3', 'com-4', 'com-5', 'com-6') },
  { id: 'cl-nuri-ko-literacy', domain: '국어', band: 'nuri', label: '읽기·쓰기 관심', memberIds: nrs('com-7', 'com-8', 'com-9') },
  { id: 'cl-nuri-ko-book', domain: '국어', band: 'nuri', label: '책·이야기 즐기기', memberIds: nrs('com-10', 'com-11', 'com-12') },
  { id: 'cl-nuri-ma-explore', domain: '수학', band: 'nuri', label: '생활 속 수·규칙·공간', memberIds: nrs('nat-5', 'nat-6', 'nat-7', 'nat-8', 'nat-9') },
  { id: 'cl-nuri-sci-inquiry', domain: '과학·탐구', band: 'nuri', label: '탐구하는 태도', memberIds: nrs('nat-1', 'nat-2', 'nat-3') },
  { id: 'cl-nuri-sci-things', domain: '과학·탐구', band: 'nuri', label: '사물·도구 탐색', memberIds: nrs('nat-4', 'nat-10') },
  { id: 'cl-nuri-sci-nature', domain: '과학·탐구', band: 'nuri', label: '자연·생명', memberIds: nrs('nat-11', 'nat-12', 'nat-13') },
  { id: 'cl-nuri-soc-self', domain: '사회·인성', band: 'nuri', label: '나 알기·자기조절', memberIds: nrs('soc-1', 'soc-2', 'soc-3') },
  { id: 'cl-nuri-soc-together', domain: '사회·인성', band: 'nuri', label: '더불어 살기', memberIds: nrs('soc-4', 'soc-5', 'soc-6', 'soc-7', 'soc-8', 'soc-9') },
  { id: 'cl-nuri-soc-world', domain: '사회·인성', band: 'nuri', label: '사회·세상 관심', memberIds: nrs('soc-10', 'soc-11', 'soc-12') },
  { id: 'cl-nuri-pe-art', domain: '예체능', band: 'nuri', label: '예술 경험(표현·감상)', memberIds: nrs('art-1', 'art-2', 'art-3', 'art-4', 'art-5', 'art-6', 'art-7', 'art-8', 'art-9', 'art-10') },
  { id: 'cl-nuri-pe-body', domain: '예체능', band: 'nuri', label: '신체활동', memberIds: nrs('phy-1', 'phy-2', 'phy-3', 'phy-4') },
  { id: 'cl-nuri-hs-health', domain: '건강·안전', band: 'nuri', label: '건강 습관', memberIds: nrs('hlt-1', 'hlt-2', 'hlt-3', 'hlt-4') },
  { id: 'cl-nuri-hs-safety', domain: '건강·안전', band: 'nuri', label: '안전 습관', memberIds: nrs('saf-1', 'saf-2', 'saf-3', 'saf-4') },
]

// ── 초1~2 (band=elem · 성취영역 기준) — 18묶음 (docs/11 §2-B) ──
const ELEM_CLUSTERS: readonly Cluster[] = [
  { id: 'cl-el-ko-listen', domain: '국어', band: 'elem', label: '듣기·말하기', memberIds: byPrefix('std-2국01-') },
  { id: 'cl-el-ko-read', domain: '국어', band: 'elem', label: '읽기', memberIds: byPrefix('std-2국02-') },
  { id: 'cl-el-ko-write', domain: '국어', band: 'elem', label: '쓰기', memberIds: byPrefix('std-2국03-') },
  { id: 'cl-el-ko-hangul', domain: '국어', band: 'elem', label: '한글·문법', memberIds: byPrefix('std-2국04-') },
  { id: 'cl-el-ko-lit', domain: '국어', band: 'elem', label: '문학', memberIds: byPrefix('std-2국05-') },
  { id: 'cl-el-ko-media', domain: '국어', band: 'elem', label: '매체', memberIds: byPrefix('std-2국06-') },
  { id: 'cl-el-ma-num', domain: '수학', band: 'elem', label: '수와 연산', memberIds: byPrefix('std-2수01-') },
  { id: 'cl-el-ma-pattern', domain: '수학', band: 'elem', label: '규칙', memberIds: byPrefix('std-2수02-') },
  { id: 'cl-el-ma-shape', domain: '수학', band: 'elem', label: '도형·측정', memberIds: byPrefix('std-2수03-') },
  { id: 'cl-el-ma-data', domain: '수학', band: 'elem', label: '자료·분류', memberIds: byPrefix('std-2수04-') },
  { id: 'cl-el-sci-nature', domain: '과학·탐구', band: 'elem', label: '자연·계절 탐구', memberIds: els('2슬01-04', '2슬03-02', '2슬03-04') },
  { id: 'cl-el-sci-things', domain: '과학·탐구', band: 'elem', label: '사물·도구·조사', memberIds: els('2슬02-04', '2슬04-01', '2슬04-02', '2슬04-03', '2슬04-04') },
  { id: 'cl-el-soc-self', domain: '사회·인성', band: 'elem', label: '자기이해·생활습관', memberIds: els('2바01-02', '2바03-01', '2바04-04', '2슬01-02', '2슬03-01') },
  { id: 'cl-el-soc-community', domain: '사회·인성', band: 'elem', label: '공동체·배려', memberIds: els('2바01-03', '2바02-01', '2바02-04', '2바03-03', '2바03-04', '2바04-01', '2바04-02', '2바04-03') },
  { id: 'cl-el-soc-world', domain: '사회·인성', band: 'elem', label: '사회·세상 알기', memberIds: els('2바02-02', '2바02-03', '2슬01-03', '2슬02-01', '2슬02-02', '2슬02-03', '2슬03-03') },
  { id: 'cl-el-pe-body', domain: '예체능', band: 'elem', label: '몸·놀이', memberIds: els('2즐01-02', '2즐03-02') },
  { id: 'cl-el-pe-art', domain: '예체능', band: 'elem', label: '문화예술·표현', memberIds: els('2즐02-01', '2즐02-02', '2즐02-03', '2즐02-04', '2즐03-03', '2즐04-01', '2즐04-02', '2즐04-03', '2즐04-04') },
  { id: 'cl-el-hs', domain: '건강·안전', band: 'elem', label: '건강·안전 생활', memberIds: els('2바01-01', '2즐01-01', '2즐03-01', '2즐03-04', '2슬01-01') },
]

export const CLUSTERS: readonly Cluster[] = [...NURI_CLUSTERS, ...ELEM_CLUSTERS]

/** id → 묶음. */
export function clusterById(id: string): Cluster | undefined {
  return CLUSTERS.find((c) => c.id === id)
}

/** 이 std 가 속한 묶음(있으면). 개별 std → 묶음 롤업용. */
export function clusterOfStandard(standardId: StandardId): Cluster | undefined {
  return CLUSTERS.find((c) => c.memberIds.includes(standardId))
}

const byId = new Map(STANDARDS_2021.map((s) => [s.id, s]))

/**
 * 묶음을 **화면 목표(Standard 형태)** 로 표현한다 (T7 모델 A · docs/11 §5).
 *   - id = 묶음 id → 활동은 이 id 를 targetIds 로 겨냥한다(커버리지 단위 = 묶음).
 *   - statement = 묶음 이름. baselinePeriod·출처 문서 = 대표 멤버 std 에서 가져온다(공교육 근거 그대로).
 *   - 개별 성취기준 문장은 근거 상세로만 남는다(memberIds → child2021).
 * 이렇게 하면 coverage·today·guards 등 `Standard[]` 를 받는 기존 도메인이 묶음을 그대로 다룬다.
 */
export function clusterAsStandard(cluster: Cluster): Standard {
  const rep = byId.get(cluster.memberIds[0]!)!
  return {
    id: cluster.id,
    domain: cluster.domain,
    baselinePeriod: rep.baselinePeriod,
    statement: cluster.label,
    source: { document: rep.source!.document, code: cluster.id },
    origin: '공교육',
  }
}

/** 현재 시기(now)에 해당하는 band 의 묶음들을 화면 목표(Standard)로 반환한다. */
export function currentClusterStandards(now: YearMonth): readonly Standard[] {
  return CLUSTERS.map(clusterAsStandard).filter(
    (s) => s.baselinePeriod.start <= now && s.baselinePeriod.end >= now,
  )
}

/** 현재 시기 band 의 묶음 id 집합 (프리셋 제안을 현재 band 로 거르는 데 쓴다). */
export function currentClusterIds(now: YearMonth): ReadonlySet<string> {
  return new Set(currentClusterStandards(now).map((s) => s.id))
}

/** 이 시기의 band (nuri/elem). 대상 범위 밖이면 null. 온보딩 칩 세트 분기에 쓴다. */
export function bandOfMonth(now: YearMonth): Band | null {
  const cs = currentClusterStandards(now)
  const first = cs[0]
  return first ? (clusterById(first.id)?.band ?? null) : null
}
