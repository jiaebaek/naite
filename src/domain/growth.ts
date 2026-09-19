/**
 * 성장 좌표 계산 (SSOT §5-B · 데이터 [14]/[15]). **결정적 · AI 아님.**
 *
 * 좌표(GrowthState)는 저장하지 않고 Evidence 로 계산한다 → 근거가 바뀌면 좌표도 바뀐다(성장 반영).
 *   1. behavior 켜짐 = Evidence 존재(부모 관찰 / 활동·등원 커버 / 이룸 중 하나라도).
 *   2. observedOrder = 켜진 behavior 중 최고 order (내부 ordinal · 부모 비노출).
 *   3. parentLabel = 그 order 서술(0=아직 덜 보임=다음 경험, 결핍 아님).
 *   4. isStrength = 지금 모습이 보이는 곳(observedOrder>0) → 🟢 먼저(강점 발견=안도). 덜 보임=🟡 다음 경험.
 * ⚠️ 나이로 도달 판정 금지(observedOrder를 "5세면 4 이상" 식으로 정하지 않는다).
 */
import { GROWTH_POINTS, growthPointsForClusters } from './standards/growthPoints'
import type { GrowthPoint, NextExperience } from './standards/growthPoints'

/** 한 GrowthPoint 의 근거 신호. */
export interface GrowthSignals {
  /** 부모 관찰(§10 체크)에서 '예'로 켜진 behavior order 들. */
  readonly observedOrders?: readonly number[]
  /** 이 묶음을 겨냥한 활동/등원이 있다 → 최소 '관심'(order 1) 근거. */
  readonly covered?: boolean
  /** 이 묶음이 이룸(achieved)으로 표시됨 → 상단(최고 order) 근거. */
  readonly achieved?: boolean
}

/** 계산된 좌표 — 부모에겐 parentLabel 만 보인다(observedOrder는 내부). */
export interface GrowthState {
  readonly growthPointId: string
  readonly observedOrder: number
  readonly parentLabel: string
  /** 지금 모습이 보이는 곳(🟢 강점 먼저) vs 아직 덜 보임(🟡 다음 경험). */
  readonly isStrength: boolean
  readonly maxOrder: number
}

const ORDER0_LABEL = '이 모습은 아직 덜 보여요 — 같이 해보면 나타나요'

const maxOrderOf = (gp: GrowthPoint): number => gp.behaviors.reduce((m, b) => Math.max(m, b.order), 0)

/** Evidence 신호 → 좌표. observedOrder = 켜진 최고 order(범위 clamp), label = 그 order 서술. */
export function growthStateOf(gp: GrowthPoint, signals: GrowthSignals): GrowthState {
  const maxOrder = maxOrderOf(gp)
  const lit: number[] = [...(signals.observedOrders ?? [])]
  if (signals.covered) lit.push(1)
  if (signals.achieved) lit.push(maxOrder)
  const raw = lit.length > 0 ? Math.max(...lit) : 0
  const observedOrder = Math.max(0, Math.min(maxOrder, raw))
  const parentLabel = observedOrder === 0
    ? ORDER0_LABEL
    : gp.behaviors.find((b) => b.order === observedOrder)?.label ?? ORDER0_LABEL
  return { growthPointId: gp.id, observedOrder, parentLabel, isStrength: observedOrder > 0, maxOrder }
}

/** 이 좌표(observedOrder)에서 제안할 다음 경험. uptoOrder 오름차순 첫 매칭. 없으면 null. */
export function nextExperienceOf(gp: GrowthPoint, observedOrder: number): NextExperience | null {
  return [...gp.nextExperiences].sort((a, b) => a.uptoOrder - b.uptoOrder).find((n) => observedOrder <= n.uptoOrder) ?? null
}

/** GrowthPoint 별 신호를 만드는 헬퍼(App 이 기존 커버리지·이룸·관찰에서 모은다). */
export function signalsFor(
  gp: GrowthPoint,
  opts: {
    readonly coveredClusterIds: ReadonlySet<string>
    readonly achievedClusterIds: ReadonlySet<string>
    readonly observedOrdersByGp?: Readonly<Record<string, readonly number[]>>
  },
): GrowthSignals {
  return {
    observedOrders: opts.observedOrdersByGp?.[gp.id] ?? [],
    covered: opts.coveredClusterIds.has(gp.clusterId),
    achieved: opts.achievedClusterIds.has(gp.clusterId),
  }
}

/** 한 영역의 GrowthPoint 좌표들 — 🟢(보이는 모습) 먼저, order 높은 순(강점 먼저 · §5-B 원리①). */
export function areaGrowthProfile(
  domain: string,
  clusterIds: ReadonlySet<string>,
  opts: {
    readonly coveredClusterIds: ReadonlySet<string>
    readonly achievedClusterIds: ReadonlySet<string>
    readonly observedOrdersByGp?: Readonly<Record<string, readonly number[]>>
  },
): readonly GrowthState[] {
  return growthPointsForClusters(clusterIds)
    .filter((gp) => gp.domain === domain)
    .map((gp) => growthStateOf(gp, signalsFor(gp, opts)))
    .sort((a, b) => Number(b.isStrength) - Number(a.isStrength) || b.observedOrder - a.observedOrder)
}

/** 전 좌표에서 근거가 되는 개별 성취기준 id 전부(참조 무결성·테스트용). */
export function allGrowthSourceRefs(): readonly string[] {
  return [...new Set(GROWTH_POINTS.flatMap((g) => [...g.sourceRefs, ...g.behaviors.map((b) => b.sourceRef)]))]
}

// ── §10 관찰 체크: 관찰행동(behavior) 답변 → 좌표 신호 ──
export type ObsAnswer = 'yes' | 'not-yet' | 'unknown'

/** 관찰 답변 키 = `${gpId}#${order}`. */
export const behaviorKey = (gpId: string, order: number): string => `${gpId}#${order}`

/** 관찰 답변에서 GrowthPoint별 '예'로 켜진 order 목록(좌표 계산 입력). */
export function observedOrdersFrom(answers: Readonly<Record<string, ObsAnswer>>): Record<string, readonly number[]> {
  const out: Record<string, number[]> = {}
  for (const [key, ans] of Object.entries(answers)) {
    if (ans !== 'yes') continue
    const hash = key.lastIndexOf('#')
    if (hash < 0) continue
    const gpId = key.slice(0, hash)
    const order = Number(key.slice(hash + 1))
    if (!gpId || !Number.isFinite(order)) continue
    ;(out[gpId] ??= []).push(order)
  }
  return out
}

/** 한 영역의 현재 band GrowthPoint 들(관찰 체크 UI 문항 소스). */
export function growthPointsOfDomain(domain: string, clusterIds: ReadonlySet<string>): readonly GrowthPoint[] {
  return growthPointsForClusters(clusterIds).filter((g) => g.domain === domain)
}

// ── §11 재방문 델타: 지난번 대비 새로 나타난 좌표 모습 ──
export interface GrowthSignalOpts {
  readonly coveredClusterIds: ReadonlySet<string>
  readonly achievedClusterIds: ReadonlySet<string>
  readonly observedOrdersByGp?: Readonly<Record<string, readonly number[]>>
}

/** order → 부모 서술(0=아직 덜 보임). */
export function parentLabelOf(gp: GrowthPoint, order: number): string {
  if (order <= 0) return ORDER0_LABEL
  return gp.behaviors.find((b) => b.order === order)?.label ?? ORDER0_LABEL
}

/** 현재 시기 전 GrowthPoint 의 observedOrder 맵(재방문 기준선 저장·비교용). */
export function currentGrowthOrders(clusterIds: ReadonlySet<string>, opts: GrowthSignalOpts): Record<string, number> {
  const out: Record<string, number> = {}
  for (const gp of growthPointsForClusters(clusterIds)) {
    out[gp.id] = growthStateOf(gp, signalsFor(gp, opts)).observedOrder
  }
  return out
}

export interface GrowthDeltaItem {
  readonly growthPointId: string
  readonly domain: string
  readonly name: string
  readonly label: string
}

/** 지난번(seen) 대비 order 가 오른 좌표들 = "새로 나타난 모습"(재방문 델타). */
export function growthDelta(
  seen: Readonly<Record<string, number>>,
  current: Readonly<Record<string, number>>,
): readonly GrowthDeltaItem[] {
  const items: GrowthDeltaItem[] = []
  for (const gp of GROWTH_POINTS) {
    const cur = current[gp.id]
    if (cur === undefined || cur <= 0) continue
    if (cur > (seen[gp.id] ?? 0)) {
      items.push({ growthPointId: gp.id, domain: gp.domain, name: gp.name, label: parentLabelOf(gp, cur) })
    }
  }
  return items
}
